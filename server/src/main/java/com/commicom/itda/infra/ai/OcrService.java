package com.commicom.itda.infra.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.content.Media;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Slf4j
@Lazy
@Service
@RequiredArgsConstructor
public class OcrService {

    private final ChatClient chatClient;

    private static final long MAX_BYTES = 4 * 1024 * 1024; // 4MB (Bedrock 5MB 제한 여유)
    private static final String OCR_PROMPT =
            "이 메뉴판 이미지에서 메뉴 항목과 가격을 추출해 주세요. " +
            "반드시 아래 형식으로만 출력하세요. 설명이나 다른 텍스트는 절대 포함하지 마세요.\n\n" +
            "[메뉴명, 가격]\n" +
            "[메뉴명, 가격]\n\n" +
            "가격을 알 수 없으면 '가격 미표기'로 적어주세요.";

    public String extractMenuText(MultipartFile imageFile) {
        try {
            byte[] bytes = compress(imageFile);
            MimeType mimeType = MimeType.valueOf("image/jpeg");
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

    private byte[] compress(MultipartFile file) throws IOException {
        byte[] original = file.getBytes();
        if (original.length <= MAX_BYTES) {
            return original;
        }
        log.info("이미지 압축 시작: {}bytes → 목표 {}bytes", original.length, MAX_BYTES);

        BufferedImage image = ImageIO.read(file.getInputStream());
        float quality = 0.7f;
        byte[] result = original;

        while (result.length > MAX_BYTES && quality > 0.1f) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);
            writer.setOutput(ImageIO.createImageOutputStream(out));
            writer.write(null, new IIOImage(toRgb(image), null, null), param);
            writer.dispose();
            result = out.toByteArray();
            quality -= 0.1f;
        }
        log.info("이미지 압축 완료: {}bytes", result.length);
        return result;
    }

    private BufferedImage toRgb(BufferedImage src) {
        if (src.getType() == BufferedImage.TYPE_INT_RGB) return src;
        BufferedImage rgb = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.drawImage(src, 0, 0, null);
        g.dispose();
        return rgb;
    }
}
