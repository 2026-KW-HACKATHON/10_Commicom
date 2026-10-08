package com.commicom.itda.domain.member.service;

import com.commicom.itda.domain.generation.repository.GenerationRepository;
import com.commicom.itda.domain.member.dto.LoginRequest;
import com.commicom.itda.domain.member.dto.LoginResponse;
import com.commicom.itda.domain.member.dto.MemberProfileResponse;
import com.commicom.itda.domain.member.dto.MemberResponse;
import com.commicom.itda.domain.member.dto.NicknameUpdateRequest;
import com.commicom.itda.domain.member.dto.SignupRequest;
import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.scrap.repository.ScrapRepository;
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
    private final StorageService storageService;

    @Transactional
    public MemberResponse signup(SignupRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new BusinessException(ErrorCode.MEMBER_ROLE_NOT_ALLOWED);
        }
        if (memberRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.MEMBER_EMAIL_DUPLICATED);
        }
        Member member = memberRepository.save(Member.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .role(request.role())
                .build());
        return MemberResponse.from(member);
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
        member.updateNickname(request.nickname());
        return MemberResponse.from(member);
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
        memberRepository.delete(member);
    }
}
