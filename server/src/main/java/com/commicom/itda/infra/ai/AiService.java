package com.commicom.itda.infra.ai;

import com.commicom.itda.domain.store.entity.Store;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    @Value("classpath:prompts/shortform-script.txt")
    private Resource scriptPromptTemplate;

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

    private String nullSafe(String value) {
        return value != null ? value : "정보 없음";
    }

    public record ScriptResult(String title, String script) {}
}
