package com.almaengi.be.domain.contract.entity;

import com.almaengi.be.domain.contract.type.ContractStatus;
import com.almaengi.be.domain.contract.type.PaymentMethod;
import com.almaengi.be.domain.contract.type.WageType;
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
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "contracts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Contract extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private StoreEmployee storeEmployee;

    // ─── 근로계약기간 ───
    @Column(name = "contract_start_date", nullable = false)
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    // ─── 근무장소 ───
    @Column(name = "workplace", nullable = false, length = 255)
    private String workplace;

    // ─── 업무의 내용 ───
    @Column(name = "job_description", nullable = false, length = 500)
    private String jobDescription;

    // ─── 소정근로시간 ───
    @Column(name = "work_start_time", nullable = false)
    private LocalTime workStartTime;

    @Column(name = "work_end_time", nullable = false)
    private LocalTime workEndTime;

    // ─── 휴게시간 ───
    @Column(name = "break_start_time")
    private LocalTime breakStartTime;

    @Column(name = "break_end_time")
    private LocalTime breakEndTime;

    // ─── 근무일/휴일 ───
    @Column(name = "work_days_per_week", nullable = false)
    private Integer workDaysPerWeek;

    @Column(name = "weekly_holiday", nullable = false, length = 50)
    private String weeklyHoliday;

    // ─── 임금 ───
    @Enumerated(EnumType.STRING)
    @Column(name = "wage_type", nullable = false, length = 10)
    private WageType wageType;

    @Column(name = "wage_amount", nullable = false)
    private Long wageAmount;

    // ─── 상여금 ───
    @Column(name = "has_bonus", nullable = false)
    private Boolean hasBonus;

    @Column(name = "bonus_amount")
    private Long bonusAmount;

    // ─── 기타급여 ───
    @Column(name = "has_other_allowance", nullable = false)
    private Boolean hasOtherAllowance;

    @Column(name = "other_allowance_details", length = 500)
    private String otherAllowanceDetails;

    // ─── 임금지급일 ───
    @Column(name = "pay_day_description", nullable = false, length = 50)
    private String payDayDescription;

    // ─── 지급방법 ───
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    // ─── 사회보험 ───
    @Column(name = "employment_insurance", nullable = false)
    private Boolean employmentInsurance;

    @Column(name = "industrial_accident_insurance", nullable = false)
    private Boolean industrialAccidentInsurance;

    @Column(name = "national_pension", nullable = false)
    private Boolean nationalPension;

    @Column(name = "health_insurance", nullable = false)
    private Boolean healthInsurance;

    // ─── 계약일자 ───
    @Column(name = "contract_date", nullable = false)
    private LocalDate contractDate;

    // ─── 근로자 주소 (User 엔티티에 주소 필드 없음) ───
    @Column(name = "employee_address", nullable = false, length = 255)
    private String employeeAddress;

    // ─── 서명 및 상태 ───
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ContractStatus status;

    @Column(name = "owner_signature", columnDefinition = "TEXT")
    private String ownerSignature;

    @Column(name = "owner_signed_at")
    private LocalDateTime ownerSignedAt;

    @Column(name = "employee_signature", columnDefinition = "TEXT")
    private String employeeSignature;

    @Column(name = "employee_signed_at")
    private LocalDateTime employeeSignedAt;

    // ─── PDF ───
    @Column(name = "pdf_file_path", length = 500)
    private String pdfFilePath;

    // ─── 낙관적 잠금 ───
    @Version
    private Long version;

    @Builder
    public Contract(StoreEmployee storeEmployee, LocalDate contractStartDate, LocalDate contractEndDate,
                    String workplace, String jobDescription,
                    LocalTime workStartTime, LocalTime workEndTime,
                    LocalTime breakStartTime, LocalTime breakEndTime,
                    Integer workDaysPerWeek, String weeklyHoliday,
                    WageType wageType, Long wageAmount,
                    Boolean hasBonus, Long bonusAmount,
                    Boolean hasOtherAllowance, String otherAllowanceDetails,
                    String payDayDescription, PaymentMethod paymentMethod,
                    Boolean employmentInsurance, Boolean industrialAccidentInsurance,
                    Boolean nationalPension, Boolean healthInsurance,
                    LocalDate contractDate, String employeeAddress) {
        this.storeEmployee = storeEmployee;
        this.contractStartDate = contractStartDate;
        this.contractEndDate = contractEndDate;
        this.workplace = workplace;
        this.jobDescription = jobDescription;
        this.workStartTime = workStartTime;
        this.workEndTime = workEndTime;
        this.breakStartTime = breakStartTime;
        this.breakEndTime = breakEndTime;
        this.workDaysPerWeek = workDaysPerWeek;
        this.weeklyHoliday = weeklyHoliday;
        this.wageType = wageType;
        this.wageAmount = wageAmount;
        this.hasBonus = hasBonus;
        this.bonusAmount = bonusAmount;
        this.hasOtherAllowance = hasOtherAllowance;
        this.otherAllowanceDetails = otherAllowanceDetails;
        this.payDayDescription = payDayDescription;
        this.paymentMethod = paymentMethod;
        this.employmentInsurance = employmentInsurance;
        this.industrialAccidentInsurance = industrialAccidentInsurance;
        this.nationalPension = nationalPension;
        this.healthInsurance = healthInsurance;
        this.contractDate = contractDate;
        this.employeeAddress = employeeAddress;
        this.status = ContractStatus.DRAFT;
    }

    // ─── 비즈니스 메서드 ───

    public void signByOwner(String signatureBase64) {
        if (this.status != ContractStatus.DRAFT) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_STATUS);
        }
        this.ownerSignature = signatureBase64;
        this.ownerSignedAt = LocalDateTime.now();
        this.status = ContractStatus.OWNER_SIGNED;
    }

    public void signByEmployee(String signatureBase64) {
        if (this.status != ContractStatus.OWNER_SIGNED) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_STATUS);
        }
        this.employeeSignature = signatureBase64;
        this.employeeSignedAt = LocalDateTime.now();
        this.status = ContractStatus.COMPLETED;
    }

    public void updatePdfFilePath(String path) {
        this.pdfFilePath = path;
    }
}
