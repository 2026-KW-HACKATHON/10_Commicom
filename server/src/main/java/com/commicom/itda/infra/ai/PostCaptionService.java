package com.commicom.itda.infra.ai;

import com.commicom.itda.domain.store.entity.Store;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

/**
 * 사장님이 적은 가게 어필을 피드 게시물 소개 글로 다듬음 (Bedrock Claude).
 * 예) "가게가 넓고 고기가 맛있어요" → "넓고 편안한 자리에서 즐기는 육즙 가득한 고기 한 판! 🥩"
 * AI 호출이 실패하면 사장님이 적은 문장을 그대로 씀 (게시물 생성은 계속)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostCaptionService {

    /** 피드에서 두 줄 안팎으로 보이게 */
    public static final int MAX_LENGTH = 120;

    private static final String PROMPT = """
            당신은 동네 가게의 SNS 게시물 문구를 다듬는 카피라이터입니다.
            아래 사장님이 직접 적은 어필을 바탕으로, 손님에게 보여 줄 게시물 소개 글을 한국어로 써 주세요.

            규칙
            - 사장님이 말한 장점을 하나도 빼거나 뭉뚱그리지 말고 구체적인 단어 그대로 살리세요 (예: "고기"를 "음식"으로 바꾸지 않기)
            - 사장님이 말한 내용만 쓰고, 없는 사실(가격·할인·수상·위치 등)을 지어내지 마세요
            - 메뉴 정보는 어필과 어울릴 때만 참고하고, 어필과 다르면 어필을 따르세요
            - 1~2문장, %d자 이내, 친근하고 자연스러운 말투
            - 이모지는 내용에 맞는 것 1개까지
            - 해시태그·따옴표·설명 없이 소개 글만 출력
            - 수정 요청이 있으면 반영하세요

            가게: %s (%s)
            사장님 어필: %s
            참고 메뉴 정보: %s
            """;

    private final ChatClient chatClient;

    /** @param menuInfo 메뉴·수정 요청 등 (nullable) */
    public String write(Store store, String appeal, String menuInfo) {
        if (appeal == null || appeal.isBlank()) {
            return null;
        }
        String fallback = trim(appeal);
        try {
            String prompt = PROMPT.formatted(MAX_LENGTH, store.getName(), store.getCategory().getDescription(),
                    appeal.trim(), menuInfo == null || menuInfo.isBlank() ? "없음" : menuInfo);
            String caption = chatClient.prompt().user(prompt).call().content();
            caption = caption == null ? "" : caption.strip().replaceAll("^[\"'“”]+|[\"'“”]+$", "");
            log.info("[게시물 문구] {} → {}", appeal.trim(), caption);
            return caption.isBlank() ? fallback : trim(caption);
        } catch (Exception e) {
            log.warn("[게시물 문구] AI 실패, 사장님 문장 그대로 사용: {}", e.getMessage());
            return fallback;
        }
    }

    private static String trim(String text) {
        String t = text.strip();
        return t.length() > MAX_LENGTH ? t.substring(0, MAX_LENGTH) : t;
    }
}
