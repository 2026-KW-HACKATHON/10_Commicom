package com.commicom.itda.domain.member.service;

import com.commicom.itda.domain.member.dto.EmailVerificationSentResponse;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.infra.mail.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 회원가입 이메일 인증: 6자리 인증번호 발송 → 확인 → 가입 때 인증 여부 확인.
 * 서버 1대 기준으로 메모리에 보관 (서버를 다시 켜면 진행 중인 인증은 사라짐).
 * 서버를 여러 대로 늘리면 Redis·DB 로 옮겨야 함.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    /** 인증번호 유효 시간 */
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    /** 다시 받기까지 기다리는 시간 */
    private static final Duration RESEND_AFTER = Duration.ofSeconds(60);
    /** 인증 완료 후 가입까지 허용 시간 */
    private static final Duration VERIFIED_TTL = Duration.ofMinutes(30);
    /** 한 인증번호로 틀릴 수 있는 횟수 */
    private static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final MemberRepository memberRepository;
    private final MailService mailService;

    /** 메일 서버가 없을 때 응답에 인증번호를 담을지 (로컬 개발용, 운영에선 false) */
    @Value("${email-verification.expose-code:false}")
    private boolean exposeCode;

    private final Map<String, Pending> pending = new ConcurrentHashMap<>();
    private final Map<String, Instant> verified = new ConcurrentHashMap<>();

    private record Pending(String code, Instant sentAt, Instant expiresAt, int attempts) {
        Pending failed() {
            return new Pending(code, sentAt, expiresAt, attempts + 1);
        }
    }

    public EmailVerificationSentResponse send(String rawEmail) {
        String email = normalize(rawEmail);
        if (memberRepository.existsByEmail(rawEmail.trim()) || memberRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.MEMBER_EMAIL_DUPLICATED);
        }
        Instant now = Instant.now();
        Pending before = pending.get(email);
        if (before != null && before.sentAt().plus(RESEND_AFTER).isAfter(now)) {
            throw new BusinessException(ErrorCode.EMAIL_RESEND_TOO_SOON);
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        try {
            mailService.send(email, "[잇다] 이메일 인증번호", """
                    안녕하세요, 우리 동네 손님과 잇-다 입니다.

                    인증번호: %s

                    회원가입 화면에 위 6자리 숫자를 입력해 주세요.
                    인증번호는 %d분 동안 유효해요.
                    직접 요청하지 않았다면 이 메일은 무시하셔도 돼요.
                    """.formatted(code, CODE_TTL.toMinutes()));
        } catch (Exception e) {
            log.warn("인증 메일 발송 실패 to={}", email, e);
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        }
        pending.put(email, new Pending(code, now, now.plus(CODE_TTL), 0));
        verified.remove(email);

        String devCode = !mailService.isConfigured() && exposeCode ? code : null;
        return new EmailVerificationSentResponse(CODE_TTL.toSeconds(), RESEND_AFTER.toSeconds(), devCode);
    }

    public void confirm(String rawEmail, String code) {
        String email = normalize(rawEmail);
        Pending p = pending.get(email);
        if (p == null || p.expiresAt().isBefore(Instant.now())) {
            pending.remove(email);
            throw new BusinessException(ErrorCode.EMAIL_CODE_EXPIRED);
        }
        if (p.attempts() >= MAX_ATTEMPTS) {
            pending.remove(email);
            throw new BusinessException(ErrorCode.EMAIL_CODE_TOO_MANY_ATTEMPTS);
        }
        if (!p.code().equals(code.trim())) {
            pending.put(email, p.failed());
            throw new BusinessException(ErrorCode.EMAIL_CODE_MISMATCH);
        }
        pending.remove(email);
        verified.put(email, Instant.now().plus(VERIFIED_TTL));
    }

    /** 가입 직전 확인: 인증을 마쳤고 아직 유효한지 */
    public boolean isVerified(String rawEmail) {
        Instant until = verified.get(normalize(rawEmail));
        return until != null && until.isAfter(Instant.now());
    }

    /** 가입이 끝나면 인증 기록 정리 */
    public void consume(String rawEmail) {
        verified.remove(normalize(rawEmail));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
