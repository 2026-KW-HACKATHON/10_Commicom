package com.commicom.itda.infra.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 메일 발송 (SMTP). .env 의 MAIL_HOST·MAIL_USERNAME·MAIL_PASSWORD 가 있으면 실제로 보내고,
 * MAIL_HOST 가 비어 있으면(로컬 개발) 보내지 않고 로그로만 남긴다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> mailSender;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${email-verification.from:}")
    private String from;

    /** 메일 서버가 설정돼 있는지 (아니면 개발 모드: 로그만) */
    public boolean isConfigured() {
        return host != null && !host.isBlank();
    }

    public void send(String to, String subject, String text) {
        if (!isConfigured()) {
            log.info("[메일 미설정 — 실제 발송 안 함] to={} subject={}\n{}", to, subject, text);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.getObject().send(message);
    }
}
