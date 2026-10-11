package com.commicom.itda.domain.pigeon.repository;

import com.commicom.itda.domain.pigeon.entity.CouponVoucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CouponVoucherRepository extends JpaRepository<CouponVoucher, Long> {

    List<CouponVoucher> findAllByMemberIdOrderByIdDesc(Long memberId);

    List<CouponVoucher> findAllByMemberIdAndStatus(Long memberId, CouponVoucher.Status status);

    List<CouponVoucher> findAllByIdIn(Collection<Long> ids);

    void deleteByMemberId(Long memberId);
}
