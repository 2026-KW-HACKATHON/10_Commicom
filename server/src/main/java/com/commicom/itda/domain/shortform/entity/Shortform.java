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

    @Column(nullable = false)
    private String videoUrl;

    private String thumbnailUrl;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String script;

    /** 영상 길이 (초 단위) */
    @Column(nullable = false)
    private int duration;

    @Builder
    private Shortform(Store store, String videoUrl, String thumbnailUrl,
                      String title, String script, int duration) {
        this.store = store;
        this.videoUrl = videoUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.title = title;
        this.script = script;
        this.duration = duration;
    }
}
