package com.commicom.itda.domain.coupon.service;

import com.commicom.itda.domain.coupon.entity.Coupon;
import com.commicom.itda.domain.coupon.entity.UserCoupon;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.RewardCoupon;
import com.commicom.itda.domain.pigeon.service.PigeonRewardCouponIssuer;
import com.commicom.itda.global.util.KstTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/** 비둘기 레벨업 쿠폰 보상 = 사장님들이 "비둘기 보상"으로 내놓은 쿠폰 풀 */
@Component
@RequiredArgsConstructor
public class CouponPigeonRewardIssuer implements PigeonRewardCouponIssuer {

    private final CouponService couponService;

    @Override
    public Optional<RewardCoupon> issue(Long memberId) {
        return couponService.issuePigeonReward(memberId)
                .map(uc -> describe(List.of(uc.getId())).get(uc.getId()));
    }

    @Override
    public Map<Long, RewardCoupon> describe(Collection<Long> userCouponIds) {
        List<UserCoupon> owned = couponService.findUserCoupons(userCouponIds);
        Map<Long, Coupon> coupons = couponService.findCoupons(owned.stream().map(UserCoupon::getCouponId).toList());
        Map<Long, String> storeNames = couponService.storeNames(coupons.values().stream().map(Coupon::getStoreId).toList());
        return owned.stream()
                .filter(uc -> coupons.containsKey(uc.getCouponId()))
                .collect(Collectors.toMap(UserCoupon::getId, uc -> {
                    Coupon c = coupons.get(uc.getCouponId());
                    return new RewardCoupon(uc.getId(), storeNames.getOrDefault(c.getStoreId(), "가게"), c.getTitle(),
                            KstTime.offset(uc.getExpiresAt()));
                }));
    }
}
