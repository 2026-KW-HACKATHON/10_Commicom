package com.commicom.itda.domain.member.dto;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;

/** 다른 회원이 볼 수 있는 공개 프로필 (이메일 제외) */
public record MemberProfileResponse(
        Long memberId,
        String nickname,
        Role role,
        String roleName,
        String profileImageUrl
) {

    public static MemberProfileResponse from(Member member) {
        return new MemberProfileResponse(
                member.getId(),
                member.getNickname(),
                member.getRole(),
                member.getRole().getDescription(),
                member.getProfileImageUrl());
    }
}
