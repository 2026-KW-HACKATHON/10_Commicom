package com.commicom.itda.domain.pigeon.service;

import com.commicom.itda.domain.pigeon.dto.PigeonDtos.RewardCoupon;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/** 레벨업 뽑기에서 쿠폰이 나왔을 때 사장님들이 내놓은 쿠폰 풀에서 1장 발급 (쿠폰 도메인이 구현) */
public interface PigeonRewardCouponIssuer {

    /** 발급한 쿠폰, 풀이 비었으면 empty */
    Optional<RewardCoupon> issue(Long memberId);

    /** 성장 기록에 보여 줄 쿠폰 정보 (회원 쿠폰 id → 정보) */
    Map<Long, RewardCoupon> describe(Collection<Long> userCouponIds);
}
