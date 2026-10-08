package com.commicom.itda.domain.scrap.dto;

import java.util.List;

public record ScrapListResponse(
        int count,
        List<ScrapStoreResponse> scraps
) {}
