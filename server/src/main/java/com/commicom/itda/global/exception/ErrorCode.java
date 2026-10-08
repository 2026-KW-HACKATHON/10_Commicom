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
    MEMBER_NICKNAME_DUPLICATED(HttpStatus.CONFLICT, "MEMBER409_2", "이미 사용 중인 닉네임이에요"),
    MEMBER_EMAIL_NOT_VERIFIED(HttpStatus.BAD_REQUEST, "MEMBER400_2", "이메일 인증을 먼저 완료해 주세요"),
    MEMBER_PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "MEMBER400_3", "현재 비밀번호가 맞지 않아요"),
    MEMBER_PASSWORD_UNCHANGED(HttpStatus.BAD_REQUEST, "MEMBER400_4", "지금과 다른 비밀번호를 입력해 주세요"),

    // 이메일 인증
    EMAIL_CODE_MISMATCH(HttpStatus.BAD_REQUEST, "EMAIL400", "인증번호가 맞지 않아요"),
    EMAIL_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "EMAIL400_2", "인증번호가 만료됐어요. 다시 받아 주세요"),
    EMAIL_CODE_TOO_MANY_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "EMAIL429", "인증 시도가 너무 많아요. 인증번호를 다시 받아 주세요"),
    EMAIL_RESEND_TOO_SOON(HttpStatus.TOO_MANY_REQUESTS, "EMAIL429_2", "인증번호는 1분 뒤에 다시 받을 수 있어요"),
    EMAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "EMAIL500", "인증 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요"),

    // 가게
    STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "STORE404", "가게를 찾을 수 없어요"),
    STORE_MY_NOT_FOUND(HttpStatus.NOT_FOUND, "STORE404_2", "아직 등록한 가게가 없어요"),
    STORE_OWNER_ONLY(HttpStatus.FORBIDDEN, "STORE403", "사장님만 가게를 등록할 수 있어요"),
    STORE_FORBIDDEN(HttpStatus.FORBIDDEN, "STORE403_2", "내 가게가 아니에요"),
    STORE_ALREADY_REGISTERED(HttpStatus.CONFLICT, "STORE409", "이미 등록한 가게가 있어요"),

    // 퀘스트
    QUEST_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "QUEST400", "가게 반경 100m 밖이에요"),
    QUEST_QR_MISMATCH(HttpStatus.BAD_REQUEST, "QUEST400_2", "QR 코드가 맞지 않거나 만료됐어요"),
    QUEST_TEMPLATE_NOT_FOUND(HttpStatus.BAD_REQUEST, "QUEST400_3", "없는 퀘스트 템플릿이에요"),
    QUEST_STORE_NOT_ACTIVE(HttpStatus.FORBIDDEN, "QUEST403", "퀘스트 가게가 아니에요"),
    QUEST_STORE_NOT_PARTICIPATING(HttpStatus.FORBIDDEN, "QUEST403_2", "이 퀘스트에 참여한 가게가 아니에요"),
    QUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "QUEST404", "퀘스트를 찾을 수 없어요"),
    QUEST_VISITED_TODAY(HttpStatus.CONFLICT, "QUEST409", "오늘 이미 이 가게에서 인증했어요"),
    QUEST_ALREADY_COMPLETED(HttpStatus.CONFLICT, "QUEST409_2", "이미 완료한 퀘스트예요"),
    QUEST_STORE_ALREADY_COUNTED(HttpStatus.CONFLICT, "QUEST409_3", "이 퀘스트에서 이미 인정된 가게예요"),
    QUEST_SUBSCRIPTION_ACTIVE(HttpStatus.CONFLICT, "QUEST409_4", "이미 퀘스트 가게로 등록되어 있어요"),
    QUEST_ALREADY_JOINED(HttpStatus.CONFLICT, "QUEST409_5", "이미 참여 중인 퀘스트예요"),
    QUEST_NOT_JOINED(HttpStatus.CONFLICT, "QUEST409_6", "참여하지 않은 퀘스트예요"),

    // 비둘기
    PIGEON_DAILY_CLAIMED(HttpStatus.CONFLICT, "PIGEON409", "오늘은 이미 무료 먹이를 받았어요"),
    PIGEON_AD_DUPLICATED(HttpStatus.CONFLICT, "PIGEON409_2", "이미 처리한 광고 시청이에요"),
    PIGEON_MAX_LEVEL(HttpStatus.CONFLICT, "PIGEON409_3", "최고 레벨이에요. 졸업시키면 새 알을 키울 수 있어요"),
    PIGEON_FEED_SHORTAGE(HttpStatus.CONFLICT, "PIGEON409_4", "먹이가 부족해요"),
    PIGEON_NOT_MAX_LEVEL(HttpStatus.CONFLICT, "PIGEON409_5", "Lv.10이 되어야 졸업할 수 있어요"),
    PIGEON_AD_LIMIT(HttpStatus.TOO_MANY_REQUESTS, "PIGEON429", "오늘 광고 보상을 모두 받았어요"),

    // 쿠폰
    COUPON_AMOUNT_TOO_SMALL(HttpStatus.BAD_REQUEST, "COUPON400", "할인 금액은 100원 이상이어야 해요"),
    COUPON_RATE_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "COUPON400_2", "할인율은 10~80% 사이여야 해요"),
    COUPON_OTHER_STORE(HttpStatus.FORBIDDEN, "COUPON403", "다른 가게 쿠폰이에요"),
    COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "COUPON404", "쿠폰을 찾을 수 없어요"),
    COUPON_CODE_NOT_FOUND(HttpStatus.NOT_FOUND, "COUPON404_2", "코드에 해당하는 쿠폰이 없어요"),
    COUPON_ALREADY_DOWNLOADED(HttpStatus.CONFLICT, "COUPON409", "이미 받은 쿠폰이에요"),
    COUPON_ALREADY_USED(HttpStatus.CONFLICT, "COUPON409_2", "이미 사용된 쿠폰이에요"),
    COUPON_NOT_ACTIVE(HttpStatus.CONFLICT, "COUPON409_3", "이미 중지되었거나 소진된 쿠폰이에요"),
    COUPON_SOLD_OUT(HttpStatus.GONE, "COUPON410", "쿠폰이 모두 소진되었어요"),
    COUPON_EXPIRED(HttpStatus.GONE, "COUPON410_2", "기한이 지난 쿠폰이에요"),

    // PRO 구독
    PRO_ALREADY_ACTIVE(HttpStatus.CONFLICT, "PRO409", "이미 PRO를 이용 중이에요"),
    PRO_NOT_ACTIVE(HttpStatus.CONFLICT, "PRO409_2", "이용 중인 PRO 구독이 없어요"),

    // 숏폼
    SHORTFORM_NOT_FOUND(HttpStatus.NOT_FOUND, "SHORTFORM404", "게시물을 찾을 수 없어요"),

    // 생성
    GENERATION_NOT_FOUND(HttpStatus.NOT_FOUND, "GENERATION404", "생성 요청을 찾을 수 없어요"),
    GENERATION_FORBIDDEN(HttpStatus.FORBIDDEN, "GENERATION403", "해당 생성 요청에 접근할 수 없어요"),
    GENERATION_CONFLICT(HttpStatus.CONFLICT, "GENERATION409", "이미 생성 중인 요청이 있어요"),

    // 스크랩
    SCRAP_ALREADY_EXISTS(HttpStatus.CONFLICT, "SCRAP409", "이미 스크랩한 가게예요"),
    SCRAP_NOT_FOUND(HttpStatus.NOT_FOUND, "SCRAP404", "스크랩하지 않은 가게예요"),
    SCRAP_SHORTFORM_ALREADY_EXISTS(HttpStatus.CONFLICT, "SCRAP409_2", "이미 스크랩한 게시물이에요"),
    SCRAP_SHORTFORM_NOT_FOUND(HttpStatus.NOT_FOUND, "SCRAP404_2", "스크랩하지 않은 게시물이에요");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
