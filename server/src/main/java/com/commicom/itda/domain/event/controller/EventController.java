package com.commicom.itda.domain.event.controller;

import com.commicom.itda.domain.event.dto.EventDtos.EarlyOwnerEvent;
import com.commicom.itda.domain.event.service.EarlyOwnerEventService;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Event", description = "이벤트")
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EarlyOwnerEventService earlyOwnerEventService;

    @Operation(summary = "초기 사장님 이벤트 현황 (로그인 불필요)",
            description = "시작일부터 비둘기 보상 쿠폰을 처음 발행한 가게 선착순 10곳에 PRO·퀘스트 가게 등록 30일 무료. status UPCOMING / OPEN / CLOSED")
    @GetMapping("/early-owner")
    public ApiResponse<EarlyOwnerEvent> earlyOwner() {
        return ApiResponse.onSuccess(earlyOwnerEventService.status());
    }
}
