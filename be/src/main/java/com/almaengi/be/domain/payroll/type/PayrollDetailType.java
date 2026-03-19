package com.almaengi.be.domain.payroll.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 급여 상세 항목의 구분을 정의하는 Enum입니다.
 */
@Getter
@RequiredArgsConstructor
public enum PayrollDetailType {
    BASE("기본급"),
    ALLOWANCE("수당"),
    DEDUCTION("공제"),
    OTHER("기타");

    private final String description;
}
