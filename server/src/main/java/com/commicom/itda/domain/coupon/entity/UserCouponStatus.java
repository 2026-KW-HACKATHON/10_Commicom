package com.commicom.itda.domain.coupon.entity;

public enum UserCouponStatus {
    AVAILABLE,
    USED,
    /** 저장하지 않음 — 조회할 때 기한으로 판단 */
    EXPIRED
}
