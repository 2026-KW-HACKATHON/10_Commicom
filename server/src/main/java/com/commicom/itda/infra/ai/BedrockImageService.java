package com.commicom.itda.infra.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class BedrockImageService {

    private final BedrockRuntimeClient bedrockRuntimeClient;

    public BedrockImageService(@Qualifier("bedrockImageRuntimeClient") BedrockRuntimeClient bedrockRuntimeClient) {
        this.bedrockRuntimeClient = bedrockRuntimeClient;
    }

    // Stability AI / Titan 종료 → Amazon Nova Canvas 사용
    private static final String MODEL_ID = "amazon.nova-canvas-v1:0";
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
        String negativePrompt = "blurry, low quality, text, watermark, logo, nsfw, ugly, deformed";
        log.info("[BedrockImage] 프롬프트: {}", prompt);

        ObjectNode body = objectMapper.createObjectNode();

        buildTextImageBody(body, prompt, negativePrompt);

        ObjectNode config = body.putObject("imageGenerationConfig");
        config.put("numberOfImages", 1);
        config.put("quality", "standard");
        config.put("height", HEIGHT);
        config.put("width", WIDTH);
        config.put("cfgScale", 8.0);

        InvokeModelRequest request = InvokeModelRequest.builder()
                .modelId(MODEL_ID)
                .contentType("application/json")
                .accept("application/json")
                .body(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(body)))
                .build();

        InvokeModelResponse response = bedrockRuntimeClient.invokeModel(request);
        JsonNode result = objectMapper.readTree(response.body().asUtf8String());

        String base64Image = result.get("images").get(0).asText();
        log.info("[BedrockImage] 생성 완료 ({}자 base64)", base64Image.length());
        return Base64.getDecoder().decode(base64Image);
    }

    private void buildTextImageBody(ObjectNode body, String prompt, String negativePrompt) {
        body.put("taskType", "TEXT_IMAGE");
        ObjectNode params = body.putObject("textToImageParams");
        params.put("text", prompt);
        params.put("negativeText", negativePrompt);
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

}
