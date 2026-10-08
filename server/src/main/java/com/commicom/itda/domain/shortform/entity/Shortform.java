package com.commicom.itda.domain.shortform.entity;

import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Shortform extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private Store store;

    /** AI 생성 이미지 URL */
    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false, length = 200)
    private String title;

    @Builder
    private Shortform(Store store, String imageUrl, String title) {
        this.store = store;
        this.imageUrl = imageUrl;
        this.title = title;
    }
}
