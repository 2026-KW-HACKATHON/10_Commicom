package com.commicom.itda.infra.ai;

import com.commicom.itda.domain.store.entity.Store;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Lazy
@Service
@RequiredArgsConstructor
public class AiService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("classpath:prompts/shortform-script.txt")
    private Resource scriptPromptTemplate;

    @Value("classpath:prompts/caption-timing.txt")
    private Resource captionPromptTemplate;

    public ScriptResult generateScript(Store store, String menuInfo) {
        String prompt = buildPrompt(store, menuInfo);
        log.info("AI 스크립트 생성 요청: {}", store.getName());

        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        return parseScriptResult(response, store.getName());
    }

    private String buildPrompt(Store store, String menuInfo) {
        try {
            String template = scriptPromptTemplate.getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
            return template
                    .replace("{storeName}", store.getName())
                    .replace("{category}", store.getCategory().getDescription())
                    .replace("{description}", nullSafe(store.getDescription()))
                    .replace("{businessHours}", nullSafe(store.getBusinessHours()))
                    .replace("{menuInfo}", menuInfo.isBlank() ? "정보 없음" : menuInfo);
        } catch (Exception e) {
            throw new RuntimeException("프롬프트 로딩 실패", e);
        }
    }

    private ScriptResult parseScriptResult(String response, String storeName) {
        try {
            // JSON 코드블록 제거 (```json ... ``` 형식 처리)
            String cleaned = response.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
            JsonNode node = objectMapper.readTree(cleaned);
            String title = node.path("title").asText(storeName + " 이야기");
            String script = node.path("script").asText(response);
            return new ScriptResult(title, script);
        } catch (Exception e) {
            log.warn("AI 응답 파싱 실패, 원본 사용: {}", e.getMessage());
            return new ScriptResult(storeName + " 이야기", response.trim());
        }
    }

    /**
     * LLM으로 자막 타이밍 + 문구를 한 번에 생성한다.
     * 실패 시 빈 목록 반환 → VideoService에서 균등 분배 폴백.
     */
    public List<CaptionEntry> generateCaptions(Store store, String script, int durationSec) {
        try {
            String template = captionPromptTemplate.getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
            String prompt = template
                    .replace("{storeName}", store.getName())
                    .replace("{category}", store.getCategory().getDescription())
                    .replace("{description}", nullSafe(store.getDescription()))
                    .replace("{script}", script)
                    .replace("{duration}", String.valueOf(durationSec));

            log.info("AI 자막 생성 요청: {}초", durationSec);
            String response = chatClient.prompt().user(prompt).call().content();

            String cleaned = response.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
            JsonNode node = objectMapper.readTree(cleaned);
            JsonNode captions = node.path("captions");
            List<CaptionEntry> result = new ArrayList<>();
            for (JsonNode cap : captions) {
                result.add(new CaptionEntry(
                        cap.path("start").asDouble(),
                        cap.path("end").asDouble(),
                        cap.path("text").asText()
                ));
            }
            log.info("AI 자막 생성 완료: {}개", result.size());
            return result;
        } catch (Exception e) {
            log.warn("AI 자막 생성 실패, 폴백 사용: {}", e.getMessage());
            return List.of();
        }
    }

    private String nullSafe(String value) {
        return value != null ? value : "정보 없음";
    }

    public record ScriptResult(String title, String script) {}

    /** 자막 한 조각: start/end(초) + 표시할 텍스트 (\N으로 줄바꿈) */
    public record CaptionEntry(double start, double end, String text) {}
}
