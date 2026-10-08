package com.commicom.itda.domain.quest.service;

import com.commicom.itda.domain.pigeon.dto.PigeonDtos.PigeonChange;
import com.commicom.itda.domain.pigeon.entity.Pigeon;
import com.commicom.itda.domain.pigeon.service.PigeonService;
import com.commicom.itda.domain.quest.dto.QuestDtos.CompletedQuest;
import com.commicom.itda.domain.quest.dto.QuestDtos.QuestEventRequest;
import com.commicom.itda.domain.quest.dto.QuestDtos.QuestEventResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.QuestListResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.QuestResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.VisitQuest;
import com.commicom.itda.domain.quest.dto.QuestDtos.VisitRequest;
import com.commicom.itda.domain.quest.dto.QuestDtos.VisitResponse;
import com.commicom.itda.domain.quest.entity.Quest;
import com.commicom.itda.domain.quest.entity.QuestCompletion;
import com.commicom.itda.domain.quest.entity.QuestEventLog;
import com.commicom.itda.domain.quest.entity.QuestParticipation;
import com.commicom.itda.domain.quest.entity.QuestType;
import com.commicom.itda.domain.quest.entity.QuestVisit;
import com.commicom.itda.domain.quest.repository.QuestCompletionRepository;
import com.commicom.itda.domain.quest.repository.QuestEventLogRepository;
import com.commicom.itda.domain.quest.repository.QuestParticipationRepository;
import com.commicom.itda.domain.quest.repository.QuestRepository;
import com.commicom.itda.domain.quest.repository.QuestSubscriptionRepository;
import com.commicom.itda.domain.quest.repository.QuestVisitRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.util.KstTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 손님 퀘스트: 목록·방문 인증·기본 퀘스트 진행.
 * 받은 먹이는 비둘기 보유 먹이에 쌓인다 (레벨업은 [먹이 주기] 때)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestService {

    /** 방문 인증 반경 */
    public static final int VISIT_RADIUS_M = 100;
    /** 방문 1번에 주는 먹이 */
    public static final int VISIT_FEED = 1;

    private final QuestRepository questRepository;
    private final QuestSubscriptionRepository subscriptionRepository;
    private final QuestParticipationRepository participationRepository;
    private final QuestVisitRepository visitRepository;
    private final QuestEventLogRepository eventLogRepository;
    private final QuestCompletionRepository completionRepository;
    private final StoreRepository storeRepository;
    private final QuestQrService qrService;
    private final PigeonService pigeonService;

    /** 개발·시연용: true 면 GPS 거리 검사를 건너뜀 */
    @Value("${quest.gps-bypass:false}")
    private boolean gpsBypass;

    /** 손님에게 보이는 퀘스트 (로그인 전이면 진행도 0) */
    public QuestListResponse getQuests(Long memberId) {
        List<VisibleQuest> visible = visibleQuests();
        Map<Long, Long> visitCounts = memberId == null ? Map.of() : visitRepository.findAllByMemberId(memberId).stream()
                .collect(Collectors.groupingBy(QuestVisit::getQuestId, Collectors.counting()));
        Map<Long, Long> eventCounts = memberId == null ? Map.of() : eventLogRepository.findAllByMemberId(memberId).stream()
                .collect(Collectors.groupingBy(QuestEventLog::getQuestId, Collectors.counting()));
        return new QuestListResponse(visible.stream()
                .map(v -> {
                    Map<Long, Long> counts = v.quest().getType() == QuestType.VISIT ? visitCounts : eventCounts;
                    return v.toResponse(counts.getOrDefault(v.quest().getId(), 0L).intValue());
                })
                .toList());
    }

    /** 방문 인증: 퀘스트 가게 + 반경 100m + 오늘의 가게 QR */
    @Transactional
    public VisitResponse visit(Long memberId, Long questId, VisitRequest request) {
        VisibleQuest vq = visibleQuests().stream()
                .filter(v -> v.quest().getId().equals(questId) && v.quest().getType() == QuestType.VISIT)
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.QUEST_NOT_FOUND));
        if (visitRepository.countByMemberIdAndQuestId(memberId, questId) >= vq.targetCount()) {
            throw new BusinessException(ErrorCode.QUEST_ALREADY_COMPLETED);
        }
        Long storeId = request.storeId();
        if (!vq.activeStoreIds().contains(storeId)) {
            throw new BusinessException(ErrorCode.QUEST_STORE_NOT_ACTIVE);
        }
        if (vq.storeIds() != null && !vq.storeIds().contains(storeId)) {
            throw new BusinessException(ErrorCode.QUEST_STORE_NOT_PARTICIPATING);
        }
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
        if (!gpsBypass) {
            long distanceM = Math.round(distanceMeters(request.latitude(), request.longitude(), store.getLatitude(), store.getLongitude()));
            if (distanceM > VISIT_RADIUS_M) {
                throw new BusinessException(ErrorCode.QUEST_OUT_OF_RANGE, Map.of("distanceM", distanceM));
            }
        }
        LocalDate today = KstTime.today();
        if (!qrService.matches(storeId, today, request.qrToken())) {
            throw new BusinessException(ErrorCode.QUEST_QR_MISMATCH);
        }
        if (visitRepository.existsByMemberIdAndStoreIdAndVisitDate(memberId, storeId, today)) {
            throw new BusinessException(ErrorCode.QUEST_VISITED_TODAY);
        }
        if (visitRepository.existsByMemberIdAndQuestIdAndStoreId(memberId, questId, storeId)) {
            throw new BusinessException(ErrorCode.QUEST_STORE_ALREADY_COUNTED);
        }

        QuestVisit visit = visitRepository.save(new QuestVisit(memberId, questId, storeId, today));
        int count = visitRepository.countByMemberIdAndQuestId(memberId, questId);
        boolean completed = count >= vq.targetCount();
        int bonus = completed ? completeOnce(memberId, vq.quest()) : 0;

        int levelBefore = pigeonService.getPigeon(memberId).level();
        Pigeon pigeon = pigeonService.grantQuestFeed(memberId, VISIT_FEED + bonus);
        return new VisitResponse(
                visit.getId(),
                VISIT_FEED,
                new VisitQuest(questId, Math.min(count, vq.targetCount()), vq.targetCount(), completed, bonus),
                PigeonChange.of(levelBefore, pigeon),
                List.of(),
                pigeon.getFeedBalance());
    }

    /** 기본 퀘스트 진행 (숏폼 보기·가게 둘러보기). 같은 대상은 한 번만 세고, 완료되면 보너스 먹이 */
    @Transactional
    public QuestEventResponse recordEvent(Long memberId, QuestEventRequest request) {
        List<CompletedQuest> completed = new ArrayList<>();
        int totalBonus = 0;
        for (Quest quest : questRepository.findAllByBasicEvent(request.type())) {
            if (completionRepository.existsByMemberIdAndQuestId(memberId, quest.getId())
                    || eventLogRepository.existsByMemberIdAndQuestIdAndTargetId(memberId, quest.getId(), request.targetId())) {
                continue;
            }
            eventLogRepository.save(new QuestEventLog(memberId, quest.getId(), request.targetId()));
            if (eventLogRepository.countByMemberIdAndQuestId(memberId, quest.getId()) >= quest.getTargetCount()) {
                int bonus = completeOnce(memberId, quest);
                totalBonus += bonus;
                completed.add(new CompletedQuest(quest.getId(), quest.getTitle(), bonus));
            }
        }
        int balance = totalBonus > 0
                ? pigeonService.grantQuestFeed(memberId, totalBonus).getFeedBalance()
                : pigeonService.getPigeon(memberId).feedBalance();
        return new QuestEventResponse(completed, balance);
    }

    /** 회원 탈퇴 */
    @Transactional
    public void deleteAllOf(Long memberId) {
        visitRepository.deleteByMemberId(memberId);
        eventLogRepository.deleteByMemberId(memberId);
        completionRepository.deleteByMemberId(memberId);
    }

    /** 완료 보너스는 퀘스트마다 한 번만 */
    private int completeOnce(Long memberId, Quest quest) {
        if (completionRepository.existsByMemberIdAndQuestId(memberId, quest.getId())) {
            return 0;
        }
        completionRepository.save(new QuestCompletion(memberId, quest.getId()));
        return quest.getRewardFeed();
    }

    /**
     * 지금 손님에게 보이는 퀘스트.
     * - 기본(BASIC)은 항상
     * - "동네 가게 N곳 방문"(가게 제한 없는 VISIT)은 퀘스트 가게가 1곳 이상일 때
     * - 템플릿 퀘스트는 등록 기간 중인 참여 가게가 1곳 이상일 때. 목표는 참여 가게 수를 넘지 않음
     */
    private List<VisibleQuest> visibleQuests() {
        Set<Long> active = new HashSet<>(subscriptionRepository.findActiveStoreIds(KstTime.now()));
        List<Quest> quests = questRepository.findAllByOrderByIdAsc();
        Map<Long, List<Long>> participants = participationRepository
                .findAllByQuestIdIn(quests.stream().filter(Quest::isTemplate).map(Quest::getId).toList())
                .stream()
                .filter(p -> active.contains(p.getStoreId()))
                .collect(Collectors.groupingBy(QuestParticipation::getQuestId,
                        Collectors.mapping(QuestParticipation::getStoreId, Collectors.toList())));

        List<VisibleQuest> result = new ArrayList<>();
        for (Quest q : quests) {
            if (q.getType() == QuestType.BASIC) {
                result.add(new VisibleQuest(q, q.getTargetCount(), null, active));
            } else if (!q.isTemplate()) {
                if (!active.isEmpty()) {
                    result.add(new VisibleQuest(q, q.getTargetCount(), null, active));
                }
            } else {
                List<Long> storeIds = participants.getOrDefault(q.getId(), List.of());
                if (!storeIds.isEmpty()) {
                    result.add(new VisibleQuest(q, Math.min(q.getTargetCount(), storeIds.size()), storeIds.stream().sorted().toList(), active));
                }
            }
        }
        return result;
    }

    private record VisibleQuest(Quest quest, int targetCount, List<Long> storeIds, Set<Long> activeStoreIds) {
        QuestResponse toResponse(int count) {
            int current = Math.min(count, targetCount);
            return new QuestResponse(quest.getId(), quest.getTitle(), quest.getType(), targetCount, current,
                    quest.getRewardFeed(), current >= targetCount ? "COMPLETED" : "IN_PROGRESS",
                    quest.getTemplateKey(), storeIds);
        }
    }

    private static double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double r = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
