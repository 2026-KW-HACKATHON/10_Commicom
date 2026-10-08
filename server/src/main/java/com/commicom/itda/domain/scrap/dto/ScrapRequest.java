package com.commicom.itda.domain.scrap.dto;

import jakarta.validation.constraints.NotNull;

public record ScrapRequest(
        @NotNull(message = "가게 ID를 입력해 주세요") Long storeId
) {}
