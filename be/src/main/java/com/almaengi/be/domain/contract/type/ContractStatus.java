package com.almaengi.be.domain.contract.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractStatus {
    DRAFT("작성완료"),
    OWNER_SIGNED("사장님 서명완료"),
    COMPLETED("계약 체결완료");

    private final String description;
}
