package com.commicom.itda.domain.notice.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 공지사항 (관리자 화면에서 작성) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notice extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    /** 본문 (줄바꿈 그대로 보여 줌) */
    @Column(nullable = false, length = 5000)
    private String body;

    /** 목록 맨 위 고정 */
    @Column(nullable = false)
    private boolean pinned;

    public Notice(String title, String body, boolean pinned) {
        update(title, body, pinned);
    }

    public void update(String title, String body, boolean pinned) {
        this.title = title;
        this.body = body;
        this.pinned = pinned;
    }
}
