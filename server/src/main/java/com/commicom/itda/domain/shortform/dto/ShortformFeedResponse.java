package com.commicom.itda.domain.shortform.dto;

import java.util.List;

public record ShortformFeedResponse(
        int totalCount,
        int page,
        int size,
        boolean hasNext,
        List<ShortformSummaryResponse> shortforms
) {}
