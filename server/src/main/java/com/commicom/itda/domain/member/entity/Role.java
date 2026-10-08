package com.commicom.itda.domain.member.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {

    RESIDENT("주민"),
    OWNER("사장님"),
    ADMIN("관리자");

    private final String description;
}
