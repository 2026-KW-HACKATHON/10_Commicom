package com.commicom.itda.domain.coupon.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 사장님이 발행한 쿠폰 (할인은 사장님 부담, 손님이 쓰면 건당 수수료) */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(indexes = @Index(columnList = "storeId"))
public class Coupon extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long storeId;

    @Column(nullable = false, length = 30)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private DiscountType discountType;

    /** 금액(원) 또는 비율(%) */
    @Column(nullable = false)
    private int discountValue;

    @Column(nullable = false)
    private int minOrderAmount;

    @Column(nullable = false)
    private int totalQuantity;

    /** 손님에게 나간 수 (받기 + 비둘기 보상) */
    @Column(nullable = false)
    private int issuedCount = 0;

    @Column(nullable = false)
    private int usedCount = 0;

    /** 받은 날부터 며칠 동안 쓸 수 있는지 */
    @Column(nullable = false)
    private int validDays;

    /** 비둘기 레벨업 보상 쿠폰 풀에 내놓을지 */
    @Column(nullable = false)
    private boolean useAsPigeonReward;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CouponStatus status = CouponStatus.ACTIVE;

    @Builder
    private Coupon(Long storeId, String title, DiscountType discountType, int discountValue, int minOrderAmount,
                   int totalQuantity, int validDays, boolean useAsPigeonReward) {
        this.storeId = storeId;
        this.title = title;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.minOrderAmount = minOrderAmount;
        this.totalQuantity = totalQuantity;
        this.validDays = validDays;
        this.useAsPigeonReward = useAsPigeonReward;
    }

    public int remainingQuantity() {
        return totalQuantity - issuedCount;
    }

    /** 손님이 받을 수 있는 상태 */
    public boolean isIssuable() {
        return status == CouponStatus.ACTIVE && remainingQuantity() > 0;
    }

    /** 1장 내보냄. 다 나가면 소진 */
    public void issueOne() {
        this.issuedCount += 1;
        if (remainingQuantity() <= 0) {
            this.status = CouponStatus.SOLD_OUT;
        }
    }

    public void useOne() {
        this.usedCount += 1;
    }

    public void stop() {
        this.status = CouponStatus.STOPPED;
    }
}
