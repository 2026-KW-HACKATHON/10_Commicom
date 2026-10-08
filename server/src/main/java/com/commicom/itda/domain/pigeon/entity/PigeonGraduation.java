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

/** Lv.10 으로 졸업한 비둘기 (내 비둘기 앨범) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(indexes = @Index(columnList = "memberId"))
public class PigeonGraduation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    /** 몇 번째 비둘기였는지 */
    @Column(nullable = false)
    private int generation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PigeonBreed breed;

    /** 알을 받은 시각 (KST) */
    @Column(nullable = false)
    private LocalDateTime startedAt;

    /** KST */
    @Column(nullable = false)
    private LocalDateTime graduatedAt;

    /** 이 비둘기로 받은 레벨업 쿠폰 수 */
    @Column(nullable = false)
    private int rewardCouponCount;

    public PigeonGraduation(Long memberId, int generation, PigeonBreed breed, LocalDateTime startedAt,
                            LocalDateTime graduatedAt, int rewardCouponCount) {
        this.memberId = memberId;
        this.generation = generation;
        this.breed = breed;
        this.startedAt = startedAt;
        this.graduatedAt = graduatedAt;
        this.rewardCouponCount = rewardCouponCount;
    }
}
