package com.almaengi.be.domain.document.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocType {
    CONTRACT("근로계약서"),
    PAYSLIP("급여명세서"),
    OTHER("기타");

    private final String description;
}
