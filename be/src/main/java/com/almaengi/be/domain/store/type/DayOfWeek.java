package com.almaengi.be.domain.store.type;

import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum DayOfWeek {
    SUN(0, "일"), MON(1, "월"), TUE(2, "화"), WED(3, "수"), THU(4, "목"), FRI(5, "금"), SAT(6, "토");

    private final int value;
    private final String label;

    public static DayOfWeek from(int value) {
        return Arrays.stream(values())
                .filter(d -> d.value == value)
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_DAY_OF_WEEK_FORMAT));
    }
}
