package com.commicom.itda.domain.coupon.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 쿠폰 사용 처리 기록 = 정산 내역 (쓴 순간의 쿠폰 이름·할인·수수료를 그대로 남김).
 * 손님이 탈퇴해도 정산은 남는다
 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(indexes = @Index(columnList = "storeId, redeemedAt"))
public class CouponRedemption extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long storeId;

    @Column(nullable = false, unique = true)
    private Long userCouponId;

    @Column(nullable = false, length = 30)
    private String title;

    @Column(nullable = false)
    private int discountValue;

    /** 건당 수수료 (원) */
    @Column(nullable = false)
    private int fee;

    /** KST */
    @Column(nullable = false)
    private LocalDateTime redeemedAt;

    public CouponRedemption(Long storeId, Long userCouponId, String title, int discountValue, int fee, LocalDateTime redeemedAt) {
        this.storeId = storeId;
        this.userCouponId = userCouponId;
        this.title = title;
        this.discountValue = discountValue;
        this.fee = fee;
        this.redeemedAt = redeemedAt;
    }
}
