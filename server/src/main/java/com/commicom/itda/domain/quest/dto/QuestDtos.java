package com.commicom.itda.domain.quest.dto;

import com.commicom.itda.domain.pigeon.dto.PigeonDtos.LevelUp;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.PigeonChange;
import com.commicom.itda.domain.quest.entity.QuestEventType;
import com.commicom.itda.domain.quest.entity.QuestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;

/** 퀘스트 API 요청·응답 */
public final class QuestDtos {

    private QuestDtos() {
    }

    /** GET /api/quests 의 quests[] */
    public record QuestResponse(
            Long questId,
            String title,
            QuestType type,
            int targetCount,
            int currentCount,
            int rewardFeed,
            String status,
            /** 템플릿 퀘스트 키 (기본 퀘스트는 null) */
            String templateKey,
            /** 방문 인증할 수 있는 가게 (null 이면 모든 퀘스트 가게) */
            List<Long> storeIds
    ) {
    }

    public record QuestListResponse(List<QuestResponse> quests) {
    }

    /** POST /api/quests/{questId}/visits */
    public record VisitRequest(
            @NotNull(message = "가게를 골라 주세요") Long storeId,
            @NotNull(message = "위치를 확인하지 못했어요") Double latitude,
            @NotNull(message = "위치를 확인하지 못했어요") Double longitude,
            @NotBlank(message = "가게 QR을 찍어 주세요") @Size(max = 50) String qrToken
    ) {
    }

    public record VisitQuest(Long questId, int currentCount, int targetCount, boolean completed, int bonusFeed) {
    }

    public record VisitResponse(
            Long visitId,
            int feedGained,
            VisitQuest quest,
            PigeonChange pigeon,
            List<LevelUp> levelUps,
            int feedBalance
    ) {
    }

    /** POST /api/quests/events — 기본 퀘스트 진행 (숏폼 보기·가게 둘러보기) */
    public record QuestEventRequest(
            @NotNull(message = "행동 종류가 없어요") QuestEventType type,
            @NotNull(message = "대상이 없어요") Long targetId
    ) {
    }

    public record CompletedQuest(Long questId, String title, int rewardFeed) {
    }

    /** 이번 행동으로 새로 완료한 퀘스트 (보너스 먹이는 보유 먹이에 쌓임) */
    public record QuestEventResponse(List<CompletedQuest> completedQuests, int feedBalance) {
    }

    /** GET·POST /api/stores/{storeId}/quest-subscription */
    public record SubscriptionResponse(Long storeId, String status, OffsetDateTime startedAt, OffsetDateTime expiresAt) {
    }

    /** GET /api/stores/{storeId}/quest-templates */
    public record OwnerTemplate(
            String templateKey,
            String title,
            String description,
            int targetCount,
            int rewardFeed,
            /** 지금 참여 중인 퀘스트 가게 수 (내 가게 포함) */
            int participantCount,
            boolean joined
    ) {
    }

    public record OwnerTemplateList(List<OwnerTemplate> templates) {
    }

    public record TemplateJoinResponse(String templateKey, boolean joined) {
    }

    /** GET /api/stores/{storeId}/quest-qr — 매일 KST 자정에 바뀜 */
    public record QrResponse(String qrToken, OffsetDateTime expiresAt) {
    }
}
