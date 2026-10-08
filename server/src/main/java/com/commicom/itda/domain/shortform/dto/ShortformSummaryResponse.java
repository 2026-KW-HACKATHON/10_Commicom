package com.commicom.itda.domain.shortform.dto;

import com.commicom.itda.domain.shortform.entity.Shortform;

import java.time.LocalDateTime;

public record ShortformSummaryResponse(
        Long shortformId,
        Long storeId,
        String storeName,
        String videoUrl,
        String thumbnailUrl,
        String title,
        int duration,
        LocalDateTime createdAt
) {

    public static ShortformSummaryResponse from(Shortform shortform) {
        return new ShortformSummaryResponse(
                shortform.getId(),
                shortform.getStore().getId(),
                shortform.getStore().getName(),
                shortform.getVideoUrl(),
                shortform.getThumbnailUrl(),
                shortform.getTitle(),
                shortform.getDuration(),
                shortform.getCreatedAt()
        );
    }
}
