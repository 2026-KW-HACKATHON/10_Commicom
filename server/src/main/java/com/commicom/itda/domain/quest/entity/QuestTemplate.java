package com.commicom.itda.domain.quest.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Optional;

/**
 * 퀘스트 템플릿 (클라이언트 QUEST_TEMPLATES 와 같은 키).
 * 사장님은 이 중 우리 가게가 참여할 퀘스트를 고르고, 손님에게는 참여 가게가 1곳 이상인 템플릿만 보인다
 */
@Getter
@RequiredArgsConstructor
public enum QuestTemplate {

    RESTAURANT("restaurant", "동네 밥집 탐방", "밥집"),
    KOREAN("korean", "한식 맛집 탐방", "한식집"),
    CHINESE("chinese", "중식 맛집 탐방", "중식집"),
    JAPANESE("japanese", "일식 맛집 탐방", "일식집"),
    WESTERN("western", "골목 양식집 찾기", "양식집"),
    SNACK("snack", "분식 골목 투어", "분식집"),
    CHICKEN("chicken", "치킨 맛집 도장깨기", "치킨집"),
    CAFE("cafe", "동네 카페 투어", "카페"),
    MART("mart", "동네 장보기", "마트·식료품점"),
    SHOPPING("shopping", "골목 쇼핑 나들이", "가게"),
    BEAUTY("beauty", "뷰티 가게 방문", "뷰티 가게"),
    SERVICE("service", "생활 서비스 이용하기", "생활 서비스 가게");

    /** 기본 목표 (참여 가게가 적으면 참여 가게 수로 줄어듦) */
    public static final int TARGET_COUNT = 2;
    public static final int REWARD_FEED = 2;

    private final String key;
    private final String title;
    private final String place;

    public static Optional<QuestTemplate> ofKey(String key) {
        return Arrays.stream(values()).filter(t -> t.key.equals(key)).findFirst();
    }

    public String description() {
        return "동네 " + place + " " + TARGET_COUNT + "곳 방문하기";
    }
}
