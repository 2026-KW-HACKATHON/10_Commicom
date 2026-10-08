package com.commicom.itda.domain.generation.controller;

import com.commicom.itda.domain.generation.dto.GenerationRequest;
import com.commicom.itda.domain.generation.dto.GenerationResponse;
import com.commicom.itda.domain.generation.dto.GenerationStatusResponse;
import com.commicom.itda.domain.generation.service.GenerationService;
import com.commicom.itda.global.response.ApiResponse;
import com.commicom.itda.global.response.SuccessStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Generation", description = "AI 게시물 생성")
@RestController
@RequestMapping("/api/generation")
@RequiredArgsConstructor
public class GenerationController {

    private final GenerationService generationService;

    @Operation(summary = "AI 게시물 생성 요청",
            description = "가게 ID를 받아 AI 게시물 생성을 요청한다. 비동기 처리이므로 즉시 완료되지 않는다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GenerationResponse> requestGeneration(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody GenerationRequest request) {
        return ApiResponse.of(SuccessStatus.CREATED,
                generationService.requestGeneration(memberId, request));
    }

    @Operation(summary = "AI 게시물 생성 상태 조회",
            description = "생성 요청 ID로 현재 진행 상태를 조회한다. COMPLETED이면 shortformId가 채워진다.")
    @GetMapping("/{generationId}")
    public ApiResponse<GenerationStatusResponse> getStatus(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long generationId) {
        return ApiResponse.onSuccess(generationService.getStatus(memberId, generationId));
    }
}
