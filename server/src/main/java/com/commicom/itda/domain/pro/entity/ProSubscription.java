package com.commicom.itda.domain.pro.entity;

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

/** 잇다 PRO 구독 (가게 단위, 30일). 만료돼도 행은 남기고 다시 가입하면 기간만 갱신 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProSubscription extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long storeId;

    /** KST */
    @Column(nullable = false)
    private LocalDateTime startedAt;

    /** KST (만료일 23:59:59) */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** false = 해지 예약 (만료일까지는 이용 가능) */
    @Column(nullable = false)
    private boolean autoRenew;

    public ProSubscription(Long storeId, LocalDateTime startedAt, LocalDateTime expiresAt) {
        this.storeId = storeId;
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
        this.autoRenew = true;
    }

    public boolean isActive(LocalDateTime now) {
        return expiresAt.isAfter(now);
    }

    public void renew(LocalDateTime startedAt, LocalDateTime expiresAt) {
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
        this.autoRenew = true;
    }

    public void changeAutoRenew(boolean autoRenew) {
        this.autoRenew = autoRenew;
    }
}
