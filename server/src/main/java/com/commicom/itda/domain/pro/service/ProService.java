package com.commicom.itda.domain.pro.service;

import com.commicom.itda.domain.pro.dto.ProDtos.ProResponse;
import com.commicom.itda.domain.pro.entity.ProSubscription;
import com.commicom.itda.domain.pro.repository.ProSubscriptionRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.util.KstTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 잇다 PRO 구독 (사장님 가게 단위, 30일). 해커톤: 결제는 모의 처리하고 자동 갱신 결제도 하지 않는다.
 * 혜택: 숏폼 피드 우선 노출(ShortformService), 영상 재수정·원본 다운로드(클라이언트가 status 로 판단)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProService {

    /** PRO 구독 기간 */
    public static final int SUBSCRIPTION_DAYS = 30;

    private final ProSubscriptionRepository proRepository;
    private final StoreRepository storeRepository;

    public ProResponse get(Long memberId, Long storeId) {
        findMyStore(memberId, storeId);
        return proRepository.findByStoreId(storeId)
                .map(p -> toResponse(p, KstTime.now()))
                .orElse(new ProResponse(storeId, "NONE", null, null, false));
    }

    /** PRO 가입 (모의 결제). 만료됐으면 다시 30일 */
    @Transactional
    public ProResponse subscribe(Long memberId, Long storeId) {
        findMyStore(memberId, storeId);
        LocalDateTime now = KstTime.now();
        LocalDateTime start = KstTime.today().atStartOfDay();
        LocalDateTime end = KstTime.endOfDay(KstTime.today().plusDays(SUBSCRIPTION_DAYS));
        ProSubscription pro = proRepository.findByStoreId(storeId).orElse(null);
        if (pro == null) {
            pro = proRepository.save(new ProSubscription(storeId, start, end));
        } else if (pro.isActive(now)) {
            throw new BusinessException(ErrorCode.PRO_ALREADY_ACTIVE);
        } else {
            pro.renew(start, end);
        }
        return toResponse(pro, now);
    }

    /** 해지 예약(false) · 해지 취소(true). 이용 중일 때만 */
    @Transactional
    public ProResponse changeAutoRenew(Long memberId, Long storeId, boolean autoRenew) {
        findMyStore(memberId, storeId);
        LocalDateTime now = KstTime.now();
        ProSubscription pro = proRepository.findByStoreId(storeId)
                .filter(p -> p.isActive(now))
                .orElseThrow(() -> new BusinessException(ErrorCode.PRO_NOT_ACTIVE));
        pro.changeAutoRenew(autoRenew);
        return toResponse(pro, now);
    }

    private Store findMyStore(Long memberId, Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
        if (!store.isOwnedBy(memberId)) {
            throw new BusinessException(ErrorCode.STORE_FORBIDDEN);
        }
        return store;
    }

    private static ProResponse toResponse(ProSubscription p, LocalDateTime now) {
        return new ProResponse(p.getStoreId(), p.isActive(now) ? "ACTIVE" : "EXPIRED",
                KstTime.offset(p.getStartedAt()), KstTime.offset(p.getExpiresAt()), p.isAutoRenew());
    }
}
