package com.almaengi.be.domain.contract.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WageType {
    MONTHLY("월급"),
    DAILY("일급"),
    HOURLY("시급");

    private final String description;
}
