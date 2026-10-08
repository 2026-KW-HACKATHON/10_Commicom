package com.commicom.itda.domain.store.dto;

import com.commicom.itda.domain.store.entity.StoreCategory;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 사장님 가게 정보 수정. 보낸 항목만 바뀐다 (주소를 바꾸면 좌표도 함께 보낸다) */
public record StoreUpdateRequest(
        @Pattern(regexp = ".*\\S.*", message = "가게 이름을 입력해 주세요")
        @Size(max = 100, message = "가게 이름은 100자 이하로 입력해 주세요")
        String name,

        StoreCategory category,

        @Pattern(regexp = ".*\\S.*", message = "주소를 입력해 주세요")
        @Size(max = 255, message = "주소가 너무 길어요")
        String address,

        Double latitude,

        Double longitude
) {
}
