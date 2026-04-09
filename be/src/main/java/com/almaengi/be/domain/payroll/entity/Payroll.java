package com.almaengi.be.domain.payroll.entity;

import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.global.entity.BaseTimeEntity;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * 직원의 월별 급여 정산 내역(payrolls)을 담는 엔티티입니다.
 */
@Entity
@Table(name = "payrolls")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payroll extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payroll_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private StoreEmployee employee;

    @Column(name = "target_month", nullable = false)
    private LocalDate targetMonth;

    @Column(name = "total_work_minutes", nullable = false)
    private Integer totalWorkMinutes = 0;

    @Column(name = "night_work_minutes", nullable = false)
    private Integer nightWorkMinutes = 0;

    @Column(name = "basic_pay", nullable = false)
    private Long basicPay = 0L;

    @Column(name = "total_allowance", nullable = false)
    private Long totalAllowance = 0L;

    @Column(name = "total_deduction", nullable = false)
    private Long totalDeduction = 0L;

    @Column(name = "net_pay", nullable = false)
    private Long netPay = 0L;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "is_transferred", nullable = false)
    private Boolean isTransferred = false;

    @Column(name = "transferred_at")
    private OffsetDateTime transferredAt;

    @Builder
    public Payroll(StoreEmployee employee, LocalDate targetMonth,
                   Integer totalWorkMinutes, Integer nightWorkMinutes,
                   Long basicPay, Long totalAllowance, Long totalDeduction, Long netPay) {
        this.employee = employee;
        this.targetMonth = targetMonth;
        this.totalWorkMinutes = totalWorkMinutes != null ? totalWorkMinutes : 0;
        this.nightWorkMinutes = nightWorkMinutes != null ? nightWorkMinutes : 0;
        this.basicPay = basicPay != null ? basicPay : 0L;
        this.totalAllowance = totalAllowance != null ? totalAllowance : 0L;
        this.totalDeduction = totalDeduction != null ? totalDeduction : 0L;
        this.netPay = netPay != null ? netPay : 0L;
    }

    /**
     * 급여를 최종 승인합니다.
     */
    public void approve() {
        if (this.isApproved) {
            throw new BusinessException(ErrorCode.PAYROLL_ALREADY_APPROVED);
        }
        this.isApproved = true;
        this.approvedAt = OffsetDateTime.now();
    }

    /**
     * 급여 계산 결과를 갱신합니다.
     * 이미 승인된 급여는 수정할 수 없습니다.
     */
    public void updateCalculation(Integer totalWorkMinutes, Integer nightWorkMinutes,
                                  Long basicPay, Long totalAllowance,
                                  Long totalDeduction, Long netPay) {
        if (this.isApproved) {
            throw new BusinessException(ErrorCode.PAYROLL_ALREADY_APPROVED);
        }
        this.totalWorkMinutes = totalWorkMinutes;
        this.nightWorkMinutes = nightWorkMinutes;
        this.basicPay = basicPay;
        this.totalAllowance = totalAllowance;
        this.totalDeduction = totalDeduction;
        this.netPay = netPay;
    }

    /**
     * 이체 완료 처리합니다.
     */
    public void completeTransfer() {
        this.isTransferred = true;
        this.transferredAt = OffsetDateTime.now();
    }
}
