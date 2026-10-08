package com.commicom.itda.infra.video;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class VideoService {

    @Value("${video.ffmpeg-path}")
    private String ffmpegPath;

    @Value("${video.work-dir}")
    private String workDir;

    /**
     * 오디오(MP3)를 받아 배경색 + 오디오로 구성된 9:16 MP4 숏폼을 생성한다.
     * 텍스트(제목·스크립트)는 프론트엔드에서 오버레이로 처리한다.
     *
     * @param audioBytes MP3 바이트 배열 (Polly 결과)
     * @param bgColor    배경 색상 (예: "0x1a1a2e")
     * @return 생성된 MP4 파일 (호출자가 삭제 책임)
     */
    public VideoResult createVideo(byte[] audioBytes, String bgColor) throws IOException, InterruptedException {
        return createVideo(audioBytes, bgColor, null);
    }

    public VideoResult createVideo(byte[] audioBytes, String bgColor, File bgImage) throws IOException, InterruptedException {
        Path workPath = Paths.get(workDir, UUID.randomUUID().toString());
        Files.createDirectories(workPath);

        File audioFile = workPath.resolve("audio.mp3").toFile();
        File videoFile = workPath.resolve("output.mp4").toFile();
        File thumbnailFile = workPath.resolve("thumbnail.jpg").toFile();

        Files.write(audioFile.toPath(), audioBytes);

        // ── MP4 생성 ──────────────────────────────────────────────
        if (bgImage != null && bgImage.exists()) {
            // 이미지 배경: 1080x1920으로 크롭 + 오디오
            run(List.of(
                    ffmpegPath,
                    "-loop", "1",
                    "-i", bgImage.getAbsolutePath(),
                    "-i", audioFile.getAbsolutePath(),
                    "-shortest",
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "28",
                    "-c:a", "aac", "-b:a", "128k",
                    "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart",
                    "-y",
                    videoFile.getAbsolutePath()
            ));
        } else {
            // 단색 배경 폴백
            run(List.of(
                    ffmpegPath,
                    "-f", "lavfi",
                    "-i", "color=c=" + bgColor + ":size=1080x1920:rate=30",
                    "-i", audioFile.getAbsolutePath(),
                    "-shortest",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "28",
                    "-c:a", "aac", "-b:a", "128k",
                    "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart",
                    "-y",
                    videoFile.getAbsolutePath()
            ));
        }

        // ── 썸네일 추출 (1초 지점) ────────────────────────────────
        run(List.of(
                ffmpegPath,
                "-i", videoFile.getAbsolutePath(),
                "-ss", "00:00:01",
                "-frames:v", "1",
                "-q:v", "2",
                "-y",
                thumbnailFile.getAbsolutePath()
        ));

        // 오디오 길이 계산 (byte 크기 기반 추정: MP3 128kbps = 16KB/s)
        int durationSec = Math.max(1, (int) (audioBytes.length / 16_000));

        return new VideoResult(videoFile, thumbnailFile, durationSec, workPath);
    }

    /**
     * Runway AI 클립들을 이어붙여 오디오 + 자막이 포함된 숏폼을 생성한다.
     * 클립은 이미 생성된 MP4 파일들이며, -t 15로 15초로 고정한다.
     */
    public VideoResult stitchClipsToVideo(byte[] audioBytes, List<File> clipFiles, String title)
            throws IOException, InterruptedException {

        Path workPath = Paths.get(workDir, UUID.randomUUID().toString());
        Files.createDirectories(workPath);

        File audioFile = workPath.resolve("audio.mp3").toFile();
        File videoFile = workPath.resolve("output.mp4").toFile();
        File thumbnailFile = workPath.resolve("thumbnail.jpg").toFile();

        Files.write(audioFile.toPath(), audioBytes);

        // 오디오 실제 길이 기준 (MP3 128kbps = 16000 bytes/sec)
        int durationSec = Math.max(5, audioBytes.length / 16_000);

        // ── concat.txt ──────────────────────────────────────────────
        File concatFile = workPath.resolve("concat.txt").toFile();
        StringBuilder concat = new StringBuilder();
        for (File clip : clipFiles) {
            concat.append("file '").append(clip.getAbsolutePath().replace("\\", "/")).append("'\n");
        }
        Files.writeString(concatFile.toPath(), concat.toString(), StandardCharsets.UTF_8);

        // ── ASS 자막 (제목을 영상 내내 표시) ──────────────────────────
        File assFile = workPath.resolve("subs.ass").toFile();
        Files.writeString(assFile.toPath(), generateAssTitle(title, durationSec), StandardCharsets.UTF_8);

        // ── 클립 합성 + 오디오 + 자막 (-shortest: 오디오 끝나면 영상 종료) ──
        String scaleFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
        String subtitleFilter = "subtitles=subs.ass";

        try {
            run(List.of(
                    ffmpegPath,
                    "-f", "concat", "-safe", "0", "-i", concatFile.getAbsolutePath(),
                    "-i", audioFile.getAbsolutePath(),
                    "-shortest",
                    "-vf", scaleFilter + "," + subtitleFilter,
                    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                    "-c:a", "aac", "-b:a", "128k",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    "-y", videoFile.getAbsolutePath()
            ), workPath);
        } catch (RuntimeException e) {
            log.warn("[클립합성] 자막 실패, 자막 없이 재시도: {}", e.getMessage());
            run(List.of(
                    ffmpegPath,
                    "-f", "concat", "-safe", "0", "-i", concatFile.getAbsolutePath(),
                    "-i", audioFile.getAbsolutePath(),
                    "-shortest",
                    "-vf", scaleFilter,
                    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                    "-c:a", "aac", "-b:a", "128k",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    "-y", videoFile.getAbsolutePath()
            ), null);
        }

        // ── 썸네일 ────────────────────────────────────────────────
        run(List.of(ffmpegPath,
                "-i", videoFile.getAbsolutePath(),
                "-ss", "00:00:02", "-frames:v", "1", "-q:v", "2",
                "-y", thumbnailFile.getAbsolutePath()), null);

        return new VideoResult(videoFile, thumbnailFile, durationSec, workPath);
    }

    /**
     * 여러 이미지로 슬라이드쇼 + 자막이 포함된 숏폼을 생성한다.
     * 이미지가 부족하면 단색 배경으로 폴백한다.
     */
    public VideoResult createSlideshowVideo(byte[] audioBytes, List<File> bgImages, String title)
            throws IOException, InterruptedException {

        Path workPath = Paths.get(workDir, UUID.randomUUID().toString());
        Files.createDirectories(workPath);

        File audioFile = workPath.resolve("audio.mp3").toFile();
        File videoFile = workPath.resolve("output.mp4").toFile();
        File thumbnailFile = workPath.resolve("thumbnail.jpg").toFile();

        Files.write(audioFile.toPath(), audioBytes);

        int durationSec = Math.max(5, audioBytes.length / 16_000);

        // ── concat.txt 생성 ────────────────────────────────────────
        File concatFile = workPath.resolve("concat.txt").toFile();
        double secPerImage = (double) durationSec / bgImages.size();
        StringBuilder concat = new StringBuilder();
        for (File img : bgImages) {
            concat.append("file '").append(img.getAbsolutePath().replace("\\", "/")).append("'\n");
            concat.append("duration ").append(String.format("%.2f", secPerImage)).append("\n");
        }
        // concat demuxer는 마지막 파일을 duration 없이 한 번 더 써야 함
        concat.append("file '")
              .append(bgImages.get(bgImages.size() - 1).getAbsolutePath().replace("\\", "/"))
              .append("'\n");
        Files.writeString(concatFile.toPath(), concat.toString(), StandardCharsets.UTF_8);

        // ── ASS 자막 (제목을 영상 내내 표시) ──────────────────────────
        File assFile = workPath.resolve("subs.ass").toFile();
        Files.writeString(assFile.toPath(), generateAssTitle(title, durationSec), StandardCharsets.UTF_8);

        // ── MP4 생성 (자막 포함 시도 → 실패 시 자막 없이 폴백) ────
        String scaleFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
        String subtitleFilter = "subtitles=subs.ass";

        try {
            run(List.of(
                    ffmpegPath,
                    "-f", "concat", "-safe", "0", "-i", concatFile.getAbsolutePath(),
                    "-i", audioFile.getAbsolutePath(),
                    "-shortest",
                    "-vf", scaleFilter + "," + subtitleFilter,
                    "-c:v", "libx264", "-preset", "fast", "-crf", "28",
                    "-c:a", "aac", "-b:a", "128k",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    "-y", videoFile.getAbsolutePath()
            ), workPath);
        } catch (RuntimeException e) {
            log.warn("[슬라이드쇼] 자막 생성 실패, 자막 없이 재시도: {}", e.getMessage());
            run(List.of(
                    ffmpegPath,
                    "-f", "concat", "-safe", "0", "-i", concatFile.getAbsolutePath(),
                    "-i", audioFile.getAbsolutePath(),
                    "-shortest",
                    "-vf", scaleFilter,
                    "-c:v", "libx264", "-preset", "fast", "-crf", "28",
                    "-c:a", "aac", "-b:a", "128k",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    "-y", videoFile.getAbsolutePath()
            ), null);
        }

        // ── 썸네일 ────────────────────────────────────────────────
        run(List.of(ffmpegPath,
                "-i", videoFile.getAbsolutePath(),
                "-ss", "00:00:01", "-frames:v", "1", "-q:v", "2",
                "-y", thumbnailFile.getAbsolutePath()), null);

        return new VideoResult(videoFile, thumbnailFile, durationSec, workPath);
    }

    // ── 자막 생성 헬퍼 ────────────────────────────────────────────

    /** 제목을 영상 전체 길이 동안 화면 중앙에 표시 */
    private String generateAssTitle(String title, int durationSec) {
        String header =
               "[Script Info]\n" +
               "ScriptType: v4.00+\n" +
               "PlayResX: 1080\n" +
               "PlayResY: 1920\n" +
               "WrapStyle: 2\n\n" +
               "[V4+ Styles]\n" +
               "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n" +
               "Style: Default,Noto Sans CJK KR,28,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0.1,0,8,60,60,80,1\n\n" +
               "[Events]\n" +
               "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";
        return header +
               "Dialogue: 0," + toAssTime(0) + "," + toAssTime(durationSec) +
               ",Default,,0,0,0,," + title + "\n";
    }

    private String toAssTime(double seconds) {
        int h = (int) seconds / 3600;
        int m = ((int) seconds % 3600) / 60;
        int s = (int) seconds % 60;
        int cs = (int) ((seconds - (int) seconds) * 100);
        return String.format("%d:%02d:%02d.%02d", h, m, s, cs);
    }

    /** 카테고리별 배경 색상 반환 */
    public static String categoryColor(String category) {
        return switch (category) {
            case "RESTAURANT"           -> "0x8B2500";  // 어두운 적갈색
            case "CAFE_BAKERY_PUB"      -> "0x3E2723";  // 커피 브라운
            case "FOOD_RETAIL"          -> "0x1B5E20";  // 짙은 초록
            case "BEAUTY"               -> "0x880E4F";  // 딥 핑크
            case "FASHION"              -> "0x1A237E";  // 네이비
            default                    -> "0x1a1a2e";  // 기본 다크
        };
    }

    private void run(List<String> command) throws IOException, InterruptedException {
        run(command, null);
    }

    private void run(List<String> command, Path workingDir) throws IOException, InterruptedException {
        log.info("FFmpeg 실행: {}", String.join(" ", command));
        ProcessBuilder pb = new ProcessBuilder(command).redirectErrorStream(true);
        if (workingDir != null) pb.directory(workingDir.toFile());
        Process process = pb.start();

        String output = new String(process.getInputStream().readAllBytes());
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            log.error("FFmpeg 오류:\n{}", output);
            throw new RuntimeException("FFmpeg 실패 (exit=" + exitCode + ")");
        }
    }

    /** 생성된 파일 정보 */
    public record VideoResult(File videoFile, File thumbnailFile, int durationSec, Path workDir) {
        /** 임시 작업 디렉토리 삭제 */
        public void cleanup() {
            try {
                videoFile.delete();
                thumbnailFile.delete();
                workDir.toFile().delete();
            } catch (Exception ignored) {}
        }
    }
}
