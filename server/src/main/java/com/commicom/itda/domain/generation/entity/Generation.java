package com.commicom.itda.domain.generation.entity;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Generation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private Member requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GenerationStatus status;

    @OneToOne(fetch = FetchType.LAZY)
    private Shortform shortform;

    @Column(length = 500)
    private String errorMessage;

    @Builder
    private Generation(Store store, Member requestedBy, GenerationStatus status) {
        this.store = store;
        this.requestedBy = requestedBy;
        this.status = status;
    }

    public void startProcessing() {
        this.status = GenerationStatus.PROCESSING;
    }

    public void complete(Shortform shortform) {
        this.status = GenerationStatus.COMPLETED;
        this.shortform = shortform;
    }

    public void fail(String errorMessage) {
        this.status = GenerationStatus.FAILED;
        this.errorMessage = errorMessage != null && errorMessage.length() > 490
                ? errorMessage.substring(0, 490) + "..." : errorMessage;
    }
}
