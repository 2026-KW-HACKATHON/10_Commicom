package com.commicom.itda.domain.store.dto;

import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.entity.StoreCategory;

/** 지도 마커·목록용 요약 정보 */
public record StoreSummaryResponse(
        Long storeId,
        String name,
        StoreCategory category,
        String categoryName,
        String address,
        Double latitude,
        Double longitude,
        String thumbnailUrl,
        boolean stepFree
) {

    public static StoreSummaryResponse from(Store store) {
        return new StoreSummaryResponse(
                store.getId(),
                store.getName(),
                store.getCategory(),
                store.getCategory().getDescription(),
                store.getAddress(),
                store.getLatitude(),
                store.getLongitude(),
                store.getThumbnailUrl(),
                store.isStepFree());
    }
}
