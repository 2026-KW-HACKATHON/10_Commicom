package com.commicom.itda.domain.quest.controller;

import com.commicom.itda.domain.quest.dto.QuestDtos.OwnerTemplateList;
import com.commicom.itda.domain.quest.dto.QuestDtos.QrResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.SubscriptionResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.TemplateJoinResponse;
import com.commicom.itda.domain.quest.service.QuestStoreService;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Quest Store", description = "사장님 퀘스트 가게 (등록·템플릿 참여·방문 QR)")
@RestController
@RequestMapping("/api/stores/{storeId}")
@RequiredArgsConstructor
public class QuestStoreController {

    private final QuestStoreService questStoreService;

    @Operation(summary = "퀘스트 가게 등록 상태", description = "status: ACTIVE / EXPIRED / NONE")
    @GetMapping("/quest-subscription")
    public ApiResponse<SubscriptionResponse> getSubscription(@PathVariable Long storeId) {
        return ApiResponse.onSuccess(questStoreService.getSubscription(storeId));
    }

    @Operation(summary = "퀘스트 가게 등록 (사장님)", description = "30일. 해커톤: 결제는 모의 처리 (body 의 plan 은 무시)")
    @PostMapping("/quest-subscription")
    public ApiResponse<SubscriptionResponse> subscribe(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId) {
        return ApiResponse.onSuccess(questStoreService.subscribe(memberId, storeId));
    }

    @Operation(summary = "퀘스트 템플릿 목록 (사장님)", description = "템플릿마다 참여 가게 수와 우리 가게 참여 여부")
    @GetMapping("/quest-templates")
    public ApiResponse<OwnerTemplateList> getTemplates(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId) {
        return ApiResponse.onSuccess(questStoreService.getTemplates(memberId, storeId));
    }

    @Operation(summary = "템플릿 퀘스트 참여 (사장님)", description = "퀘스트 가게로 등록돼 있어야 한다")
    @PostMapping("/quest-templates/{templateKey}")
    public ApiResponse<TemplateJoinResponse> join(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId,
            @PathVariable String templateKey) {
        return ApiResponse.onSuccess(questStoreService.join(memberId, storeId, templateKey));
    }

    @Operation(summary = "템플릿 퀘스트 참여 취소 (사장님)")
    @DeleteMapping("/quest-templates/{templateKey}")
    public ApiResponse<TemplateJoinResponse> leave(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId,
            @PathVariable String templateKey) {
        return ApiResponse.onSuccess(questStoreService.leave(memberId, storeId, templateKey));
    }

    @Operation(summary = "오늘의 방문 인증 QR (사장님)", description = "가게·날짜별 값, KST 자정에 바뀐다")
    @GetMapping("/quest-qr")
    public ApiResponse<QrResponse> getQr(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long storeId) {
        return ApiResponse.onSuccess(questStoreService.getQr(memberId, storeId));
    }
}
