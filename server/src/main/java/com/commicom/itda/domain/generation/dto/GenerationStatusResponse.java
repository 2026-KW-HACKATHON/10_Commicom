package com.commicom.itda.domain.generation.dto;

import com.commicom.itda.domain.generation.entity.Generation;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

public record GenerationStatusResponse(
        Long generationId,
        Long storeId,
        String storeName,
        String status,
        @JsonInclude(JsonInclude.Include.ALWAYS) Long shortformId,
        @JsonInclude(JsonInclude.Include.ALWAYS) String errorMessage,
        @JsonInclude(JsonInclude.Include.ALWAYS) String videoUrl,
        LocalDateTime requestedAt
) {

    public static GenerationStatusResponse from(Generation generation) {
        return new GenerationStatusResponse(
                generation.getId(),
                generation.getStore().getId(),
                generation.getStore().getName(),
                generation.getStatus().name(),
                generation.getShortform() != null ? generation.getShortform().getId() : null,
                generation.getErrorMessage(),
                generation.getShortform() != null ? generation.getShortform().getVideoUrl() : null,
                generation.getCreatedAt()
        );
    }
}
