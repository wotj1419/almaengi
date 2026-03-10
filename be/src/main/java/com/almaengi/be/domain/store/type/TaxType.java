package com.almaengi.be.domain.store.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 직원의 세금 신고 유형을 정의하는 Enum입니다.
 */
@Getter
@RequiredArgsConstructor
public enum TaxType {
    FREE_LANCER("3.3% 프리랜서"),
    MAJOR_INSURANCE("4대 보험"),
    NONE("미신고");

    private final String description;
}
