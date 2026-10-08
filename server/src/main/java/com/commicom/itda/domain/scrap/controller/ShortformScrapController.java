package com.commicom.itda.domain.scrap.controller;

import com.commicom.itda.domain.scrap.dto.ScrapShortformListResponse;
import com.commicom.itda.domain.scrap.dto.ScrapShortformResponse;
import com.commicom.itda.domain.scrap.dto.ShortformScrapRequest;
import com.commicom.itda.domain.scrap.service.ShortformScrapService;
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
@RequestMapping("/api/scraps/shortforms")
@RequiredArgsConstructor
public class ShortformScrapController {

    private final ShortformScrapService shortformScrapService;

    @Operation(summary = "게시물 스크랩 추가", description = "게시물을 스크랩에 추가한다. 이미 스크랩했으면 SCRAP409_2.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ScrapShortformResponse> addScrap(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody ShortformScrapRequest request) {
        return ApiResponse.of(SuccessStatus.CREATED, shortformScrapService.addScrap(memberId, request.shortformId()));
    }

    @Operation(summary = "게시물 스크랩 취소", description = "스크랩하지 않은 게시물이면 SCRAP404_2.")
    @DeleteMapping("/{shortformId}")
    public ApiResponse<Void> removeScrap(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long shortformId) {
        shortformScrapService.removeScrap(memberId, shortformId);
        return ApiResponse.onSuccess(null);
    }

    @Operation(summary = "내 게시물 스크랩 목록 조회", description = "내가 스크랩한 게시물을 스크랩한 순서(최신순)로 반환한다.")
    @GetMapping
    public ApiResponse<ScrapShortformListResponse> getMyScraps(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(shortformScrapService.getMyScraps(memberId));
    }
}
