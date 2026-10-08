package com.commicom.itda.domain.store.dto;

import com.commicom.itda.domain.store.entity.StoreCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 사장님 가게 등록. 좌표는 클라이언트가 주소로 찾아서(지오코딩) 보낸다 */
public record StoreCreateRequest(
        @NotBlank(message = "가게 이름을 입력해 주세요")
        @Size(max = 100, message = "가게 이름은 100자 이하로 입력해 주세요")
        String name,

        @NotNull(message = "업종을 선택해 주세요")
        StoreCategory category,

        @NotBlank(message = "주소를 입력해 주세요")
        @Size(max = 255, message = "주소가 너무 길어요")
        String address,

        @NotNull(message = "주소 위치를 찾지 못했어요")
        Double latitude,

        @NotNull(message = "주소 위치를 찾지 못했어요")
        Double longitude
) {
}
