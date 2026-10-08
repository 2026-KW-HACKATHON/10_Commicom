package com.commicom.itda.domain.scrap.dto;

import com.commicom.itda.domain.scrap.entity.ShortformScrap;
import com.commicom.itda.domain.shortform.entity.Shortform;

import java.time.LocalDateTime;

public record ScrapShortformResponse(
        Long scrapId,
        Long shortformId,
        Long storeId,
        String storeName,
        String imageUrl,
        String title,
        LocalDateTime createdAt,
        LocalDateTime scrappedAt
) {

    public static ScrapShortformResponse from(ShortformScrap scrap) {
        Shortform shortform = scrap.getShortform();
        return new ScrapShortformResponse(
                scrap.getId(),
                shortform.getId(),
                shortform.getStore().getId(),
                shortform.getStore().getName(),
                shortform.getImageUrl(),
                shortform.getTitle(),
                shortform.getCreatedAt(),
                scrap.getCreatedAt()
        );
    }
}
