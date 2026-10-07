package com.commicom.itda.domain.store.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 업종 대분류. 선언 순서 = 화면 표시 순서 */
@Getter
@RequiredArgsConstructor
public enum StoreCategory {

    RESTAURANT("음식점"),
    CAFE_BAKERY_PUB("카페·베이커리·주점"),
    FOOD_RETAIL("식품 판매"),
    BEAUTY("뷰티"),
    FASHION("패션·잡화"),
    LIVING("생활·리빙"),
    EDUCATION("교육"),
    PET("반려동물"),
    HOBBY_LEISURE("취미·레저"),
    GENERAL_RETAIL("종합 소매·유통"),
    ELECTRONICS("IT·통신·전기·전자"),
    CONSTRUCTION_INTERIOR("건축·인테리어·설비"),
    AUTO_TRANSPORT("자동차·운송"),
    MANUFACTURING("제조·산업기계"),
    ADVERTISING_MEDIA("광고·미디어"),
    ETC_SERVICE("기타 서비스");

    private final String description;
}
