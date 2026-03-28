package com.almaengi.be.domain.document.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentStatus {
    ACTIVE("유효"),
    EXPIRED("만료"),
    DELETED("삭제");

    private final String description;
}
