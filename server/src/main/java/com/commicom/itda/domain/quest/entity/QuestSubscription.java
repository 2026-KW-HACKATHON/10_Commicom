package com.commicom.itda.domain.quest.entity;

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

/** 퀘스트 가게 등록 (유료, 30일). 만료돼도 행은 남기고 다시 등록하면 기간만 갱신 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestSubscription extends BaseTimeEntity {

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

    public QuestSubscription(Long storeId, LocalDateTime startedAt, LocalDateTime expiresAt) {
        this.storeId = storeId;
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
    }

    public boolean isActive(LocalDateTime now) {
        return expiresAt.isAfter(now);
    }

    public void renew(LocalDateTime startedAt, LocalDateTime expiresAt) {
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
    }
}
