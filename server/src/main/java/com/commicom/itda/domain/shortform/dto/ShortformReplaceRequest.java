package com.commicom.itda.domain.shortform.dto;

import jakarta.validation.constraints.NotNull;

/** PUT /api/shortforms/{oldId}/replace — 바꿔 넣을 새 버전 */
public record ShortformReplaceRequest(
        @NotNull(message = "바꿀 게시물 ID를 입력해 주세요") Long shortformId
) {}
