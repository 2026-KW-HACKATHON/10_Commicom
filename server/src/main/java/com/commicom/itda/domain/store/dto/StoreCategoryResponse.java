package com.commicom.itda.domain.store.dto;

import com.commicom.itda.domain.store.entity.StoreCategory;

import java.util.Arrays;
import java.util.List;

public record StoreCategoryResponse(
        StoreCategory code,
        String name
) {

    public static List<StoreCategoryResponse> all() {
        return Arrays.stream(StoreCategory.values())
                .map(category -> new StoreCategoryResponse(category, category.getDescription()))
                .toList();
    }
}
