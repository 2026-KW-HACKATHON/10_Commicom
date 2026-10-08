package com.commicom.itda.domain.quest.controller;

import com.commicom.itda.domain.quest.dto.QuestDtos.QrResponse;
import com.commicom.itda.domain.quest.service.QuestQrService;
import com.commicom.itda.global.response.ApiResponse;
import com.commicom.itda.global.util.KstTime;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** local 프로필 전용: 가게에 가지 않고도 방문 인증을 해 보도록 오늘의 QR 값을 알려 줌 (운영 서버엔 없음) */
@Tag(name = "Dev", description = "로컬 테스트 전용")
@Profile("local")
@RestController
@RequestMapping("/api/dev/quest-qr")
@RequiredArgsConstructor
public class DevQuestController {

    private final QuestQrService qrService;

    @Operation(summary = "[로컬] 가게의 오늘 QR 값")
    @GetMapping("/{storeId}")
    public ApiResponse<QrResponse> getQr(@PathVariable Long storeId) {
        return ApiResponse.onSuccess(new QrResponse(
                qrService.tokenOf(storeId, KstTime.today()), KstTime.offset(KstTime.endOfDay(KstTime.today()))));
    }
}
