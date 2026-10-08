package com.commicom.itda.infra.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BedrockImageService {

    private final BedrockRuntimeClient bedrockRuntimeClient;

    private static final String MODEL_ID = "stability.stable-diffusion-xl-v1";
    private static final int WIDTH  = 768;
    private static final int HEIGHT = 1344;

    private static final Map<String, String> CATEGORY_EN_MAP = Map.of(
            "RESTAURANT",      "restaurant",
            "CAFE_BAKERY_PUB", "cafe",
            "FOOD_RETAIL",     "food market",
            "BEAUTY",          "beauty salon",
            "FASHION",         "fashion boutique"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    /**
     * 가게 정보 + OCR 메뉴 + 참조 사진으로 9:16 AI 이미지 생성.
     *
     * @param storeName    가게 이름
     * @param category     StoreCategory.name() (e.g. "RESTAURANT")
     * @param menuInfo     OCR 또는 사용자 입력 메뉴 정보 (nullable)
     * @param referenceUrl 참조 사진 URL (img2img, nullable)
     * @return PNG 바이트 배열
     */
    public byte[] generateImage(String storeName, String category,
                                String menuInfo, String referenceUrl) throws Exception {
        String prompt = buildPrompt(storeName, category, menuInfo);
        log.info("[BedrockImage] 프롬프트: {}", prompt);

        ObjectNode body = objectMapper.createObjectNode();

        ArrayNode textPrompts = body.putArray("text_prompts");
        ObjectNode pos = textPrompts.addObject();
        pos.put("text", prompt);
        pos.put("weight", 1.0);
        ObjectNode neg = textPrompts.addObject();
        neg.put("text", "blurry, low quality, text, watermark, logo, nsfw, ugly, deformed");
        neg.put("weight", -1.0);

        body.put("cfg_scale", 7);
        body.put("height", HEIGHT);
        body.put("width", WIDTH);
        body.put("samples", 1);
        body.put("steps", 30);
        body.put("style_preset", "photographic");

        // img2img: 참조 사진이 있으면 포함
        if (referenceUrl != null && !referenceUrl.isBlank()) {
            try {
                byte[] imgBytes = downloadBytes(referenceUrl);
                String base64 = Base64.getEncoder().encodeToString(imgBytes);
                body.put("init_image", base64);
                body.put("image_strength", 0.35);
                log.info("[BedrockImage] 참조 이미지 포함 ({}KB)", imgBytes.length / 1024);
            } catch (Exception e) {
                log.warn("[BedrockImage] 참조 이미지 다운로드 실패, text-to-image로 진행: {}", e.getMessage());
            }
        }

        InvokeModelRequest request = InvokeModelRequest.builder()
                .modelId(MODEL_ID)
                .contentType("application/json")
                .accept("application/json")
                .body(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(body)))
                .build();

        InvokeModelResponse response = bedrockRuntimeClient.invokeModel(request);
        JsonNode result = objectMapper.readTree(response.body().asUtf8String());

        String base64Image = result.get("artifacts").get(0).get("base64").asText();
        log.info("[BedrockImage] 생성 완료 ({}자 base64)", base64Image.length());
        return Base64.getDecoder().decode(base64Image);
    }

    private String buildPrompt(String storeName, String category, String menuInfo) {
        String categoryEn = CATEGORY_EN_MAP.getOrDefault(category, "local shop");
        String menuText = (menuInfo != null && !menuInfo.isBlank()) ? menuInfo : "local specialty";

        return String.format(
                "Professional high-quality food photography for a Korean %s called \"%s\". " +
                "Menu: %s. " +
                "Warm appetizing lighting, shallow depth of field, vibrant natural colors, " +
                "clean elegant composition. Instagram-worthy aesthetic. Vertical 9:16 format.",
                categoryEn, storeName, menuText
        );
    }

    private byte[] downloadBytes(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
        HttpResponse<InputStream> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());
        return resp.body().readAllBytes();
    }
}
