package com.commicom.itda.domain.generation.dto;

import com.commicom.itda.domain.generation.entity.Generation;

import java.time.LocalDateTime;

public record GenerationResponse(
        Long generationId,
        Long storeId,
        String storeName,
        String status,
        LocalDateTime requestedAt
) {

    public static GenerationResponse from(Generation generation) {
        return new GenerationResponse(
                generation.getId(),
                generation.getStore().getId(),
                generation.getStore().getName(),
                generation.getStatus().name(),
                generation.getCreatedAt()
        );
    }
}
