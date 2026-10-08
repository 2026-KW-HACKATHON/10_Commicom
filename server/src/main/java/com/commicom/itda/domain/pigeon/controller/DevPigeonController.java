package com.commicom.itda.domain.pigeon.controller;

import com.commicom.itda.domain.pigeon.dto.PigeonDtos.FeedRequest;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.PigeonResponse;
import com.commicom.itda.domain.pigeon.service.PigeonService;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** local 프로필 전용: 레벨업을 끝까지 해 보기 위한 테스트 먹이 (운영 서버엔 없음) */
@Tag(name = "Dev", description = "로컬 테스트 전용")
@Profile("local")
@RestController
@RequestMapping("/api/dev/pigeon")
@RequiredArgsConstructor
public class DevPigeonController {

    private final PigeonService pigeonService;

    @Operation(summary = "[로컬] 테스트 먹이 받기", description = "보유 먹이에 amount 개를 더한다")
    @PostMapping("/feed")
    public ApiResponse<PigeonResponse> addFeed(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody FeedRequest request) {
        pigeonService.grantQuestFeed(memberId, request.amount());
        return ApiResponse.onSuccess(pigeonService.getPigeon(memberId));
    }
}
