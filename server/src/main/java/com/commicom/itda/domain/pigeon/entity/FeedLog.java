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

import java.time.LocalDate;

/** 먹이를 받은 기록 (하루 무료 1개·광고 3개 제한 확인용) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(indexes = @Index(columnList = "memberId, feedDate"))
public class FeedLog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedSource source;

    @Column(nullable = false)
    private int amount;

    /** KST 날짜 */
    @Column(nullable = false)
    private LocalDate feedDate;

    /** 광고 보상 중복 방지 (광고 SDK 거래 id) */
    @Column(unique = true, length = 100)
    private String adTransactionId;

    public FeedLog(Long memberId, FeedSource source, int amount, LocalDate feedDate, String adTransactionId) {
        this.memberId = memberId;
        this.source = source;
        this.amount = amount;
        this.feedDate = feedDate;
        this.adTransactionId = adTransactionId;
    }
}
