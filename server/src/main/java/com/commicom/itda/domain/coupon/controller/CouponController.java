package com.commicom.itda.domain.coupon.controller;

import com.commicom.itda.domain.coupon.dto.CouponDtos.DownloadResponse;
import com.commicom.itda.domain.coupon.dto.CouponDtos.MyCouponPage;
import com.commicom.itda.domain.coupon.dto.CouponDtos.RedeemRequest;
import com.commicom.itda.domain.coupon.dto.CouponDtos.RedeemResponse;
import com.commicom.itda.domain.coupon.entity.UserCouponStatus;
import com.commicom.itda.domain.coupon.service.CouponService;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Coupon", description = "쿠폰 받기·내 쿠폰함·사용 처리")
@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @Operation(summary = "쿠폰 받기", description = "같은 쿠폰은 한 번만. 받은 날부터 validDays 일 동안 쓸 수 있다")
    @PostMapping("/{couponId}/downloads")
    public ApiResponse<DownloadResponse> download(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long couponId) {
        return ApiResponse.onSuccess(couponService.download(memberId, couponId));
    }

    @Operation(summary = "내 쿠폰함", description = "status: AVAILABLE / USED / EXPIRED (없으면 전체). 쓸 수 있는 쿠폰은 기한 임박 순")
    @GetMapping("/me")
    public ApiResponse<MyCouponPage> mine(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @RequestParam(required = false) UserCouponStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.onSuccess(couponService.mine(memberId, status, page, size));
    }

    @Operation(summary = "쿠폰 사용 처리 (사장님)", description = "손님이 보여 준 6자리 코드. 내 가게 쿠폰만, 건당 수수료가 정산에 남는다")
    @PostMapping("/redeem")
    public ApiResponse<RedeemResponse> redeem(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody RedeemRequest request) {
        return ApiResponse.onSuccess(couponService.redeem(memberId, request.redeemCode()));
    }
}
