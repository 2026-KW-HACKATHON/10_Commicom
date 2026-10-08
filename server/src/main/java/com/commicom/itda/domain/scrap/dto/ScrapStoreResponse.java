package com.commicom.itda.domain.scrap.dto;

import com.commicom.itda.domain.scrap.entity.Scrap;
import com.commicom.itda.domain.store.entity.Store;

import java.time.LocalDateTime;

public record ScrapStoreResponse(
        Long scrapId,
        Long storeId,
        String name,
        String category,
        String categoryName,
        String address,
        String thumbnailUrl,
        boolean stepFree,
        LocalDateTime scrappedAt
) {

    public static ScrapStoreResponse from(Scrap scrap) {
        Store store = scrap.getStore();
        return new ScrapStoreResponse(
                scrap.getId(),
                store.getId(),
                store.getName(),
                store.getCategory().name(),
                store.getCategory().getDescription(),
                store.getAddress(),
                store.getThumbnailUrl(),
                store.isStepFree(),
                scrap.getCreatedAt()
        );
    }
}
