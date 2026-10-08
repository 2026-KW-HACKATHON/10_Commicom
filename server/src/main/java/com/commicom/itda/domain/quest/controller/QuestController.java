package com.commicom.itda.domain.quest.controller;

import com.commicom.itda.domain.quest.dto.QuestDtos.QuestEventRequest;
import com.commicom.itda.domain.quest.dto.QuestDtos.QuestEventResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.QuestListResponse;
import com.commicom.itda.domain.quest.dto.QuestDtos.VisitRequest;
import com.commicom.itda.domain.quest.dto.QuestDtos.VisitResponse;
import com.commicom.itda.domain.quest.service.QuestService;
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
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Quest", description = "손님 퀘스트 (목록·방문 인증·기본 퀘스트 진행)")
@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;

    @Operation(summary = "퀘스트 목록", description = "로그인 전이면 진행도 0. 템플릿 퀘스트는 참여 가게가 있을 때만 보인다")
    @GetMapping
    public ApiResponse<QuestListResponse> getQuests(@Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(questService.getQuests(memberId));
    }

    @Operation(summary = "방문 인증", description = "퀘스트 가게 + 반경 100m + 오늘의 가게 QR. 방문마다 먹이 1개, 완료하면 보너스 먹이")
    @PostMapping("/{questId}/visits")
    public ApiResponse<VisitResponse> visit(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long questId,
            @Valid @RequestBody VisitRequest request) {
        return ApiResponse.onSuccess(questService.visit(memberId, questId, request));
    }

    @Operation(summary = "기본 퀘스트 진행 기록",
            description = "게시물을 보거나(SHORTFORM_VIEW, targetId=shortformId) 가게 상세를 열면(STORE_VIEW, targetId=storeId) 호출. 같은 대상은 한 번만 센다")
    @PostMapping("/events")
    public ApiResponse<QuestEventResponse> recordEvent(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody QuestEventRequest request) {
        return ApiResponse.onSuccess(questService.recordEvent(memberId, request));
    }
}
