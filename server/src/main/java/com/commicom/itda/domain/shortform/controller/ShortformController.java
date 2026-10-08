package com.commicom.itda.domain.shortform.controller;

import com.commicom.itda.domain.shortform.dto.ShortformDetailResponse;
import com.commicom.itda.domain.shortform.dto.ShortformFeedResponse;
import com.commicom.itda.domain.shortform.service.ShortformService;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Shortform", description = "숏폼 조회")
@RestController
@RequestMapping("/api/shortforms")
@RequiredArgsConstructor
public class ShortformController {

    private final ShortformService shortformService;

    @Operation(summary = "숏폼 피드 조회", description = "최신순 숏폼 목록을 페이지네이션하여 반환한다. storeId를 주면 해당 가게의 숏폼만 반환한다.")
    @GetMapping
    public ApiResponse<ShortformFeedResponse> getFeed(
            @Parameter(description = "가게 필터 (없으면 전체)")
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.onSuccess(shortformService.getFeed(storeId, page, size));
    }

    @Operation(summary = "숏폼 단건 조회", description = "숏폼 ID로 상세 정보(영상 URL, 스크립트, 가게 정보)를 조회한다.")
    @GetMapping("/{shortformId}")
    public ApiResponse<ShortformDetailResponse> getShortform(@PathVariable Long shortformId) {
        return ApiResponse.onSuccess(shortformService.getShortform(shortformId));
    }
}
