package com.almaengi.be.domain.payroll.scheduler;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PayrollTransferScheduler - 월말 보정 로직")
class PayrollTransferSchedulerTest {

    /**
     * buildPayDays는 private 메서드이므로 리플렉션으로 호출합니다.
     */
    @SuppressWarnings("unchecked")
    private List<Integer> invokeBuildPayDays(int todayDay, int lastDayOfMonth) throws Exception {
        PayrollTransferScheduler scheduler = new PayrollTransferScheduler(null, null);
        Method method = PayrollTransferScheduler.class.getDeclaredMethod("buildPayDays", int.class, int.class);
        method.setAccessible(true);
        return (List<Integer>) method.invoke(scheduler, todayDay, lastDayOfMonth);
    }

    @Test
    @DisplayName("일반 날짜: 해당 일자만 반환")
    void normalDay() throws Exception {
        // 3월 15일 → [15]
        List<Integer> result = invokeBuildPayDays(15, 31);

        assertThat(result).containsExactly(15);
    }

    @Test
    @DisplayName("31일인 달의 월말: 해당 일자만 반환")
    void lastDayOf31DayMonth() throws Exception {
        // 3월 31일 (월말 = 31) → [31] (보정 불필요)
        List<Integer> result = invokeBuildPayDays(31, 31);

        assertThat(result).containsExactly(31);
    }

    @Test
    @DisplayName("2월 28일 월말 보정: 28~31일 모두 포함")
    void february28_leapYearCorrection() throws Exception {
        // 2월 28일 (월말) → [28, 29, 30, 31]
        List<Integer> result = invokeBuildPayDays(28, 28);

        assertThat(result).containsExactly(28, 29, 30, 31);
    }

    @Test
    @DisplayName("4월 30일 월말 보정: 30~31일 포함")
    void april30_correction() throws Exception {
        // 4월 30일 (월말) → [30, 31]
        List<Integer> result = invokeBuildPayDays(30, 30);

        assertThat(result).containsExactly(30, 31);
    }

    @Test
    @DisplayName("2월 29일(윤년) 월말 보정: 29~31일 포함")
    void february29_leapYear() throws Exception {
        // 윤년 2월 29일 (월말) → [29, 30, 31]
        List<Integer> result = invokeBuildPayDays(29, 29);

        assertThat(result).containsExactly(29, 30, 31);
    }

    @Test
    @DisplayName("월말이 아닌 날: 보정 없이 해당 일자만")
    void notLastDay() throws Exception {
        // 4월 15일 (월말 아님) → [15]
        List<Integer> result = invokeBuildPayDays(15, 30);

        assertThat(result).containsExactly(15);
    }
}
