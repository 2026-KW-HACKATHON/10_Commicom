package com.commicom.itda.domain.scrap.controller;

import com.commicom.itda.domain.scrap.dto.ScrapListResponse;
import com.commicom.itda.domain.scrap.dto.ScrapRequest;
import com.commicom.itda.domain.scrap.dto.ScrapStoreResponse;
import com.commicom.itda.domain.scrap.service.ScrapService;
import com.commicom.itda.global.response.ApiResponse;
import com.commicom.itda.global.response.SuccessStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Scrap", description = "스크랩 (가게 저장)")
@RestController
@RequestMapping("/api/scraps")
@RequiredArgsConstructor
public class ScrapController {

    private final ScrapService scrapService;

    @Operation(summary = "스크랩 추가", description = "가게를 스크랩에 추가한다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ScrapStoreResponse> addScrap(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody ScrapRequest request) {
        return ApiResponse.of(SuccessStatus.CREATED, scrapService.addScrap(memberId, request.storeId()));
    }

    @Operation(summary = "스크랩 취소", description = "스크랩한 가게를 취소한다.")
    @DeleteMapping("/{storeId}")
    public ApiResponse<Void> removeScrap(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId) {
        scrapService.removeScrap(memberId, storeId);
        return ApiResponse.onSuccess(null);
    }

    @Operation(summary = "내 스크랩 목록 조회", description = "내가 스크랩한 가게 목록을 최신순으로 반환한다.")
    @GetMapping
    public ApiResponse<ScrapListResponse> getMyScraps(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(scrapService.getMyScraps(memberId));
    }
}
