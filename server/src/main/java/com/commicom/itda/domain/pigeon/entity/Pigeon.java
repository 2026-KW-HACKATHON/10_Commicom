package com.commicom.itda.domain.pigeon.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 회원이 지금 키우는 비둘기 (회원 1명당 1마리).
 * 알(Lv.0)로 시작 → 먹이 1개로 부화(종류 랜덤) → Lv.10 → 졸업하면 앨범에 남기고 새 알(다음 기수)
 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pigeon extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long memberId;

    /** 0 = 알 */
    @Column(nullable = false)
    private int level = PigeonLevel.EGG_LEVEL;

    /** 이번 레벨에서 먹은 먹이 */
    @Column(nullable = false)
    private int currentFeed = 0;

    /** 받았지만 아직 안 먹인 먹이 (먹이 주기를 눌러야 레벨업). 졸업해도 다음 비둘기에게 이어짐 */
    @Column(nullable = false)
    private int feedBalance = 0;

    /** 부화 전(알)이면 null */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PigeonBreed breed;

    /** 몇 번째 비둘기인지 (졸업할 때마다 +1) */
    @Column(nullable = false)
    private int generation = 1;

    /** 이 비둘기(알)를 받은 시각 (KST) */
    @Column(nullable = false)
    private LocalDateTime startedAt;

    public Pigeon(Long memberId, LocalDateTime startedAt) {
        this.memberId = memberId;
        this.startedAt = startedAt;
    }

    public boolean isEgg() {
        return level == PigeonLevel.EGG_LEVEL;
    }

    public boolean isMaxLevel() {
        return level >= PigeonLevel.MAX_LEVEL;
    }

    public void addBalance(int amount) {
        this.feedBalance += amount;
    }

    /** 보유 먹이에서 꺼내 먹임 (레벨업은 호출하는 쪽에서 levelUp 으로) */
    public void eat(int amount) {
        this.feedBalance -= amount;
        this.currentFeed += amount;
    }

    public void levelUp(int usedFeed) {
        this.currentFeed -= usedFeed;
        this.level += 1;
        if (isMaxLevel()) {
            this.currentFeed = 0;
        }
    }

    /** 알에서 깨어남 (Lv.0 → Lv.1) */
    public void hatch(int usedFeed, PigeonBreed breed) {
        levelUp(usedFeed);
        this.breed = breed;
    }

    /** 부화했는데 종류가 없는 예전 비둘기 */
    public void assignBreedIfMissing() {
        if (!isEgg() && breed == null) {
            this.breed = PigeonBreed.random();
        }
    }

    /** 졸업 → 새 알 (보유 먹이는 이어짐) */
    public void startNext(LocalDateTime now) {
        this.level = PigeonLevel.EGG_LEVEL;
        this.currentFeed = 0;
        this.breed = null;
        this.generation += 1;
        this.startedAt = now;
    }
}
