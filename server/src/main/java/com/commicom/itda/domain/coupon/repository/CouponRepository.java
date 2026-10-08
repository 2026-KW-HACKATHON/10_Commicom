package com.commicom.itda.domain.coupon.repository;

import com.commicom.itda.domain.coupon.entity.Coupon;
import com.commicom.itda.domain.coupon.entity.CouponStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    List<Coupon> findAllByStoreIdOrderByIdDesc(Long storeId);

    List<Coupon> findAllByStoreIdAndStatusOrderByIdDesc(Long storeId, CouponStatus status);

    List<Coupon> findAllByStatusAndUseAsPigeonRewardTrue(CouponStatus status);

    /** 발행 수량을 동시에 넘기지 않도록 행을 잠그고 읽음 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Coupon c where c.id = :id")
    Optional<Coupon> findByIdForUpdate(Long id);

    /** 가게별 지금 받을 수 있는 쿠폰 수 (지도 availableCouponCount) — [storeId, count] */
    @Query("select c.storeId, count(c) from Coupon c where c.status = com.commicom.itda.domain.coupon.entity.CouponStatus.ACTIVE "
            + "and c.issuedCount < c.totalQuantity group by c.storeId")
    List<Object[]> countIssuableByStore();
}
