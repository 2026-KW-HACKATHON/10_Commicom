package com.commicom.itda.domain.member.dto;

/** 이메일·닉네임 중복 확인 결과 (true = 사용 가능) */
public record AvailabilityResponse(boolean available) {}
