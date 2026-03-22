package com.almaengi.be.domain.payroll.entity;

import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PayrollEntityTest {

    private Payroll createPayroll() {
        return Payroll.builder()
                .targetMonth(LocalDate.of(2026, 3, 1))
                .totalWorkMinutes(2400)
                .nightWorkMinutes(0)
                .basicPay(412800L)
                .totalAllowance(82560L)
                .totalDeduction(16347L)
                .netPay(479013L)
                .build();
    }

    @Test
    @DisplayName("approve() — 미승인 급여를 승인하면 isApproved=true, approvedAt 세팅")
    void approve_success() {
        // given
        Payroll payroll = createPayroll();

        // when
        payroll.approve();

        // then
        assertThat(payroll.getIsApproved()).isTrue();
        assertThat(payroll.getApprovedAt()).isNotNull();
    }

    @Test
    @DisplayName("approve() — 이미 승인된 급여 재승인 시 PAYROLL_ALREADY_APPROVED 예외")
    void approve_alreadyApproved() {
        // given
        Payroll payroll = createPayroll();
        payroll.approve();

        // when & then
        assertThatThrownBy(payroll::approve)
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_ALREADY_APPROVED);
    }

    @Test
    @DisplayName("updateCalculation() — 승인된 급여 수정 시 PAYROLL_ALREADY_APPROVED 예외")
    void updateCalculation_afterApproval() {
        // given
        Payroll payroll = createPayroll();
        payroll.approve();

        // when & then
        assertThatThrownBy(() -> payroll.updateCalculation(100, 0, 100000L, 0L, 0L, 100000L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_ALREADY_APPROVED);
    }
}
