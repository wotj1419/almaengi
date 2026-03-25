package com.almaengi.be.domain.contract.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentMethod {
    DIRECT("직접지급"),
    BANK_TRANSFER("예금통장 입금");

    private final String description;
}
