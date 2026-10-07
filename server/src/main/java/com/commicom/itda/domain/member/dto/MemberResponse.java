package com.commicom.itda.domain.member.dto;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;

public record MemberResponse(
        Long memberId,
        String email,
        String nickname,
        Role role,
        String roleName
) {

    public static MemberResponse from(Member member) {
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getNickname(),
                member.getRole(),
                member.getRole().getDescription());
    }
}
