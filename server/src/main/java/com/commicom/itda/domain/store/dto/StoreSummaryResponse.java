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
        boolean stepFree,
        boolean isQuestStore,
        int availableCouponCount
) {

    public static StoreSummaryResponse from(Store store) {
        return from(store, store.isQuestStore(), store.getAvailableCouponCount());
    }

    /**
     * isQuestStore: 퀘스트 가게 등록 기간 중인지 (QuestSubscription 기준)
     * availableCouponCount: 지금 받을 수 있는 쿠폰 수 (Coupon 기준)
     */
    public static StoreSummaryResponse from(Store store, boolean isQuestStore, int availableCouponCount) {
        return new StoreSummaryResponse(
                store.getId(),
                store.getName(),
                store.getCategory(),
                store.getCategory().getDescription(),
                store.getAddress(),
                store.getLatitude(),
                store.getLongitude(),
                store.getThumbnailUrl(),
                store.isStepFree(),
                isQuestStore,
                availableCouponCount);
    }
}
