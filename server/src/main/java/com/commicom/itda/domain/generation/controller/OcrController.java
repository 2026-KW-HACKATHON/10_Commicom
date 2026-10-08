package com.commicom.itda.domain.generation.controller;

import com.commicom.itda.global.response.ApiResponse;
import com.commicom.itda.infra.ai.OcrService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Tag(name = "OCR", description = "메뉴판 이미지 텍스트 추출")
@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;

    @Operation(
            summary = "메뉴판 OCR",
            description = "메뉴판 이미지를 업로드하면 텍스트를 추출해 반환한다. " +
                          "결과를 게시물 생성 요청의 menuInfo 필드에 넣어 사용한다."
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> extractMenuText(
            @RequestPart MultipartFile image) {
        String menuText = ocrService.extractMenuText(image);
        return ApiResponse.onSuccess(Map.of("menuText", menuText));
    }
}
