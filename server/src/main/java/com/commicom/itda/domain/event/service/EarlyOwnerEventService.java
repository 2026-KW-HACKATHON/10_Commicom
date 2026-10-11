package com.commicom.itda.domain.event.service;

import com.commicom.itda.domain.event.dto.EventDtos.EarlyOwnerEvent;
import com.commicom.itda.domain.event.entity.EarlyOwnerReward;
import com.commicom.itda.domain.event.repository.EarlyOwnerRewardRepository;
import com.commicom.itda.domain.pro.entity.ProSubscription;
import com.commicom.itda.domain.pro.repository.ProSubscriptionRepository;
import com.commicom.itda.domain.quest.entity.QuestSubscription;
import com.commicom.itda.domain.quest.repository.QuestSubscriptionRepository;
import com.commicom.itda.global.util.KstTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 초기 사장님 이벤트: 시작일부터 비둘기 보상 쿠폰을 처음 발행한 가게 선착순 10곳에
 * 잇다 PRO + 퀘스트 가게 등록을 30일씩 무료로 (이미 이용 중이면 남은 기간 뒤로 연장)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EarlyOwnerEventService {

    public static final int LIMIT = 10;
    public static final int BENEFIT_DAYS = 30;

    private final EarlyOwnerRewardRepository rewardRepository;
    private final ProSubscriptionRepository proRepository;
    private final QuestSubscriptionRepository questSubscriptionRepository;

    /** 이벤트 시작일 (KST 0시). 로컬에서 미리 확인할 땐 --event.early-owner.starts-on=날짜 로 바꿈 */
    @Value("${event.early-owner.starts-on:2026-10-12}")
    private LocalDate startsOn;

    public EarlyOwnerEvent status() {
        int joined = (int) Math.min(rewardRepository.count(), LIMIT);
        String status = KstTime.now().isBefore(startsAt()) ? "UPCOMING" : joined >= LIMIT ? "CLOSED" : "OPEN";
        return new EarlyOwnerEvent(status, KstTime.offset(startsAt()), LIMIT, joined, LIMIT - joined, BENEFIT_DAYS);
    }

    /** 비둘기 보상 쿠폰을 발행했을 때: 조건이 맞으면 혜택을 주고 true */
    @Transactional
    public boolean onPigeonRewardCouponCreated(Long storeId, Long couponId) {
        LocalDateTime now = KstTime.now();
        if (now.isBefore(startsAt()) || rewardRepository.existsByStoreId(storeId) || rewardRepository.count() >= LIMIT) {
            return false;
        }
        rewardRepository.save(new EarlyOwnerReward(storeId, couponId, now));
        grantPro(storeId, now);
        grantQuestStore(storeId, now);
        return true;
    }

    private LocalDateTime startsAt() {
        return startsOn.atStartOfDay();
    }

    private void grantPro(Long storeId, LocalDateTime now) {
        ProSubscription pro = proRepository.findByStoreId(storeId).orElse(null);
        if (pro == null) {
            proRepository.save(new ProSubscription(storeId, KstTime.today().atStartOfDay(), endFrom(KstTime.today())));
        } else if (pro.isActive(now)) {
            pro.renew(pro.getStartedAt(), endFrom(pro.getExpiresAt().toLocalDate()));
        } else {
            pro.renew(KstTime.today().atStartOfDay(), endFrom(KstTime.today()));
        }
    }

    private void grantQuestStore(Long storeId, LocalDateTime now) {
        QuestSubscription sub = questSubscriptionRepository.findByStoreId(storeId).orElse(null);
        if (sub == null) {
            questSubscriptionRepository.save(new QuestSubscription(storeId, KstTime.today().atStartOfDay(), endFrom(KstTime.today())));
        } else if (sub.isActive(now)) {
            sub.renew(sub.getStartedAt(), endFrom(sub.getExpiresAt().toLocalDate()));
        } else {
            sub.renew(KstTime.today().atStartOfDay(), endFrom(KstTime.today()));
        }
    }

    private static LocalDateTime endFrom(LocalDate from) {
        return KstTime.endOfDay(from.plusDays(BENEFIT_DAYS));
    }
}
