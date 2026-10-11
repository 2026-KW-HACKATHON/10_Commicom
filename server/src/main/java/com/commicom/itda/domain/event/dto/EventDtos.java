package com.commicom.itda.domain.event.dto;

import java.time.OffsetDateTime;

public final class EventDtos {

    private EventDtos() {
    }

    /**
     * GET /api/events/early-owner — 초기 사장님 이벤트 현황.
     * status UPCOMING(시작 전) / OPEN(진행 중) / CLOSED(선착순 마감)
     */
    public record EarlyOwnerEvent(String status, OffsetDateTime startsAt, int limit, int joined, int remaining,
                                  int benefitDays) {
    }
}
