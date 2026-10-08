package com.commicom.itda.domain.generation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record GenerationRequest(
        @NotNull(message = "가게 ID를 입력해 주세요") Long storeId,
        /** 메뉴판 OCR 결과 등 메뉴 정보 (선택) */
        String menuInfo,
        /** AI 이미지 생성 시 참조할 가게 사진 URL (선택) */
        String menuImageUrl,
        /** 게시물에 같이 넣을 사장님 사진 URL (POST /api/stores/{storeId}/photos 로 올린 것, 최대 4장, 선택) */
        @Size(max = 4, message = "사진은 4장까지 넣을 수 있어요") List<String> photoUrls
) {}
