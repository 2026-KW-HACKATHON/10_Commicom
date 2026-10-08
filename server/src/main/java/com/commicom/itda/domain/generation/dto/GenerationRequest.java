package com.commicom.itda.domain.generation.dto;

import jakarta.validation.constraints.NotNull;

public record GenerationRequest(
        @NotNull(message = "가게 ID를 입력해 주세요") Long storeId
) {}
