package com.commicom.itda.domain.shortform.dto;

import com.commicom.itda.domain.shortform.entity.Shortform;

import java.time.LocalDateTime;
import java.util.List;

public record ShortformSummaryResponse(
        Long shortformId,
        Long storeId,
        String storeName,
        String imageUrl,
        /** 옆으로 넘겨 볼 사진 전체 (첫 장 = imageUrl, 최대 5장) */
        List<String> imageUrls,
        String title,
        LocalDateTime createdAt,
        /** PRO 가게 게시물 (피드 우선 노출·추천 배지) */
        boolean promoted
) {

    public static ShortformSummaryResponse from(Shortform shortform, boolean promoted) {
        return new ShortformSummaryResponse(
                shortform.getId(),
                shortform.getStore().getId(),
                shortform.getStore().getName(),
                shortform.getImageUrl(),
                shortform.getImageUrls(),
                shortform.getTitle(),
                shortform.getCreatedAt(),
                promoted
        );
    }
}
