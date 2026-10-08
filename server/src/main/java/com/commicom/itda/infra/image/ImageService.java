package com.commicom.itda.infra.image;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

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
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {

    @Value("${unsplash.access-key}")
    private String accessKey;

    private static final String UNSPLASH_API = "https://api.unsplash.com/photos/random";

    private static final Map<String, String> CATEGORY_KEYWORDS = Map.of(
            "RESTAURANT",      "korean food restaurant",
            "CAFE_BAKERY_PUB", "cozy cafe coffee bakery",
            "FOOD_RETAIL",     "grocery market fresh food",
            "BEAUTY",          "beauty salon cosmetics",
            "FASHION",         "fashion clothing boutique"
    );

    /**
     * 카테고리에 맞는 배경 이미지를 Unsplash에서 다운로드한다.
     * 실패 시 null 반환 (파이프라인은 단색 배경으로 폴백)
     */
    public File fetchBackgroundImage(String category, Path workDir) {
        try {
            String keyword = CATEGORY_KEYWORDS.getOrDefault(category, "city street lifestyle");
            String url = UNSPLASH_API + "?query=" + keyword.replace(" ", "+")
                    + "&orientation=portrait&client_id=" + accessKey;

            log.info("Unsplash 이미지 요청: {}", keyword);

            RestClient client = RestClient.create();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = client.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return null;

            @SuppressWarnings("unchecked")
            Map<String, String> urls = (Map<String, String>) response.get("urls");
            String imageUrl = urls.get("regular"); // 1080px 폭

            // 이미지 다운로드
            File imageFile = workDir.resolve("background.jpg").toFile();
            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(imageUrl)).build();
            HttpResponse<InputStream> res = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());
            Files.copy(res.body(), imageFile.toPath());

            log.info("Unsplash 이미지 다운로드 완료: {}bytes", imageFile.length());
            return imageFile;

        } catch (Exception e) {
            log.warn("Unsplash 이미지 가져오기 실패, 단색 배경 사용: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 외부 URL 리스트에서 이미지를 다운로드한다. (사용자가 업로드한 사진 URL 등)
     */
    public List<File> downloadImages(List<String> imageUrls, Path workDir) {
        List<File> images = new ArrayList<>();
        HttpClient httpClient = HttpClient.newHttpClient();
        for (int i = 0; i < imageUrls.size(); i++) {
            try {
                File imageFile = workDir.resolve("photo_" + i + ".jpg").toFile();
                HttpRequest req = HttpRequest.newBuilder().uri(URI.create(imageUrls.get(i))).build();
                HttpResponse<InputStream> res = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());
                Files.copy(res.body(), imageFile.toPath());
                images.add(imageFile);
                log.info("사진 {} 다운로드 완료: {}bytes", i, imageFile.length());
            } catch (Exception e) {
                log.warn("사진 {} 다운로드 실패: {}", i, e.getMessage());
            }
        }
        return images;
    }

    /**
     * 카테고리에 맞는 배경 이미지를 Unsplash에서 여러 장 다운로드한다.
     * count 장을 한 번의 API 호출로 요청한다 (max 30).
     */
    @SuppressWarnings("unchecked")
    public List<File> fetchBackgroundImages(String category, int count, Path workDir) {
        List<File> images = new ArrayList<>();
        try {
            String keyword = CATEGORY_KEYWORDS.getOrDefault(category, "city street lifestyle");
            String url = UNSPLASH_API + "?query=" + keyword.replace(" ", "+")
                    + "&orientation=portrait&count=" + Math.min(count, 30)
                    + "&client_id=" + accessKey;

            log.info("Unsplash 이미지 {}장 요청: {}", count, keyword);

            RestClient client = RestClient.create();
            List<Map<String, Object>> response = client.get()
                    .uri(url)
                    .retrieve()
                    .body(List.class);

            if (response == null || response.isEmpty()) return images;

            HttpClient httpClient = HttpClient.newHttpClient();
            for (int i = 0; i < response.size(); i++) {
                try {
                    Map<String, Object> photo = (Map<String, Object>) response.get(i);
                    Map<String, String> urls = (Map<String, String>) photo.get("urls");
                    String imageUrl = urls.get("regular");

                    File imageFile = workDir.resolve("bg_" + i + ".jpg").toFile();
                    HttpRequest req = HttpRequest.newBuilder().uri(URI.create(imageUrl)).build();
                    HttpResponse<InputStream> res = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());
                    Files.copy(res.body(), imageFile.toPath());
                    images.add(imageFile);
                } catch (Exception e) {
                    log.warn("이미지 {} 다운로드 실패: {}", i, e.getMessage());
                }
            }
            log.info("Unsplash 이미지 {}장 다운로드 완료", images.size());
        } catch (Exception e) {
            log.warn("Unsplash 이미지 목록 가져오기 실패: {}", e.getMessage());
        }
        return images;
    }
}
