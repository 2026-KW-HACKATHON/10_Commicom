package com.commicom.itda.domain.scrap.dto;

import java.util.List;

public record ScrapShortformListResponse(
        int count,
        List<ScrapShortformResponse> shortforms
) {}
