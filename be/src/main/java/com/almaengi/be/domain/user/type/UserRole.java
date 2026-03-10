package com.almaengi.be.domain.user.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 권한(역할)을 정의하는 Enum입니다.
 */
@Getter
@RequiredArgsConstructor
public enum UserRole {
    OWNER("사장님"),
    ALBA("알바생");

    private final String description;
}
