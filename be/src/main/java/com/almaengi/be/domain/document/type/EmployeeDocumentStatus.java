package com.almaengi.be.domain.document.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EmployeeDocumentStatus {
    SUBMITTED("제출됨"),
    APPROVED("승인됨"),
    REJECTED("반려됨");

    private final String description;
}
