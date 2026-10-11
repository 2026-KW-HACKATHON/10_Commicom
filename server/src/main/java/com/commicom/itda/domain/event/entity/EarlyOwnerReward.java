package com.commicom.itda.domain.event.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 초기 사장님 이벤트 당첨 가게 (가게당 1번, 선착순) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EarlyOwnerReward extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long storeId;

    /** 참여 조건이 된 비둘기 보상 쿠폰 */
    @Column(nullable = false)
    private Long couponId;

    /** KST */
    @Column(nullable = false)
    private LocalDateTime grantedAt;

    public EarlyOwnerReward(Long storeId, Long couponId, LocalDateTime grantedAt) {
        this.storeId = storeId;
        this.couponId = couponId;
        this.grantedAt = grantedAt;
    }
}
