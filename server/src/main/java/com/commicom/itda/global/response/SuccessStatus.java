package com.commicom.itda.global.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum SuccessStatus {

    OK(HttpStatus.OK, "COMMON200", "성공적으로 요청을 처리했습니다."),
    CREATED(HttpStatus.CREATED, "COMMON201", "성공적으로 생성했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
