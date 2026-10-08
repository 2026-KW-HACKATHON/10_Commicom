package com.commicom.itda.domain.member.controller;

import com.commicom.itda.domain.member.dto.LoginRequest;
import com.commicom.itda.domain.member.dto.LoginResponse;
import com.commicom.itda.domain.member.dto.MemberProfileResponse;
import com.commicom.itda.domain.member.dto.MemberResponse;
import com.commicom.itda.domain.member.dto.NicknameUpdateRequest;
import com.commicom.itda.domain.member.dto.SignupRequest;
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

    @Operation(summary = "회원가입", description = "이메일·비밀번호로 가입한다. role 은 RESIDENT 또는 OWNER.")
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
