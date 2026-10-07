package com.commicom.itda.domain.member.controller;

import com.commicom.itda.domain.member.dto.LoginRequest;
import com.commicom.itda.domain.member.dto.LoginResponse;
import com.commicom.itda.domain.member.dto.MemberResponse;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
}
