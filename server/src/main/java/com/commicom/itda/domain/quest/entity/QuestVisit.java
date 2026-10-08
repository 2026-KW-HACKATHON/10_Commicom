package com.commicom.itda.domain.quest.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/** 방문 인증 (한 퀘스트에서 같은 가게는 한 번, 한 가게는 하루 한 번) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"memberId", "questId", "storeId"}),
        indexes = @Index(columnList = "memberId, storeId, visitDate"))
public class QuestVisit extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false)
    private Long questId;

    @Column(nullable = false)
    private Long storeId;

    /** KST 날짜 */
    @Column(nullable = false)
    private LocalDate visitDate;

    public QuestVisit(Long memberId, Long questId, Long storeId, LocalDate visitDate) {
        this.memberId = memberId;
        this.questId = questId;
        this.storeId = storeId;
        this.visitDate = visitDate;
    }
}
