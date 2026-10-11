package com.commicom.itda.domain.pigeon.entity;

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

/**
 * 쿠폰 교환권: 레벨업 뽑기에서 쿠폰이 나왔는데 쿠폰을 내놓은 사장님이 없을 때 대신 받음.
 * 기한 안에 쿠폰 풀이 생기면 쿠폰으로 바꾸고, 기한이 지나면 먹이로 바뀜
 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(indexes = @Index(columnList = "memberId"))
public class CouponVoucher extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    /** KST (만료일 23:59:59) */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** 쿠폰으로 바꿨으면 받은 회원 쿠폰 */
    private Long userCouponId;

    public CouponVoucher(Long memberId, LocalDateTime expiresAt) {
        this.memberId = memberId;
        this.expiresAt = expiresAt;
        this.status = Status.ISSUED;
    }

    /** 아직 안 바꿨는데 기한이 지남 → 먹이로 바꿀 차례 */
    public boolean isDue(LocalDateTime now) {
        return status == Status.ISSUED && !expiresAt.isAfter(now);
    }

    public void exchange(Long userCouponId) {
        this.status = Status.EXCHANGED;
        this.userCouponId = userCouponId;
    }

    public void expire() {
        this.status = Status.EXPIRED;
    }

    public enum Status {
        /** 쿠폰으로 바꿀 수 있음 */
        ISSUED,
        EXCHANGED,
        /** 기한이 지나 먹이로 바뀜 */
        EXPIRED
    }
}
