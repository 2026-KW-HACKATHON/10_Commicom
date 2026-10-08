package com.commicom.itda.domain.coupon.repository;

import com.commicom.itda.domain.coupon.entity.UserCoupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {

    List<UserCoupon> findAllByMemberId(Long memberId);

    List<UserCoupon> findAllByIdIn(Collection<Long> ids);

    boolean existsByMemberIdAndCouponId(Long memberId, Long couponId);

    boolean existsByRedeemCode(String redeemCode);

    /** 사용 처리를 두 번 하지 않도록 잠그고 읽음 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UserCoupon u where u.redeemCode = :redeemCode")
    Optional<UserCoupon> findByRedeemCodeForUpdate(String redeemCode);

    void deleteByMemberId(Long memberId);
}
