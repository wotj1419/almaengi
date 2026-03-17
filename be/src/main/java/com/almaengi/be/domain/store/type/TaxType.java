package com.almaengi.be.domain.store.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 직원의 세금 신고 유형을 정의하는 Enum입니다.
 */
@Getter
@RequiredArgsConstructor
public enum TaxType {
    NONE("default"),
    INCOME_3_3("3.3% 프리랜서"),
    FOUR_INSURANCE("4대 보험");

    private final String description;
}
