package com.commicom.itda.domain.generation.dto;

import jakarta.validation.constraints.NotNull;

public record GenerationRequest(
        @NotNull(message = "가게 ID를 입력해 주세요") Long storeId,
        /** 메뉴판 OCR 결과 등 추가 메뉴 정보 (선택) */
        String menuInfo
) {}
