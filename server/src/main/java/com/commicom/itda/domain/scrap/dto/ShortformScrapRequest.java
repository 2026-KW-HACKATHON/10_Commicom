package com.commicom.itda.domain.scrap.dto;

import jakarta.validation.constraints.NotNull;

public record ShortformScrapRequest(
        @NotNull(message = "shortformId를 입력해 주세요")
        Long shortformId
) {}
