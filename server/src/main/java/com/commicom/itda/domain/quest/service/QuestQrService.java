package com.commicom.itda.domain.quest.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.util.Locale;

/**
 * 가게 방문 QR 값: 가게·날짜(KST)별로 정해지는 8자리 (매일 자정에 바뀜).
 * 서버 비밀값으로 만든 HMAC 이라 가게 id·날짜만 알아서는 만들 수 없다
 */
@Component
public class QuestQrService {

    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
    private static final int LENGTH = 8;

    private final byte[] secret;

    public QuestQrService(@Value("${quest.qr-secret:${jwt.secret}}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String tokenOf(Long storeId, LocalDate date) {
        byte[] hash = hmac("itda-quest-qr:" + storeId + ":" + date);
        // 5바이트(40비트) → base32 8글자
        long bits = 0;
        for (int i = 0; i < 5; i++) {
            bits = (bits << 8) | (hash[i] & 0xff);
        }
        StringBuilder sb = new StringBuilder(LENGTH);
        for (int i = LENGTH - 1; i >= 0; i--) {
            sb.append(ALPHABET.charAt((int) ((bits >> (i * 5)) & 31)));
        }
        return sb.toString();
    }

    public boolean matches(Long storeId, LocalDate date, String token) {
        return token != null && tokenOf(storeId, date).equals(token.strip().toLowerCase(Locale.ROOT));
    }

    private byte[] hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("QR 값을 만들지 못했어요", e);
        }
    }
}
