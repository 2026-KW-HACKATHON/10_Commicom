package com.commicom.itda.domain.coupon.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 손님이 가진 쿠폰. 가게에서 사용 코드(6자리)를 보여 주면 사장님이 사용 처리 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(indexes = @Index(columnList = "memberId"))
public class UserCoupon extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false)
    private Long couponId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserCouponSource source;

    @Column(nullable = false, unique = true, length = 10)
    private String redeemCode;

    /** AVAILABLE / USED (기한 지남은 조회할 때 expiresAt 으로 판단) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserCouponStatus status = UserCouponStatus.AVAILABLE;

    /** KST (만료일 23:59:59) */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** KST */
    private LocalDateTime usedAt;

    public UserCoupon(Long memberId, Long couponId, UserCouponSource source, String redeemCode, LocalDateTime expiresAt) {
        this.memberId = memberId;
        this.couponId = couponId;
        this.source = source;
        this.redeemCode = redeemCode;
        this.expiresAt = expiresAt;
    }

    /** 지금 상태 (사용 안 했는데 기한이 지났으면 EXPIRED) */
    public UserCouponStatus effectiveStatus(LocalDateTime now) {
        if (status == UserCouponStatus.AVAILABLE && expiresAt.isBefore(now)) {
            return UserCouponStatus.EXPIRED;
        }
        return status;
    }

    public void use(LocalDateTime now) {
        this.status = UserCouponStatus.USED;
        this.usedAt = now;
    }
}
