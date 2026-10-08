package com.commicom.itda.domain.generation.dto;

import jakarta.validation.constraints.NotNull;

public record GenerationRequest(
        @NotNull(message = "가게 ID를 입력해 주세요") Long storeId,
        /** 메뉴판 OCR 결과 등 추가 메뉴 정보 (선택) */
        String menuInfo,
        /** 컷 1: 대표 메뉴 사진 URL */
        @NotNull(message = "대표 메뉴 사진 URL을 입력해 주세요") String menuImageUrl,
        /** 컷 2: 내부 사진 URL (null이면 menuImageUrl 사용) */
        String interiorImageUrl,
        /** 컷 3: 상차림 사진 URL (null이면 menuImageUrl 사용) */
        String tableImageUrl
) {}
