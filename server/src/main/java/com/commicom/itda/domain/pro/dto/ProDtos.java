package com.commicom.itda.domain.pro.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public final class ProDtos {

    private ProDtos() {
    }

    /** GET·POST·PATCH /api/stores/{storeId}/pro. status: ACTIVE / EXPIRED / NONE */
    public record ProResponse(Long storeId, String status, OffsetDateTime startedAt, OffsetDateTime expiresAt, boolean autoRenew) {
    }

    /** PATCH /api/stores/{storeId}/pro — false 면 해지 예약, true 면 해지 취소 */
    public record AutoRenewRequest(@NotNull(message = "autoRenew 를 입력해 주세요") Boolean autoRenew) {
    }
}
