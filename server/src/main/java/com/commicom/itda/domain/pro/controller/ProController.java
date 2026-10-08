package com.commicom.itda.domain.pro.controller;

import com.commicom.itda.domain.pro.dto.ProDtos.AutoRenewRequest;
import com.commicom.itda.domain.pro.dto.ProDtos.ProResponse;
import com.commicom.itda.domain.pro.service.ProService;
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
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Pro", description = "잇다 PRO 구독 (사장님)")
@RestController
@RequestMapping("/api/stores/{storeId}/pro")
@RequiredArgsConstructor
public class ProController {

    private final ProService proService;

    @Operation(summary = "PRO 구독 상태 (사장님)", description = "status: ACTIVE / EXPIRED / NONE. autoRenew=false 면 해지 예약")
    @GetMapping
    public ApiResponse<ProResponse> get(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId) {
        return ApiResponse.onSuccess(proService.get(memberId, storeId));
    }

    @Operation(summary = "PRO 가입 (사장님)", description = "30일. 해커톤: 결제는 모의 처리. 이용 중이면 PRO409")
    @PostMapping
    public ApiResponse<ProResponse> subscribe(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId) {
        return ApiResponse.onSuccess(proService.subscribe(memberId, storeId));
    }

    @Operation(summary = "PRO 해지 예약·취소 (사장님)",
            description = "autoRenew=false 면 해지 예약(만료일까지 이용), true 면 해지 취소. 이용 중이 아니면 PRO409_2")
    @PatchMapping
    public ApiResponse<ProResponse> changeAutoRenew(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId,
            @Valid @RequestBody AutoRenewRequest request) {
        return ApiResponse.onSuccess(proService.changeAutoRenew(memberId, storeId, request.autoRenew()));
    }
}
