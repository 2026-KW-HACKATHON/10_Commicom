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

/** 레벨업·뽑기 기록 (비둘기 성장 기록 화면) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(indexes = @Index(columnList = "memberId"))
public class PigeonLevelHistory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    /** 몇 번째 비둘기의 기록인지 */
    @Column(nullable = false)
    private int generation;

    @Column(nullable = false)
    private int fromLevel;

    @Column(nullable = false)
    private int toLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RewardType rewardType;

    @Column(nullable = false)
    private int feedAmount;

    /** 쿠폰 보상이면 받은 쿠폰 (쿠폰 API 연동 후 채움) */
    private Long userCouponId;

    public PigeonLevelHistory(Long memberId, int generation, int fromLevel, int toLevel, RewardType rewardType, int feedAmount, Long userCouponId) {
        this.memberId = memberId;
        this.generation = generation;
        this.fromLevel = fromLevel;
        this.toLevel = toLevel;
        this.rewardType = rewardType;
        this.feedAmount = feedAmount;
        this.userCouponId = userCouponId;
    }

    public enum RewardType {
        FEED,
        COUPON
    }
}
