package com.commicom.itda.infra.video;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Profile("!local")
public class RunwayVideoClipGenerator implements VideoClipGenerator {

    @Value("${runway.api-key:}")
    private String apiKey;

    private static final String BASE_URL = "https://api.dev.runwayml.com/v1";
    private static final String MODEL = "gen4_turbo";
    private static final int CLIP_DURATION_SEC = 5;
    private static final int POLL_INTERVAL_MS = 5_000;
    private static final int MAX_WAIT_MS = 300_000;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    @Override
    public List<File> generateParallel(List<String> imageUrls, List<String> prompts, Path workDir) throws Exception {
        // 모든 태스크 제출
        List<String> taskIds = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            String taskId = submitTask(imageUrls.get(i), prompts.get(i));
            log.info("[Runway] 태스크 {} 제출됨 (클립 {})", taskId, i + 1);
            taskIds.add(taskId);
        }

        // 공통 폴링 루프
        List<String> videoUrls = pollAllTasks(taskIds);

        // 다운로드
        List<File> clips = new ArrayList<>();
        for (int i = 0; i < videoUrls.size(); i++) {
            File dest = workDir.resolve("cut" + (i + 1) + ".mp4").toFile();
            downloadFile(videoUrls.get(i), dest);
            log.info("[Runway] 클립 {} 다운로드 완료: {}KB", i + 1, dest.length() / 1024);
            clips.add(dest);
        }
        return clips;
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

    private List<String> pollAllTasks(List<String> taskIds) throws Exception {
        Map<String, Integer> idxMap = new HashMap<>();
        for (int i = 0; i < taskIds.size(); i++) idxMap.put(taskIds.get(i), i);

        String[] results = new String[taskIds.size()];
        List<String> remaining = new ArrayList<>(taskIds);
        long deadline = System.currentTimeMillis() + MAX_WAIT_MS;

        while (!remaining.isEmpty() && System.currentTimeMillis() < deadline) {
            Thread.sleep(POLL_INTERVAL_MS);
            List<String> stillPending = new ArrayList<>();

            for (String taskId : remaining) {
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
                    case "SUCCEEDED" -> results[idxMap.get(taskId)] = root.get("output").get(0).asText();
                    case "FAILED" -> throw new RuntimeException(
                            "Runway 영상 생성 실패 taskId=" + taskId + ": " + response.body());
                    default -> stillPending.add(taskId);
                }
            }
            remaining = stillPending;
        }

        if (!remaining.isEmpty()) {
            throw new RuntimeException("Runway 타임아웃 (5분 초과): " + remaining);
        }
        return Arrays.asList(results);
    }

    private void downloadFile(String url, File dest) throws Exception {
        HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        Files.copy(response.body(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
    }
}
