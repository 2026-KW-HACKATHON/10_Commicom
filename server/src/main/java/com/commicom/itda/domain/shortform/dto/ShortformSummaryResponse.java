package com.commicom.itda.domain.shortform.dto;

import com.commicom.itda.domain.shortform.entity.Shortform;

import java.time.LocalDateTime;

public record ShortformSummaryResponse(
        Long shortformId,
        Long storeId,
        String storeName,
        String imageUrl,
        String title,
        LocalDateTime createdAt
) {

    public static ShortformSummaryResponse from(Shortform shortform) {
        return new ShortformSummaryResponse(
                shortform.getId(),
                shortform.getStore().getId(),
                shortform.getStore().getName(),
                shortform.getImageUrl(),
                shortform.getTitle(),
                shortform.getCreatedAt()
        );
    }
}
