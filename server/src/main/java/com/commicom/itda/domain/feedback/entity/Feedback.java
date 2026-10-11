package com.commicom.itda.domain.feedback.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 앱 안 "의견 남기기" (로그인 없이도, 베타 체험 중에도 남길 수 있음) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Feedback extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 1~5 */
    @Column(nullable = false)
    private int rating;

    /** 좋았던 점 */
    @Column(length = 1000)
    private String good;

    /** 아쉬운 점 */
    @Column(length = 1000)
    private String bad;

    /** 남길 때 보던 화면 모드: USER / OWNER */
    @Column(length = 10)
    private String mode;

    /** 베타 체험 중이었는지 */
    @Column(nullable = false)
    private boolean beta;

    public Feedback(int rating, String good, String bad, String mode, boolean beta) {
        this.rating = rating;
        this.good = good;
        this.bad = bad;
        this.mode = mode;
        this.beta = beta;
    }
}
