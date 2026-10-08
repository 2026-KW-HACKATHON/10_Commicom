package com.commicom.itda.domain.generation.dto;

import jakarta.validation.constraints.NotNull;

public record GenerationRequest(
        @NotNull(message = "가게 ID를 입력해 주세요") Long storeId,
        /** 메뉴판 OCR 결과 등 메뉴 정보 (선택) */
        String menuInfo,
        /** AI 이미지 생성 시 참조할 가게 사진 URL (선택) */
        String menuImageUrl
) {}
