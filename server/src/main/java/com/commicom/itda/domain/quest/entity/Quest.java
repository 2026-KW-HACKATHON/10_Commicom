package com.commicom.itda.domain.quest.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 퀘스트 (서버 시작 때 QuestSeeder 가 채움).
 * - BASIC: 앱 기본 퀘스트. basicEvent(숏폼 보기·가게 둘러보기)가 targetCount 번 쌓이면 완료
 * - VISIT: 퀘스트 가게 방문 인증. templateKey 가 있으면 그 템플릿에 참여한 가게만 인정
 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestType type;

    @Column(nullable = false)
    private int targetCount;

    /** 완료 보너스 먹이 */
    @Column(nullable = false)
    private int rewardFeed;

    /** 템플릿 퀘스트 키 (QuestTemplate.key). 기본 퀘스트는 null */
    @Column(unique = true, length = 30)
    private String templateKey;

    /** BASIC 퀘스트가 세는 행동 */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private QuestEventType basicEvent;

    private Quest(String title, QuestType type, int targetCount, int rewardFeed, String templateKey, QuestEventType basicEvent) {
        this.title = title;
        this.type = type;
        this.targetCount = targetCount;
        this.rewardFeed = rewardFeed;
        this.templateKey = templateKey;
        this.basicEvent = basicEvent;
    }

    public static Quest basic(String title, int targetCount, int rewardFeed, QuestEventType event) {
        return new Quest(title, QuestType.BASIC, targetCount, rewardFeed, null, event);
    }

    public static Quest visit(String title, int targetCount, int rewardFeed) {
        return new Quest(title, QuestType.VISIT, targetCount, rewardFeed, null, null);
    }

    public static Quest template(QuestTemplate t) {
        return new Quest(t.getTitle(), QuestType.VISIT, QuestTemplate.TARGET_COUNT, QuestTemplate.REWARD_FEED, t.getKey(), null);
    }

    public boolean isTemplate() {
        return templateKey != null;
    }
}
