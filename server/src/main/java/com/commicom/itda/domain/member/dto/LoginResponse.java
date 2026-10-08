package com.commicom.itda.domain.member.dto;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        Long memberId,
        String nickname,
        Role role
) {

    public static LoginResponse of(String accessToken, long expiresInMs, Member member) {
        return new LoginResponse(accessToken, "Bearer", expiresInMs / 1000,
                member.getId(), member.getNickname(), member.getRole());
    }
}
