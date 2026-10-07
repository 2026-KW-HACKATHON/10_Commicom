package com.commicom.itda.global.response;

import com.commicom.itda.global.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

/**
 * 모든 API 의 공통 응답 형식.
 * <pre>
 * { "isSuccess": true, "code": "COMMON200", "message": "...", "result": { ... } }
 * </pre>
 * result 가 없으면 필드 자체를 생략한다.
 */
@JsonPropertyOrder({"isSuccess", "code", "message", "result"})
public record ApiResponse<T>(
        @JsonProperty("isSuccess") boolean isSuccess,
        String code,
        String message,
        @JsonInclude(JsonInclude.Include.NON_NULL) T result
) {

    public static <T> ApiResponse<T> onSuccess(T result) {
        return of(SuccessStatus.OK, result);
    }

    public static <T> ApiResponse<T> of(SuccessStatus status, T result) {
        return new ApiResponse<>(true, status.getCode(), status.getMessage(), result);
    }

    public static <T> ApiResponse<T> onFailure(ErrorCode errorCode) {
        return onFailure(errorCode, errorCode.getMessage(), null);
    }

    public static <T> ApiResponse<T> onFailure(ErrorCode errorCode, String message, T result) {
        return new ApiResponse<>(false, errorCode.getCode(), message, result);
    }
}
