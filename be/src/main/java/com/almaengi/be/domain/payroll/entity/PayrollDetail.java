package com.almaengi.be.domain.payroll.entity;

import com.almaengi.be.domain.payroll.type.PayrollDetailType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 급여 상세 항목(payroll_details)을 담는 엔티티입니다.
 * 기본급, 주휴수당, 연장수당, 야간수당, 공제 항목 등을 개별 row로 관리합니다.
 */
@Entity
@Table(name = "payroll_details")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PayrollDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false)
    private Payroll payroll;

    @Enumerated(EnumType.STRING)
    @Column(name = "detail_type", length = 20, nullable = false)
    private PayrollDetailType detailType;

    @Column(name = "item_name", length = 50, nullable = false)
    private String itemName;

    @Column(name = "amount", nullable = false)
    private Long amount = 0L;

    @Column(name = "calculation_formula", length = 255)
    private String calculationFormula;

    @Column(name = "work_minutes", nullable = false)
    private Integer workMinutes = 0;

    @Builder
    public PayrollDetail(Payroll payroll, PayrollDetailType detailType,
                         String itemName, Long amount,
                         String calculationFormula, Integer workMinutes) {
        this.payroll = payroll;
        this.detailType = detailType;
        this.itemName = itemName;
        this.amount = amount != null ? amount : 0L;
        this.calculationFormula = calculationFormula;
        this.workMinutes = workMinutes != null ? workMinutes : 0;
    }
}
