package com.commicom.itda.domain.coupon.controller;

import com.commicom.itda.domain.coupon.dto.CouponDtos.AvailableCouponList;
import com.commicom.itda.domain.coupon.dto.CouponDtos.CreateRequest;
import com.commicom.itda.domain.coupon.dto.CouponDtos.CreateResponse;
import com.commicom.itda.domain.coupon.dto.CouponDtos.OwnerCouponList;
import com.commicom.itda.domain.coupon.dto.CouponDtos.Settlement;
import com.commicom.itda.domain.coupon.dto.CouponDtos.StatusRequest;
import com.commicom.itda.domain.coupon.dto.CouponDtos.StatusResponse;
import com.commicom.itda.domain.coupon.entity.CouponStatus;
import com.commicom.itda.domain.coupon.service.CouponService;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Store Coupon", description = "가게 쿠폰 (사장님 발행·정산 / 손님 받을 수 있는 쿠폰)")
@RestController
@RequestMapping("/api/stores/{storeId}")
@RequiredArgsConstructor
public class StoreCouponController {

    private final CouponService couponService;

    @Operation(summary = "쿠폰 발행 (사장님)",
            description = "정액(AMOUNT) 100원 이상 / 정률(RATE) 10~80%, 수량 1~1,000장, 유효 기간 1~30일. useAsPigeonReward: 비둘기 레벨업 보상 풀에 내놓기")
    @PostMapping("/coupons")
    public ApiResponse<CreateResponse> create(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId,
            @Valid @RequestBody CreateRequest request) {
        return ApiResponse.onSuccess(couponService.create(memberId, storeId, request));
    }

    @Operation(summary = "내 가게 쿠폰 목록 (사장님)", description = "status: ACTIVE / STOPPED / SOLD_OUT (없으면 전체)")
    @GetMapping("/coupons")
    public ApiResponse<OwnerCouponList> ownerList(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId,
            @RequestParam(required = false) CouponStatus status) {
        return ApiResponse.onSuccess(couponService.ownerList(memberId, storeId, status));
    }

    @Operation(summary = "쿠폰 발행 중지 (사장님)", description = "body { \"status\": \"STOPPED\" }. 이미 받은 쿠폰은 기한까지 쓸 수 있다")
    @PatchMapping("/coupons/{couponId}")
    public ApiResponse<StatusResponse> stop(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId,
            @PathVariable Long couponId,
            @Valid @RequestBody StatusRequest request) {
        return ApiResponse.onSuccess(couponService.stop(memberId, storeId, couponId));
    }

    @Operation(summary = "가게에서 받을 수 있는 쿠폰", description = "로그인했으면 alreadyDownloaded 로 이미 받았는지 알려 준다")
    @GetMapping("/coupons/available")
    public ApiResponse<AvailableCouponList> available(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId) {
        return ApiResponse.onSuccess(couponService.available(memberId, storeId));
    }

    @Operation(summary = "쿠폰 정산 (사장님)", description = "month=YYYY-MM (KST). 사용 건수·할인 합계·수수료 합계와 내역")
    @GetMapping("/coupon-settlements")
    public ApiResponse<Settlement> settlement(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId,
            @RequestParam String month) {
        return ApiResponse.onSuccess(couponService.settlement(memberId, storeId, month));
    }
}
