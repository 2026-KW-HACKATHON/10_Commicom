package com.commicom.itda.infra.video;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class RunwayService {

    @Value("${runway.api-key:}")
    private String apiKey;

    /** true이면 Runway API 호출 없이 FFmpeg 정적 클립으로 대체 */
    @Value("${runway.mock:false}")
    private boolean mock;

    @Value("${video.ffmpeg-path}")
    private String ffmpegPath;

    private static final String BASE_URL = "https://api.dev.runwayml.com/v1";
    private static final String MODEL = "gen4_turbo";
    private static final int CLIP_DURATION_SEC = 5;
    private static final int POLL_INTERVAL_MS = 10_000;
    private static final int MAX_WAIT_MS = 300_000;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * 이미지 URL 리스트 → 각각 5초 클립으로 변환.
     * mock=true: FFmpeg 정적 클립 (무료, 즉시)
     * mock=false: Runway AI 클립 (유료, 1~3분)
     */
    public List<File> generateClips(List<String> imageUrls, String storeCategory,
                                    Path workDir, int clipsNeeded) throws Exception {
        if (mock) {
            log.info("[Runway] Mock 모드 - FFmpeg 정적 클립 {}개 생성", clipsNeeded);
            return generateMockClips(imageUrls, workDir, clipsNeeded);
        }

        String prompt = categoryPrompt(storeCategory);
        List<File> clips = new ArrayList<>();
        for (int i = 0; i < clipsNeeded; i++) {
            String imageUrl = imageUrls.get(i % imageUrls.size());
            log.info("[Runway] 클립 {}/{} AI 생성 중...", i + 1, clipsNeeded);
            clips.add(generateOneClip(imageUrl, prompt, workDir, i));
        }
        return clips;
    }

    // ── Mock: FFmpeg 정적 클립 ──────────────────────────────────────

    private List<File> generateMockClips(List<String> imageUrls, Path workDir, int clipsNeeded)
            throws Exception {
        List<File> clips = new ArrayList<>();
        for (int i = 0; i < clipsNeeded; i++) {
            String imageUrl = imageUrls.get(i % imageUrls.size());
            File imgFile = workDir.resolve("mock_img_" + i + ".jpg").toFile();
            downloadFile(imageUrl, imgFile);

            File clipFile = workDir.resolve("clip_" + i + ".mp4").toFile();
            runProcess(List.of(
                    ffmpegPath,
                    "-loop", "1", "-i", imgFile.getAbsolutePath(),
                    "-t", String.valueOf(CLIP_DURATION_SEC),
                    "-vf", "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "28",
                    "-pix_fmt", "yuv420p",
                    "-y", clipFile.getAbsolutePath()
            ));
            log.info("[Runway] Mock 클립 {} 완료: {}KB", i, clipFile.length() / 1024);
            clips.add(clipFile);
        }
        return clips;
    }

    // ── Real: Runway API ────────────────────────────────────────────

    private File generateOneClip(String imageUrl, String prompt, Path workDir, int index)
            throws Exception {
        String taskId = submitTask(imageUrl, prompt);
        log.info("[Runway] 태스크 생성됨: {} (클립 {})", taskId, index);
        String videoUrl = waitForCompletion(taskId);
        File dest = workDir.resolve("clip_" + index + ".mp4").toFile();
        downloadFile(videoUrl, dest);
        log.info("[Runway] 클립 {} 다운로드 완료: {}KB", index, dest.length() / 1024);
        return dest;
    }

    private String submitTask(String imageUrl, String prompt) throws Exception {
        String body = """
                {"model":"%s","promptImage":"%s","promptText":"%s","duration":%d,"ratio":"720:1280"}
                """.formatted(MODEL, imageUrl, prompt.replace("\"", "\\\""), CLIP_DURATION_SEC).strip();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/image_to_video"))
                .header("Authorization", "Bearer " + apiKey)
                .header("X-Runway-Version", "2024-11-06")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("Runway 요청 실패 (" + response.statusCode() + "): " + response.body());
        }
        return objectMapper.readTree(response.body()).get("id").asText();
    }

    private String waitForCompletion(String taskId) throws Exception {
        long deadline = System.currentTimeMillis() + MAX_WAIT_MS;
        while (System.currentTimeMillis() < deadline) {
            Thread.sleep(POLL_INTERVAL_MS);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/tasks/" + taskId))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("X-Runway-Version", "2024-11-06")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            String status = root.get("status").asText();
            log.info("[Runway] 태스크 {} 상태: {}", taskId, status);

            switch (status) {
                case "SUCCEEDED" -> { return root.get("output").get(0).asText(); }
                case "FAILED"    -> throw new RuntimeException("Runway 영상 생성 실패: " + response.body());
            }
        }
        throw new RuntimeException("Runway 타임아웃 (5분 초과): " + taskId);
    }

    // ── 공통 유틸 ───────────────────────────────────────────────────

    private void downloadFile(String url, File dest) throws Exception {
        HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        Files.copy(response.body(), dest.toPath());
    }

    private void runProcess(List<String> command) throws IOException, InterruptedException {
        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        process.getInputStream().readAllBytes();
        int exit = process.waitFor();
        if (exit != 0) throw new RuntimeException("FFmpeg Mock 클립 생성 실패 (exit=" + exit + ")");
    }

    private static String categoryPrompt(String category) {
        return switch (category) {
            case "RESTAURANT" ->
                "Vertical 9:16 promotional short for a neighborhood restaurant. " +
                "Slow, smooth handheld-style push-in showing fresh dishes on table, " +
                "warm kitchen glow, wooden interior details. " +
                "Soft natural tones, shallow depth of field, casual food vlog style. " +
                "Keep the center of the frame softly lit without busy patterns. " +
                "No text, no captions, no subtitles, no logos, no watermarks, no readable signage.";
            case "CAFE_BAKERY_PUB" ->
                "Vertical 9:16 promotional short for a cozy neighborhood cafe. " +
                "Slow, smooth handheld-style push-in through a bright airy interior " +
                "with warm wood furniture, pendant lights, and green plants. " +
                "Soft natural daylight, warm tones, shallow depth of field, " +
                "casual Instagram Reels food and cafe vlog style. " +
                "Keep the center of the frame softly lit without harsh highlights or busy patterns. " +
                "No text, no captions, no subtitles, no logos, no watermarks, no readable signage.";
            case "FOOD_RETAIL" ->
                "Vertical 9:16 promotional short for a local food market stall. " +
                "Slow dolly shot past colorful fresh produce and packaged goods, " +
                "vibrant natural lighting, shallow depth of field. " +
                "Keep the center of the frame clean and uncluttered. " +
                "No text, no captions, no subtitles, no logos, no watermarks, no readable signage.";
            case "BEAUTY" ->
                "Vertical 9:16 promotional short for an elegant neighborhood beauty salon. " +
                "Slow gentle zoom through a bright modern interior with soft lighting, " +
                "clean white surfaces, styling tools artfully arranged. " +
                "Warm professional atmosphere, shallow depth of field. " +
                "Keep the center of the frame softly lit. " +
                "No text, no captions, no subtitles, no logos, no watermarks, no readable signage.";
            case "FASHION" ->
                "Vertical 9:16 promotional short for a stylish local clothing boutique. " +
                "Slow drift shot past curated clothing racks and accessories, " +
                "warm boutique lighting, rich textures. " +
                "Keep the center of the frame visually balanced without busy patterns. " +
                "No text, no captions, no subtitles, no logos, no watermarks, no readable signage.";
            default ->
                "Vertical 9:16 promotional short for a welcoming local shop. " +
                "Slow, smooth cinematic zoom through a warm interior. " +
                "Natural lighting, shallow depth of field, casual vlog style. " +
                "Keep the center of the frame softly lit. " +
                "No text, no captions, no subtitles, no logos, no watermarks, no readable signage.";
        };
    }
}
