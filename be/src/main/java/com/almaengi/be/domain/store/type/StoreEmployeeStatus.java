package com.almaengi.be.domain.store.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 매장 직원의 근무 상태를 정의하는 Enum입니다.
 */
@Getter
@RequiredArgsConstructor
public enum StoreEmployeeStatus {
    INVITED("초대 코드 발송"),
    WORKING("근무 중"),
    RESIGNED("퇴사"),
    ON_LEAVE("휴직"),
    BEST("우수"); // 와이어프레임에 맞춰 추가

    private final String description;
}
