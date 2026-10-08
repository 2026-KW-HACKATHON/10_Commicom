package com.commicom.itda.infra.video;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class MasterVideoService {

    private final VideoClipGenerator clipGenerator;

    @Value("${video.ffmpeg-path:ffmpeg}")
    private String ffmpegPath;

    private static final String CUT1_PROMPT =
            "Vertical 9:16 food close-up of %s. Steam gently rising, soft warm lighting, " +
            "shallow depth of field, cinematic food photography style. " +
            "No text, no captions, no logos, no watermarks.";

    private static final String CUT2_PROMPT =
            "Vertical 9:16 cozy small %s interior. Slow gentle pan across tables and seating area, " +
            "warm ambient lighting, welcoming atmosphere. " +
            "No text, no captions, no logos, no watermarks.";

    private static final Map<String, String> MENU_EN_MAP = Map.of(
            "떡볶이", "spicy Korean tteokbokki",
            "김밥", "Korean gimbap rolls",
            "돈가스", "crispy Korean pork cutlet"
    );

    private static final Map<String, String> CATEGORY_EN_MAP = Map.of(
            "RESTAURANT", "restaurant",
            "CAFE_BAKERY_PUB", "cafe"
    );

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    /**
     * 3컷 마스터 숏폼 영상 생성.
     *
     * @param menuImg       컷1용 대표 메뉴 사진 URL
     * @param interiorImg   컷2용 내부 사진 URL
     * @param tableImg      컷3용 상차림 사진 URL
     * @param storeName     가게 이름
     * @param signatureMenu 대표 메뉴 (한글)
     * @param address       가게 주소 (동 추출용)
     * @param category      StoreCategory.name() (e.g. "RESTAURANT")
     * @return 완성된 final.mp4 File (호출자가 삭제 책임)
     */
    public File createMasterVideo(String menuImg, String interiorImg, String tableImg,
                                  String storeName, String signatureMenu,
                                  String address, String category) throws Exception {
        Path workDir = Files.createTempDirectory("master-");
        try {
            // 폰트 추출
            Path fontsDir = workDir.resolve("fonts");
            Files.createDirectories(fontsDir);
            extractFont(fontsDir, "PretendardBold.otf");
            extractFont(fontsDir, "PretendardMedium.otf");

            boolean hasPretendard = fontsDir.resolve("PretendardBold.otf").toFile().exists();
            String titleFont = hasPretendard ? "Pretendard Bold" : "Noto Sans CJK KR";
            String subFont   = hasPretendard ? "Pretendard Medium" : "Noto Sans CJK KR";

            // 영문 프롬프트 매핑
            String menuEn    = MENU_EN_MAP.getOrDefault(signatureMenu,
                    (signatureMenu != null && !signatureMenu.isBlank()) ? signatureMenu : "Korean dish");
            String categoryEn = CATEGORY_EN_MAP.getOrDefault(category, "shop");

            // 컷1, 컷2: Runway/Mock 생성
            String prompt1 = String.format(CUT1_PROMPT, menuEn);
            String prompt2 = String.format(CUT2_PROMPT, categoryEn);

            log.info("[MasterVideo] 컷1/2 생성 시작");
            List<File> aiClips;
            try {
                aiClips = clipGenerator.generateParallel(
                        List.of(menuImg, interiorImg),
                        List.of(prompt1, prompt2),
                        workDir);
            } catch (Exception e) {
                throw new RuntimeException("컷1/2 생성 실패: " + e.getMessage(), e);
            }
            File cut1 = aiClips.get(0);
            File cut2 = aiClips.get(1);

            // 컷3: FFmpeg 줌 효과
            log.info("[MasterVideo] 컷3 줌 생성 시작");
            File cut3 = workDir.resolve("cut3.mp4").toFile();
            try {
                File tableImgFile = workDir.resolve("table_img.jpg").toFile();
                downloadFile(tableImg, tableImgFile);
                runFfmpeg(List.of(
                        ffmpegPath,
                        "-loop", "1",
                        "-i", tableImgFile.getAbsolutePath(),
                        "-vf", "scale=1440:2560," +
                               "zoompan=z='min(zoom+0.0008,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=720x1280:fps=25",
                        "-t", "5",
                        "-c:v", "libx264", "-preset", "fast", "-crf", "28",
                        "-pix_fmt", "yuv420p",
                        "-y", cut3.getAbsolutePath()
                ), workDir);
            } catch (Exception e) {
                throw new RuntimeException("컷3 줌 생성 실패: " + e.getMessage(), e);
            }

            // xfade concat (3클립 → merged.mp4)
            log.info("[MasterVideo] 영상 합성 시작");
            File merged = workDir.resolve("merged.mp4").toFile();
            try {
                runFfmpeg(buildXfadeCommand(cut1, cut2, cut3, merged), workDir);
            } catch (Exception e) {
                throw new RuntimeException("영상 합성 실패: " + e.getMessage(), e);
            }

            // ASS 자막 생성 및 적용
            String cleanStoreName = storeName.replaceFirst("^\\[샘플\\]\\s*", "");
            String subtitle = buildSubtitle(address, signatureMenu);

            File assFile = workDir.resolve("title.ass").toFile();
            Files.writeString(assFile.toPath(),
                    createTitleAss(cleanStoreName, subtitle, titleFont, subFont),
                    StandardCharsets.UTF_8);

            File finalVideo = workDir.resolve("final.mp4").toFile();
            try {
                runFfmpeg(List.of(
                        ffmpegPath,
                        "-i", merged.getAbsolutePath(),
                        "-vf", "subtitles=" + assFile.getAbsolutePath().replace("\\", "/"),
                        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                        "-c:a", "copy",
                        "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart",
                        "-y", finalVideo.getAbsolutePath()
                ), workDir);
            } catch (Exception e) {
                log.warn("[MasterVideo] 자막 적용 실패, 자막 없이 사용: {}", e.getMessage());
                Files.copy(merged.toPath(), finalVideo.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }

            // 결과를 workDir 바깥으로 이동 (finally 블록에서 workDir 삭제되기 전에)
            Path resultPath = Files.createTempFile("shortform-", ".mp4");
            Files.copy(finalVideo.toPath(), resultPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("[MasterVideo] 완료: {}", resultPath);
            return resultPath.toFile();

        } finally {
            deleteDir(workDir.toFile());
        }
    }

    // ── 내부 헬퍼 ────────────────────────────────────────────────────

    private List<String> buildXfadeCommand(File cut1, File cut2, File cut3, File output) {
        // 720x1280 25fps 정규화 후 xfade fade 0.3s
        // offset: 4.7(5s-0.3), 9.4(10s-0.6)
        return List.of(
                ffmpegPath,
                "-i", cut1.getAbsolutePath(),
                "-i", cut2.getAbsolutePath(),
                "-i", cut3.getAbsolutePath(),
                "-filter_complex",
                "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=25,setsar=1[v0];" +
                "[1:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=25,setsar=1[v1];" +
                "[2:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=25,setsar=1[v2];" +
                "[v0][v1]xfade=transition=fade:duration=0.3:offset=4.7[x1];" +
                "[x1][v2]xfade=transition=fade:duration=0.3:offset=9.4[xout]",
                "-map", "[xout]",
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                "-y", output.getAbsolutePath()
        );
    }

    private String buildSubtitle(String address, String signatureMenu) {
        String dong = "";
        if (address != null) {
            Matcher m = Pattern.compile("([가-힣]+동)").matcher(address);
            if (m.find()) dong = m.group(1);
        }
        String menu = (signatureMenu != null && !signatureMenu.isBlank()) ? signatureMenu : "맛집";
        return dong.isBlank() ? menu + " 맛집" : dong + " " + menu + " 맛집";
    }

    private String createTitleAss(String storeName, String subtitle, String titleFont, String subFont) {
        return "[Script Info]\n" +
               "ScriptType: v4.00+\n" +
               "PlayResX: 720\n" +
               "PlayResY: 1280\n" +
               "WrapStyle: 2\n\n" +
               "[V4+ Styles]\n" +
               "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, " +
               "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, " +
               "Alignment, MarginL, MarginR, MarginV, Encoding\n" +
               "Style: Title," + titleFont + ",56,&H00FFFFFF,&H000000FF,&H00000000,&H00000000," +
               "-1,0,0,0,100,100,0,0,1,1.5,2,8,40,40,200,1\n" +
               "Style: Sub," + subFont + ",30,&H00FFFFFF,&H000000FF,&H00000000,&H00000000," +
               "0,0,0,0,100,100,0,0,1,1,1.5,8,40,40,275,1\n\n" +
               "[Events]\n" +
               "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n" +
               "Dialogue: 0,0:00:00.00,0:00:15.00,Title,,0,0,0,,{\\fad(400,0)\\blur1}" + storeName + "\n" +
               "Dialogue: 0,0:00:00.30,0:00:15.00,Sub,,0,0,0,,{\\fad(400,0)\\blur1}" + subtitle + "\n";
    }

    private void extractFont(Path fontsDir, String fontFileName) {
        try {
            ClassPathResource resource = new ClassPathResource("fonts/" + fontFileName);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    Files.copy(is, fontsDir.resolve(fontFileName), StandardCopyOption.REPLACE_EXISTING);
                    log.info("[MasterVideo] 폰트 추출: {}", fontFileName);
                }
            } else {
                log.debug("[MasterVideo] 폰트 없음 (Noto 폴백 사용): {}", fontFileName);
            }
        } catch (Exception e) {
            log.warn("[MasterVideo] 폰트 추출 실패 {}: {}", fontFileName, e.getMessage());
        }
    }

    private void downloadFile(String url, File dest) throws Exception {
        HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        Files.copy(response.body(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
    }

    private void runFfmpeg(List<String> command, Path workingDir) throws Exception {
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

    private void deleteDir(File dir) {
        if (dir == null || !dir.exists()) return;
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isDirectory()) deleteDir(f);
                else f.delete();
            }
        }
        dir.delete();
    }
}
