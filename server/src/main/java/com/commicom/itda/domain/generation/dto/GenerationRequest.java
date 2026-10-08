package com.commicom.itda.domain.generation.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record GenerationRequest(
        @NotNull(message = "가게 ID를 입력해 주세요") Long storeId,
        /** 메뉴판 OCR 결과 등 추가 메뉴 정보 (선택) */
        String menuInfo,
        /** 사장님이 업로드한 가게 사진 URL 목록 (CloudFront/S3, 선택, 최대 3장) */
        List<String> photoUrls
) {}
