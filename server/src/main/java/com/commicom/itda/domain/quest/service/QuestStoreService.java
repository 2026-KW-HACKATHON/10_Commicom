package com.commicom.itda.domain.quest.service;

import com.commicom.itda.domain.quest.dto.QuestDtos.OwnerTemplate;
import com.commicom.itda.domain.quest.dto.QuestDtos.OwnerTemplateList;
import com.commicom.itda.domain.quest.dto.QuestDtos.QrResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.SubscriptionResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.TemplateJoinResponse;
import com.commicom.itda.domain.quest.entity.Quest;
import com.commicom.itda.domain.quest.entity.QuestParticipation;
import com.commicom.itda.domain.quest.entity.QuestSubscription;
import com.commicom.itda.domain.quest.entity.QuestTemplate;
import com.commicom.itda.domain.quest.repository.QuestParticipationRepository;
import com.commicom.itda.domain.quest.repository.QuestRepository;
import com.commicom.itda.domain.quest.repository.QuestSubscriptionRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.util.KstTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** 사장님 쪽 퀘스트: 퀘스트 가게 등록(유료·30일), 템플릿 참여, 오늘의 방문 QR */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestStoreService {

    /** 퀘스트 가게 등록 기간 */
    public static final int SUBSCRIPTION_DAYS = 30;

    private final QuestSubscriptionRepository subscriptionRepository;
    private final QuestParticipationRepository participationRepository;
    private final QuestRepository questRepository;
    private final StoreRepository storeRepository;
    private final QuestQrService qrService;

    /** 지금 퀘스트 가게인 가게 id (지도 isQuestStore) */
    public Set<Long> activeStoreIds() {
        return new HashSet<>(subscriptionRepository.findActiveStoreIds(KstTime.now()));
    }

    public SubscriptionResponse getSubscription(Long storeId) {
        findStore(storeId);
        return subscriptionRepository.findByStoreId(storeId)
                .map(s -> toResponse(s, KstTime.now()))
                .orElse(new SubscriptionResponse(storeId, "NONE", null, null));
    }

    /** 퀘스트 가게 등록 (해커톤: 결제는 모의 처리). 만료됐으면 다시 30일 */
    @Transactional
    public SubscriptionResponse subscribe(Long memberId, Long storeId) {
        findMyStore(memberId, storeId);
        LocalDateTime now = KstTime.now();
        LocalDateTime start = KstTime.today().atStartOfDay();
        LocalDateTime end = KstTime.endOfDay(KstTime.today().plusDays(SUBSCRIPTION_DAYS));
        QuestSubscription sub = subscriptionRepository.findByStoreId(storeId).orElse(null);
        if (sub == null) {
            sub = subscriptionRepository.save(new QuestSubscription(storeId, start, end));
        } else if (sub.isActive(now)) {
            throw new BusinessException(ErrorCode.QUEST_SUBSCRIPTION_ACTIVE);
        } else {
            sub.renew(start, end);
        }
        return toResponse(sub, now);
    }

    public OwnerTemplateList getTemplates(Long memberId, Long storeId) {
        findMyStore(memberId, storeId);
        Set<Long> active = activeStoreIds();
        Map<String, Quest> quests = templateQuests();
        List<QuestParticipation> all = participationRepository.findAllByQuestIdIn(quests.values().stream().map(Quest::getId).toList());
        return new OwnerTemplateList(Arrays.stream(QuestTemplate.values())
                .filter(t -> quests.containsKey(t.getKey()))
                .map(t -> {
                    Long questId = quests.get(t.getKey()).getId();
                    List<QuestParticipation> ps = all.stream().filter(p -> p.getQuestId().equals(questId)).toList();
                    return new OwnerTemplate(t.getKey(), t.getTitle(), t.description(),
                            QuestTemplate.TARGET_COUNT, QuestTemplate.REWARD_FEED,
                            (int) ps.stream().filter(p -> active.contains(p.getStoreId())).count(),
                            ps.stream().anyMatch(p -> p.getStoreId().equals(storeId)));
                })
                .toList());
    }

    /** 템플릿 퀘스트 참여 (퀘스트 가게로 등록돼 있어야 함) */
    @Transactional
    public TemplateJoinResponse join(Long memberId, Long storeId, String templateKey) {
        findMyStore(memberId, storeId);
        Quest quest = templateQuest(templateKey);
        if (!activeStoreIds().contains(storeId)) {
            throw new BusinessException(ErrorCode.QUEST_STORE_NOT_ACTIVE);
        }
        if (participationRepository.existsByQuestIdAndStoreId(quest.getId(), storeId)) {
            throw new BusinessException(ErrorCode.QUEST_ALREADY_JOINED);
        }
        participationRepository.save(new QuestParticipation(quest.getId(), storeId));
        return new TemplateJoinResponse(templateKey, true);
    }

    @Transactional
    public TemplateJoinResponse leave(Long memberId, Long storeId, String templateKey) {
        findMyStore(memberId, storeId);
        Quest quest = templateQuest(templateKey);
        if (!participationRepository.existsByQuestIdAndStoreId(quest.getId(), storeId)) {
            throw new BusinessException(ErrorCode.QUEST_NOT_JOINED);
        }
        participationRepository.deleteByQuestIdAndStoreId(quest.getId(), storeId);
        return new TemplateJoinResponse(templateKey, false);
    }

    /** 오늘의 방문 인증 QR (KST 자정에 바뀜) */
    public QrResponse getQr(Long memberId, Long storeId) {
        findMyStore(memberId, storeId);
        if (!activeStoreIds().contains(storeId)) {
            throw new BusinessException(ErrorCode.QUEST_STORE_NOT_ACTIVE);
        }
        LocalDate today = KstTime.today();
        return new QrResponse(qrService.tokenOf(storeId, today), KstTime.offset(KstTime.endOfDay(today)));
    }

    private Map<String, Quest> templateQuests() {
        return questRepository.findAllByOrderByIdAsc().stream()
                .filter(Quest::isTemplate)
                .collect(Collectors.toMap(Quest::getTemplateKey, Function.identity()));
    }

    private Quest templateQuest(String templateKey) {
        if (QuestTemplate.ofKey(templateKey).isEmpty()) {
            throw new BusinessException(ErrorCode.QUEST_TEMPLATE_NOT_FOUND);
        }
        return questRepository.findByTemplateKey(templateKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUEST_TEMPLATE_NOT_FOUND));
    }

    private Store findStore(Long storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
    }

    private Store findMyStore(Long memberId, Long storeId) {
        Store store = findStore(storeId);
        if (!store.isOwnedBy(memberId)) {
            throw new BusinessException(ErrorCode.STORE_FORBIDDEN);
        }
        return store;
    }

    private static SubscriptionResponse toResponse(QuestSubscription s, LocalDateTime now) {
        return new SubscriptionResponse(s.getStoreId(), s.isActive(now) ? "ACTIVE" : "EXPIRED",
                KstTime.offset(s.getStartedAt()), KstTime.offset(s.getExpiresAt()));
    }
}
