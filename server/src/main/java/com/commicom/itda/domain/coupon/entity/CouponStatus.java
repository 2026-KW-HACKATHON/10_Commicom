package com.commicom.itda.domain.coupon.entity;

public enum CouponStatus {
    ACTIVE,
    /** 사장님이 발행 중지 (이미 받은 쿠폰은 계속 쓸 수 있음) */
    STOPPED,
    /** 발행 수량을 다 나눠 줌 */
    SOLD_OUT
}
