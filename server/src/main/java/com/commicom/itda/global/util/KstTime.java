package com.commicom.itda.global.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** 날짜 기준은 한국 시간(KST). "오늘"(하루 먹이·광고 횟수·QR 갱신)은 KST 자정에 바뀐다 */
public final class KstTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final ZoneOffset OFFSET = ZoneOffset.ofHours(9);

    private KstTime() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }

    /** 그날 23:59:59 */
    public static LocalDateTime endOfDay(LocalDate date) {
        return date.atTime(LocalTime.of(23, 59, 59));
    }

    /** 응답용: KST 로컬 시각 → +09:00 이 붙은 시각 */
    public static OffsetDateTime offset(LocalDateTime kst) {
        return kst == null ? null : kst.atOffset(OFFSET);
    }

    /** 응답용: createdAt 같은 감사 필드(서버 시간대로 저장됨) → +09:00 시각 (서버가 UTC 여도 맞게) */
    public static OffsetDateTime fromServerTime(LocalDateTime serverTime) {
        return serverTime == null ? null
                : serverTime.atZone(ZoneId.systemDefault()).withZoneSameInstant(ZONE).toOffsetDateTime();
    }
}
