package com.commicom.itda.domain.store.dto;

import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.entity.StoreCategory;

public record StoreDetailResponse(
        Long storeId,
        String name,
        StoreCategory category,
        String categoryName,
        String address,
        Double latitude,
        Double longitude,
        String phone,
        String businessHours,
        String description,
        String thumbnailUrl,
        Accessibility accessibility
) {

    public record Accessibility(boolean stepFree, boolean elevator) {
    }

    public static StoreDetailResponse from(Store store) {
        return new StoreDetailResponse(
                store.getId(),
                store.getName(),
                store.getCategory(),
                store.getCategory().getDescription(),
                store.getAddress(),
                store.getLatitude(),
                store.getLongitude(),
                store.getPhone(),
                store.getBusinessHours(),
                store.getDescription(),
                store.getThumbnailUrl(),
                new Accessibility(store.isStepFree(), store.isElevator()));
    }
}
