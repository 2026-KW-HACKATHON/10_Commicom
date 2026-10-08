package com.commicom.itda.domain.pigeon.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 레벨 표 (2026-10-08 확정, 2026-10-09 알 추가). 상수 = 현재 레벨 → 다음 레벨.
 * 알(Lv.0)은 먹이 1개로 부화(뽑기 없음). Lv.1 부터는 레벨업마다 뽑기: 쿠폰 / 먹이 1개 / 먹이 2개
 */
@Getter
@RequiredArgsConstructor
public enum PigeonLevel {

    EGG(0, 1, 0, 0),
    LV1(1, 3, 0.01, 0.7),
    LV2(2, 5, 0.015, 0.7),
    LV3(3, 8, 0.02, 0.7),
    LV4(4, 11, 0.2, 0.7),
    LV5(5, 14, 0.04, 0.7),
    LV6(6, 17, 0.045, 0.7),
    LV7(7, 20, 0.05, 0.7),
    LV8(8, 25, 0.075, 0.7),
    LV9(9, 30, 0.99, 0.007);

    public static final int EGG_LEVEL = 0;
    public static final int MAX_LEVEL = 10;

    private final int level;
    private final int requiredFeed;
    private final double couponRate;
    /** 먹이 1개 확률 (나머지가 먹이 2개) */
    private final double feed1Rate;

    public static PigeonLevel of(int level) {
        return values()[level];
    }

    /** 최고 레벨이면 null */
    public static Integer requiredFeed(int level) {
        return level >= MAX_LEVEL ? null : of(level).requiredFeed;
    }
}
