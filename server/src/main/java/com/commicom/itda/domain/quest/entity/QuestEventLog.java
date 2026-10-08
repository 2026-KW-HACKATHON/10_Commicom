package com.commicom.itda.domain.quest.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 기본 퀘스트 진행 기록 (같은 숏폼·가게는 한 번만) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"memberId", "questId", "targetId"}))
public class QuestEventLog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false)
    private Long questId;

    @Column(nullable = false)
    private Long targetId;

    public QuestEventLog(Long memberId, Long questId, Long targetId) {
        this.memberId = memberId;
        this.questId = questId;
        this.targetId = targetId;
    }
}
