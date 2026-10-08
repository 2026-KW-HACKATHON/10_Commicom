package com.commicom.itda.global.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    /** 실패 응답 result 에 같이 담을 값 (예: 방문 인증 거리 { "distanceM": 230 }). 없으면 null */
    private final Object result;

    public BusinessException(ErrorCode errorCode) {
        this(errorCode, null);
    }

    public BusinessException(ErrorCode errorCode, Object result) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.result = result;
    }
}
