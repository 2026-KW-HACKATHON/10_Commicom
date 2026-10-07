package com.commicom.itda.domain.store.dto;

import java.util.List;

public record StoreListResponse(
        int count,
        List<StoreSummaryResponse> stores
) {

    public static StoreListResponse from(List<StoreSummaryResponse> stores) {
        return new StoreListResponse(stores.size(), stores);
    }
}
