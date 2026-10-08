package com.commicom.itda.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 실패 응답 코드. 형식: {도메인}{HTTP 상태코드}[_{번호}] (예: COMMON400, STORE404)
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON400", "입력값이 올바르지 않아요"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "COMMON401", "로그인이 필요해요"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "COMMON403", "접근 권한이 없어요"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "COMMON404", "요청한 경로를 찾을 수 없어요"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "COMMON405", "지원하지 않는 HTTP 메서드예요"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "서버 오류가 발생했어요"),

    // 회원
    MEMBER_ROLE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "MEMBER400", "가입할 수 없는 회원 유형이에요"),
    MEMBER_LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "MEMBER401", "이메일 또는 비밀번호가 올바르지 않아요"),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER404", "회원을 찾을 수 없어요"),
    MEMBER_EMAIL_DUPLICATED(HttpStatus.CONFLICT, "MEMBER409", "이미 가입된 이메일이에요"),

    // 가게
    STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "STORE404", "가게를 찾을 수 없어요"),

    // 숏폼
    SHORTFORM_NOT_FOUND(HttpStatus.NOT_FOUND, "SHORTFORM404", "숏폼을 찾을 수 없어요"),

    // 생성
    GENERATION_NOT_FOUND(HttpStatus.NOT_FOUND, "GENERATION404", "생성 요청을 찾을 수 없어요"),
    GENERATION_FORBIDDEN(HttpStatus.FORBIDDEN, "GENERATION403", "해당 생성 요청에 접근할 수 없어요"),
    GENERATION_CONFLICT(HttpStatus.CONFLICT, "GENERATION409", "이미 생성 중인 요청이 있어요"),

    // 스크랩
    SCRAP_ALREADY_EXISTS(HttpStatus.CONFLICT, "SCRAP409", "이미 스크랩한 가게예요"),
    SCRAP_NOT_FOUND(HttpStatus.NOT_FOUND, "SCRAP404", "스크랩하지 않은 가게예요");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
