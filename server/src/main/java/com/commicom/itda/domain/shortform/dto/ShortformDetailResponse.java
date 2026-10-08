package com.commicom.itda.domain.shortform.dto;

import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.store.entity.Store;

import java.time.LocalDateTime;
import java.util.List;

public record ShortformDetailResponse(
        Long shortformId,
        Long storeId,
        String storeName,
        String storeCategory,
        String storeCategoryName,
        String imageUrl,
        /** 옆으로 넘겨 볼 사진 전체 (첫 장 = imageUrl, 최대 5장) */
        List<String> imageUrls,
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
                shortform.getImageUrls(),
                shortform.getTitle(),
                shortform.getCreatedAt()
        );
    }
}
