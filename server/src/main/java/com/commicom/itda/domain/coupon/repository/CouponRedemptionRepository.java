package com.commicom.itda.domain.coupon.repository;

import com.commicom.itda.domain.coupon.entity.CouponRedemption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CouponRedemptionRepository extends JpaRepository<CouponRedemption, Long> {

    /** 정산: from 이상 to 미만 */
    List<CouponRedemption> findAllByStoreIdAndRedeemedAtGreaterThanEqualAndRedeemedAtLessThanOrderByRedeemedAtDesc(
            Long storeId, LocalDateTime from, LocalDateTime to);
}
