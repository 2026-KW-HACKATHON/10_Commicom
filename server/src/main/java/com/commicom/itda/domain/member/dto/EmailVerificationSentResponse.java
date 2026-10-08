package com.commicom.itda.domain.member.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 인증번호 발송 결과.
 * devCode: 메일 서버(MAIL_HOST)가 설정되지 않은 로컬 개발 환경에서만 채워짐 — 실제 메일 없이 테스트하기 위함
 */
public record EmailVerificationSentResponse(
        long expiresInSeconds,
        long resendAfterSeconds,
        @JsonInclude(JsonInclude.Include.NON_NULL) String devCode
) {}
