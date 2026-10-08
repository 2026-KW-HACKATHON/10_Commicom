package com.commicom.itda.domain.member.service;

import com.commicom.itda.domain.coupon.service.CouponService;
import com.commicom.itda.domain.generation.repository.GenerationRepository;
import com.commicom.itda.domain.member.dto.AvailabilityResponse;
import com.commicom.itda.domain.member.dto.LoginRequest;
import com.commicom.itda.domain.member.dto.LoginResponse;
import com.commicom.itda.domain.member.dto.MemberProfileResponse;
import com.commicom.itda.domain.member.dto.MemberResponse;
import com.commicom.itda.domain.member.dto.NicknameUpdateRequest;
import com.commicom.itda.domain.member.dto.PasswordUpdateRequest;
import com.commicom.itda.domain.member.dto.SignupRequest;
import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.pigeon.service.PigeonService;
import com.commicom.itda.domain.quest.service.QuestService;
import com.commicom.itda.domain.scrap.repository.ScrapRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.security.JwtProvider;
import com.commicom.itda.infra.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final ScrapRepository scrapRepository;
    private final GenerationRepository generationRepository;
    private final StoreRepository storeRepository;
    private final QuestService questService;
    private final PigeonService pigeonService;
    private final CouponService couponService;
    private final StorageService storageService;
    private final EmailVerificationService emailVerificationService;

    @Transactional
    public MemberResponse signup(SignupRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new BusinessException(ErrorCode.MEMBER_ROLE_NOT_ALLOWED);
        }
        if (memberRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.MEMBER_EMAIL_DUPLICATED);
        }
        if (memberRepository.existsByNickname(request.nickname().trim())) {
            throw new BusinessException(ErrorCode.MEMBER_NICKNAME_DUPLICATED);
        }
        if (!emailVerificationService.isVerified(request.email())) {
            throw new BusinessException(ErrorCode.MEMBER_EMAIL_NOT_VERIFIED);
        }
        Member member = memberRepository.save(Member.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname().trim())
                .role(request.role())
                .build());
        emailVerificationService.consume(request.email());
        return MemberResponse.from(member);
    }

    /** 이메일 중복 확인 (가입 전) */
    public AvailabilityResponse checkEmail(String email) {
        return new AvailabilityResponse(!memberRepository.existsByEmail(email.trim()));
    }

    /** 닉네임 중복 확인. 로그인한 회원이면 내 닉네임은 사용 가능으로 봄 (닉네임 수정 화면) */
    public AvailabilityResponse checkNickname(String nickname, Long memberId) {
        String name = nickname.trim();
        boolean taken = memberId == null
                ? memberRepository.existsByNickname(name)
                : memberRepository.existsByNicknameAndIdNot(name, memberId);
        return new AvailabilityResponse(!taken);
    }

    public LoginResponse login(LoginRequest request) {
        // 이메일 존재 여부를 노출하지 않도록 두 경우 모두 같은 에러로 응답
        Member member = memberRepository.findByEmail(request.email())
                .filter(m -> passwordEncoder.matches(request.password(), m.getPassword()))
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_LOGIN_FAILED));
        String accessToken = jwtProvider.createAccessToken(member.getId(), member.getRole());
        return LoginResponse.of(accessToken, jwtProvider.getAccessTokenExpirationMs(), member);
    }

    public MemberResponse getMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        return MemberResponse.from(member);
    }

    public MemberProfileResponse getProfile(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        return MemberProfileResponse.from(member);
    }

    @Transactional
    public MemberResponse updateNickname(Long memberId, NicknameUpdateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        String nickname = request.nickname().trim();
        if (memberRepository.existsByNicknameAndIdNot(nickname, memberId)) {
            throw new BusinessException(ErrorCode.MEMBER_NICKNAME_DUPLICATED);
        }
        member.updateNickname(nickname);
        return MemberResponse.from(member);
    }

    /** 현재 비밀번호를 확인한 뒤 새 비밀번호로 바꾼다. 발급된 토큰은 그대로 유효 */
    @Transactional
    public void updatePassword(Long memberId, PasswordUpdateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (!passwordEncoder.matches(request.currentPassword(), member.getPassword())) {
            throw new BusinessException(ErrorCode.MEMBER_PASSWORD_MISMATCH);
        }
        if (passwordEncoder.matches(request.newPassword(), member.getPassword())) {
            throw new BusinessException(ErrorCode.MEMBER_PASSWORD_UNCHANGED);
        }
        member.updatePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public MemberResponse updateProfileImage(Long memberId, MultipartFile image) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        String imageUrl = storageService.upload(image, "profiles");
        member.updateProfileImageUrl(imageUrl);
        return MemberResponse.from(member);
    }

    @Transactional
    public void deleteMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        scrapRepository.deleteAllByMember(member);
        generationRepository.deleteAllByRequestedBy(member);
        storeRepository.findByOwnerId(memberId).ifPresent(Store::detachOwner);
        questService.deleteAllOf(memberId);
        pigeonService.deleteAllOf(memberId);
        couponService.deleteAllOf(memberId);
        memberRepository.delete(member);
    }
}
