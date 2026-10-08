package com.commicom.itda.domain.member.controller;

import com.commicom.itda.domain.member.dto.AvailabilityResponse;
import com.commicom.itda.domain.member.dto.EmailVerificationConfirmRequest;
import com.commicom.itda.domain.member.dto.EmailVerificationRequest;
import com.commicom.itda.domain.member.dto.EmailVerificationSentResponse;
import com.commicom.itda.domain.member.dto.LoginRequest;
import com.commicom.itda.domain.member.dto.LoginResponse;
import com.commicom.itda.domain.member.dto.MemberProfileResponse;
import com.commicom.itda.domain.member.dto.MemberResponse;
import com.commicom.itda.domain.member.dto.NicknameUpdateRequest;
import com.commicom.itda.domain.member.dto.PasswordUpdateRequest;
import com.commicom.itda.domain.member.dto.SignupRequest;
import com.commicom.itda.domain.member.service.EmailVerificationService;
import com.commicom.itda.domain.member.service.MemberService;
import com.commicom.itda.global.response.ApiResponse;
import com.commicom.itda.global.response.SuccessStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Member", description = "회원가입·로그인")
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final EmailVerificationService emailVerificationService;

    @Operation(summary = "이메일 중복 확인", description = "가입 전에 이메일을 쓸 수 있는지 확인한다. available=true 면 사용 가능. 로그인 불필요.")
    @GetMapping("/check-email")
    public ApiResponse<AvailabilityResponse> checkEmail(@RequestParam String email) {
        return ApiResponse.onSuccess(memberService.checkEmail(email));
    }

    @Operation(summary = "닉네임 중복 확인",
            description = "available=true 면 사용 가능. 로그인한 상태로 부르면 내 현재 닉네임은 사용 가능으로 본다(닉네임 수정 화면). 로그인 불필요.")
    @GetMapping("/check-nickname")
    public ApiResponse<AvailabilityResponse> checkNickname(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @RequestParam String nickname) {
        return ApiResponse.onSuccess(memberService.checkNickname(nickname, memberId));
    }

    @Operation(summary = "이메일 인증번호 받기",
            description = "가입할 이메일로 6자리 인증번호를 보낸다. 5분 동안 유효, 60초 뒤 다시 받기 가능. 이미 가입된 이메일이면 MEMBER409. "
                    + "메일 서버가 설정되지 않은 로컬 개발 환경에서는 메일 대신 응답의 devCode 로 인증번호를 준다.")
    @PostMapping("/email-verifications")
    public ApiResponse<EmailVerificationSentResponse> sendEmailCode(@Valid @RequestBody EmailVerificationRequest request) {
        return ApiResponse.onSuccess(emailVerificationService.send(request.email()));
    }

    @Operation(summary = "이메일 인증번호 확인", description = "맞으면 30분 동안 이 이메일로 가입할 수 있다. 같은 인증번호로 5번까지 틀릴 수 있다.")
    @PostMapping("/email-verifications/confirm")
    public ApiResponse<Void> confirmEmailCode(@Valid @RequestBody EmailVerificationConfirmRequest request) {
        emailVerificationService.confirm(request.email(), request.code());
        return ApiResponse.onSuccess(null);
    }

    @Operation(summary = "회원가입", description = "이메일·비밀번호로 가입한다. role 은 RESIDENT 또는 OWNER. 이메일 인증을 먼저 마쳐야 하고(MEMBER400_2), 닉네임이 겹치면 MEMBER409_2.")
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MemberResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ApiResponse.of(SuccessStatus.CREATED, memberService.signup(request));
    }

    @Operation(summary = "로그인", description = "성공하면 Access Token 을 발급한다.")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.onSuccess(memberService.login(request));
    }

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ApiResponse<MemberResponse> getMe(@Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(memberService.getMember(memberId));
    }

    @Operation(summary = "회원 프로필 조회", description = "이메일 없이 공개 프로필 정보를 반환한다. 로그인 불필요.")
    @GetMapping("/{memberId}/profile")
    public ApiResponse<MemberProfileResponse> getProfile(@PathVariable Long memberId) {
        return ApiResponse.onSuccess(memberService.getProfile(memberId));
    }

    @Operation(summary = "닉네임 수정")
    @PatchMapping("/me/nickname")
    public ApiResponse<MemberResponse> updateNickname(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody NicknameUpdateRequest request) {
        return ApiResponse.onSuccess(memberService.updateNickname(memberId, request));
    }

    @Operation(summary = "비밀번호 변경",
            description = "현재 비밀번호가 맞으면 새 비밀번호(8~64자)로 바꾼다. 현재 비밀번호가 틀리면 MEMBER400_3, 지금과 같으면 MEMBER400_4.")
    @PatchMapping("/me/password")
    public ApiResponse<Void> updatePassword(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody PasswordUpdateRequest request) {
        memberService.updatePassword(memberId, request);
        return ApiResponse.onSuccess(null);
    }

    @Operation(summary = "프로필 이미지 수정")
    @PatchMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MemberResponse> updateProfileImage(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @RequestPart MultipartFile image) {
        return ApiResponse.onSuccess(memberService.updateProfileImage(memberId, image));
    }

    @Operation(summary = "회원 탈퇴", description = "회원 탈퇴 후 관련 스크랩·생성 요청 데이터도 함께 삭제된다.")
    @DeleteMapping("/me")
    public ApiResponse<Void> deleteMember(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        memberService.deleteMember(memberId);
        return ApiResponse.onSuccess(null);
    }
}
