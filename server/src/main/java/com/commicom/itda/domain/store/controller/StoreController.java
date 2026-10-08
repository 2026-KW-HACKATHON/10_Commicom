package com.commicom.itda.domain.store.controller;

import com.commicom.itda.domain.store.dto.StoreCategoryResponse;
import com.commicom.itda.domain.store.dto.StoreDetailResponse;
import com.commicom.itda.domain.store.dto.StoreListResponse;
import com.commicom.itda.domain.store.entity.StoreCategory;
import com.commicom.itda.domain.store.service.StoreService;
import com.commicom.itda.global.response.ApiResponse;
import com.commicom.itda.infra.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Store", description = "가게 조회")
@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final StorageService storageService;

    @Operation(summary = "가게 목록 조회", description = "지도에 표시할 가게 목록을 조회한다. category 를 주면 업종으로 필터링한다.")
    @GetMapping
    public ApiResponse<StoreListResponse> getStores(
            @Parameter(description = "업종 필터 (없으면 전체)")
            @RequestParam(required = false) StoreCategory category) {
        return ApiResponse.onSuccess(storeService.getStores(category));
    }

    @Operation(summary = "업종 목록 조회", description = "가게 목록 필터에 쓸 업종 대분류를 화면 표시 순서대로 조회한다.")
    @GetMapping("/categories")
    public ApiResponse<List<StoreCategoryResponse>> getCategories() {
        return ApiResponse.onSuccess(StoreCategoryResponse.all());
    }

    @Operation(summary = "가게 상세 조회")
    @GetMapping("/{storeId}")
    public ApiResponse<StoreDetailResponse> getStore(@PathVariable Long storeId) {
        return ApiResponse.onSuccess(storeService.getStore(storeId));
    }

    @Operation(summary = "가게 사진 업로드",
            description = "사장님이 숏폼 생성에 쓸 가게 사진을 업로드한다. 반환된 URL을 생성 요청의 photoUrls에 사용한다.")
    @PostMapping(value = "/{storeId}/photos", consumes = "multipart/form-data")
    public ApiResponse<List<String>> uploadPhotos(
            @PathVariable Long storeId,
            @RequestPart("photos") List<MultipartFile> photos) {
        List<String> urls = photos.stream()
                .map(photo -> storageService.upload(photo, "stores/" + storeId))
                .toList();
        return ApiResponse.onSuccess(urls);
    }
}
