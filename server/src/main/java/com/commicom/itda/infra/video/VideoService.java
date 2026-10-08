package com.commicom.itda.infra.video;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        Path workPath = Paths.get(workDir, UUID.randomUUID().toString());
        Files.createDirectories(workPath);

        File audioFile = workPath.resolve("audio.mp3").toFile();
        File videoFile = workPath.resolve("output.mp4").toFile();
        File thumbnailFile = workPath.resolve("thumbnail.jpg").toFile();

        Files.write(audioFile.toPath(), audioBytes);

        // ── MP4 생성 ──────────────────────────────────────────────
        // 1080x1920 세로 영상, 단색 배경 + MP3 오디오
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
        log.info("FFmpeg 실행: {}", String.join(" ", command));
        Process process = new ProcessBuilder(command)
                .redirectErrorStream(true)
                .start();

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
