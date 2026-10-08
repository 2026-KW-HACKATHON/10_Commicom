package com.commicom.itda.domain.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** 인증번호 받기 */
public record EmailVerificationRequest(
        @NotBlank(message = "이메일을 입력해 주세요")
        @Email(message = "이메일 형식이 올바르지 않아요")
        String email
) {}
