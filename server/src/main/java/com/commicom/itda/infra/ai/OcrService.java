package com.commicom.itda.infra.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.content.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrService {

    private final ChatClient chatClient;

    private static final String OCR_PROMPT =
            "이 메뉴판 이미지에서 모든 메뉴 항목과 가격을 정확히 추출해 주세요. " +
            "메뉴명과 가격을 줄 단위로 나열하고, 읽기 어려운 부분은 생략해도 됩니다. " +
            "메뉴 텍스트만 출력하세요.";

    public String extractMenuText(MultipartFile imageFile) {
        try {
            byte[] bytes = imageFile.getBytes();
            MimeType mimeType = MimeType.valueOf(
                    imageFile.getContentType() != null ? imageFile.getContentType() : "image/jpeg");

            Media media = new Media(mimeType, new ByteArrayResource(bytes));

            log.info("OCR 요청: {}bytes", bytes.length);
            return chatClient.prompt()
                    .user(u -> u.text(OCR_PROMPT).media(media))
                    .call()
                    .content();
        } catch (IOException e) {
            throw new RuntimeException("이미지 읽기 실패: " + e.getMessage(), e);
        }
    }
}
