package com.commicom.itda.domain.shortform.dto;

import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.store.entity.Store;

import java.time.LocalDateTime;

public record ShortformDetailResponse(
        Long shortformId,
        Long storeId,
        String storeName,
        String storeCategory,
        String storeCategoryName,
        String imageUrl,
        String title,
        LocalDateTime createdAt
) {

    public static ShortformDetailResponse from(Shortform shortform) {
        Store store = shortform.getStore();
        return new ShortformDetailResponse(
                shortform.getId(),
                store.getId(),
                store.getName(),
                store.getCategory().name(),
                store.getCategory().getDescription(),
                shortform.getImageUrl(),
                shortform.getTitle(),
                shortform.getCreatedAt()
        );
    }
}
