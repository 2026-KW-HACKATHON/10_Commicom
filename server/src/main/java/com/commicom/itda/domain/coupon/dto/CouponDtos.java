package com.commicom.itda.domain.coupon.dto;

import com.commicom.itda.domain.coupon.entity.CouponStatus;
import com.commicom.itda.domain.coupon.entity.DiscountType;
import com.commicom.itda.domain.coupon.entity.UserCouponSource;
import com.commicom.itda.domain.coupon.entity.UserCouponStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;

/** 쿠폰 API 요청·응답 */
public final class CouponDtos {

    private CouponDtos() {
    }

    /** POST /api/stores/{storeId}/coupons (할인 금액·비율 범위는 서비스에서 할인 종류별로 검사) */
    public record CreateRequest(
            @NotBlank(message = "쿠폰 이름을 입력해 주세요")
            @Size(max = 30, message = "쿠폰 이름은 1~30자로 입력해 주세요")
            String title,

            @NotNull(message = "할인 종류를 골라 주세요")
            DiscountType discountType,

            @NotNull(message = "할인 값을 입력해 주세요")
            Integer discountValue,

            @Min(value = 0, message = "최소 주문 금액을 확인해 주세요")
            Integer minOrderAmount,

            @NotNull(message = "발행 수량을 입력해 주세요")
            @Min(value = 1, message = "발행 수량은 1~1,000장 사이여야 해요")
            @Max(value = 1000, message = "발행 수량은 1~1,000장 사이여야 해요")
            Integer totalQuantity,

            @NotNull(message = "유효 기간을 입력해 주세요")
            @Min(value = 1, message = "유효 기간은 1~30일 사이여야 해요")
            @Max(value = 30, message = "유효 기간은 1~30일 사이여야 해요")
            Integer validDays,

            Boolean useAsPigeonReward
    ) {
    }

    public record CreateResponse(Long couponId, CouponStatus status, OffsetDateTime createdAt) {
    }

    /** 사장님 쿠폰 목록 */
    public record OwnerCoupon(
            Long couponId,
            String title,
            DiscountType discountType,
            int discountValue,
            int minOrderAmount,
            int totalQuantity,
            int issuedCount,
            int usedCount,
            int remainingQuantity,
            boolean useAsPigeonReward,
            CouponStatus status,
            OffsetDateTime createdAt
    ) {
    }

    public record OwnerCouponList(List<OwnerCoupon> coupons) {
    }

    /** PATCH /api/stores/{storeId}/coupons/{couponId} — 지금은 발행 중지(STOPPED)만 */
    public record StatusRequest(
            @NotNull(message = "바꿀 상태를 알려 주세요")
            @Pattern(regexp = "STOPPED", message = "발행 중지(STOPPED)만 할 수 있어요")
            String status
    ) {
    }

    public record StatusResponse(Long couponId, CouponStatus status) {
    }

    /** 손님: 가게에서 받을 수 있는 쿠폰 */
    public record AvailableCoupon(
            Long couponId,
            String title,
            DiscountType discountType,
            int discountValue,
            int minOrderAmount,
            int validDays,
            int remainingQuantity,
            boolean alreadyDownloaded
    ) {
    }

    public record AvailableCouponList(List<AvailableCoupon> coupons) {
    }

    public record DownloadResponse(Long userCouponId, String redeemCode, OffsetDateTime expiresAt) {
    }

    /** 내 쿠폰함 */
    public record MyCoupon(
            Long userCouponId,
            Long storeId,
            String storeName,
            String title,
            DiscountType discountType,
            int discountValue,
            int minOrderAmount,
            UserCouponSource source,
            String redeemCode,
            UserCouponStatus status,
            OffsetDateTime expiresAt,
            OffsetDateTime usedAt
    ) {
    }

    public record MyCouponPage(List<MyCoupon> coupons, int page, int size, boolean hasNext) {
    }

    /** POST /api/coupons/redeem (사장님) */
    public record RedeemRequest(
            @NotBlank(message = "쿠폰 코드를 입력해 주세요")
            @Size(max = 10)
            String redeemCode
    ) {
    }

    public record RedeemResponse(
            Long userCouponId,
            String title,
            DiscountType discountType,
            int discountValue,
            int minOrderAmount,
            int fee,
            OffsetDateTime redeemedAt
    ) {
    }

    /** GET /api/stores/{storeId}/coupon-settlements?month=YYYY-MM */
    public record Settlement(String month, int usedCount, long totalDiscount, long totalFee, List<SettlementItem> items) {
    }

    public record SettlementItem(Long userCouponId, String title, int discountValue, int fee, OffsetDateTime redeemedAt) {
    }
}
