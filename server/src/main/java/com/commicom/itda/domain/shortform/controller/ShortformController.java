package com.commicom.itda.domain.shortform.controller;

import com.commicom.itda.domain.shortform.dto.ShortformDetailResponse;
import com.commicom.itda.domain.shortform.dto.ShortformFeedResponse;
import com.commicom.itda.domain.shortform.dto.ShortformReplaceRequest;
import com.commicom.itda.domain.shortform.service.ShortformService;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Shortform", description = "게시물 조회")
@RestController
@RequestMapping("/api/shortforms")
@RequiredArgsConstructor
public class ShortformController {

    private final ShortformService shortformService;

    @Operation(summary = "게시물 피드 조회", description = "최신순 게시물 목록을 페이지네이션하여 반환한다. storeId를 주면 해당 가게의 게시물만 반환한다.")
    @GetMapping
    public ApiResponse<ShortformFeedResponse> getFeed(
            @Parameter(description = "가게 필터 (없으면 전체)")
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.onSuccess(shortformService.getFeed(storeId, page, size));
    }

    @Operation(summary = "게시물 단건 조회", description = "게시물 ID로 상세 정보(사진, 가게 정보)를 조회한다. 공개 전 게시물도 ID로는 볼 수 있다(만들기 결과 확인).")
    @GetMapping("/{shortformId}")
    public ApiResponse<ShortformDetailResponse> getShortform(@PathVariable Long shortformId) {
        return ApiResponse.onSuccess(shortformService.getShortform(shortformId));
    }

    @Operation(summary = "게시물 공개 (사장님)", description = "AI로 만든 게시물은 비공개로 생기고, 사장님이 [업로드]하면 손님 피드에 보인다. 내 가게만 (SHORTFORM403)")
    @PostMapping("/{shortformId}/publish")
    public ApiResponse<ShortformDetailResponse> publish(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long shortformId) {
        return ApiResponse.onSuccess(shortformService.publish(memberId, shortformId));
    }

    @Operation(summary = "게시물 삭제 (사장님)", description = "내 가게 게시물만. 손님 스크랩도 같이 지워진다")
    @DeleteMapping("/{shortformId}")
    public ApiResponse<Void> delete(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long shortformId) {
        shortformService.delete(memberId, shortformId);
        return ApiResponse.onSuccess(null);
    }

    @Operation(summary = "재수정본으로 교체 (사장님, PRO)",
            description = "올린 게시물을 새 버전(body.shortformId)으로 바꾼다. 새 버전을 공개하고 옛 게시물은 지운다. 스크랩은 새 버전으로 옮긴다")
    @PutMapping("/{shortformId}/replace")
    public ApiResponse<ShortformDetailResponse> replace(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long shortformId,
            @Valid @RequestBody ShortformReplaceRequest request) {
        return ApiResponse.onSuccess(shortformService.replace(memberId, shortformId, request.shortformId()));
    }
}
