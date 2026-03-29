package com.almaengi.be.domain.payroll.dto;

import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.entity.PayrollDetail;
import com.almaengi.be.domain.payroll.service.PayrollService;
import com.almaengi.be.domain.payroll.type.PayrollDetailType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

public class PayrollResponseDto {

    // ─── API 1: 알바생 내 급여 조회 ───

    @Getter
    @Builder
    public static class MyPayroll {
        @Schema(description = "급여 ID (미생성 시 null)")
        private Long payrollId;

        @Schema(description = "정산 대상 월", example = "2026-03")
        private String targetMonth;

        @Schema(description = "true면 실시간 추정값, false면 확정 급여")
        private Boolean isEstimated;

        @Schema(description = "승인 여부")
        private Boolean isApproved;

        @Schema(description = "이체 완료 여부")
        private Boolean isTransferred;

        @Schema(description = "이체 완료 일시")
        private String transferredAt;

        @Schema(description = "총 근무 시간(분)")
        private Integer totalWorkMinutes;

        @Schema(description = "야간 근무 시간(분)")
        private Integer nightWorkMinutes;

        @Schema(description = "기본급")
        private Long basicPay;

        @Schema(description = "총 수당")
        private Long totalAllowance;

        @Schema(description = "총 공제")
        private Long totalDeduction;

        @Schema(description = "실수령액")
        private Long netPay;

        @Schema(description = "급여 상세 항목 목록")
        private List<DetailItem> details;

        public static MyPayroll from(Payroll payroll, List<PayrollDetail> details, boolean isEstimated) {
            return MyPayroll.builder()
                    .payrollId(payroll.getId())
                    .targetMonth(payroll.getTargetMonth().toString().substring(0, 7))
                    .isEstimated(isEstimated)
                    .isApproved(payroll.getIsApproved())
                    .isTransferred(payroll.getIsTransferred())
                    .transferredAt(payroll.getTransferredAt() != null ? payroll.getTransferredAt().toLocalDate().toString() : null)
                    .totalWorkMinutes(payroll.getTotalWorkMinutes())
                    .nightWorkMinutes(payroll.getNightWorkMinutes())
                    .basicPay(payroll.getBasicPay())
                    .totalAllowance(payroll.getTotalAllowance())
                    .totalDeduction(payroll.getTotalDeduction())
                    .netPay(payroll.getNetPay())
                    .details(details.stream().map(DetailItem::from).toList())
                    .build();
        }
    }

    // ─── API 2: 사장님 매장 급여 목록 ───

    @Getter
    @Builder
    public static class StorePayrollSummary {
        @Schema(description = "정산 대상 월", example = "2026-03")
        private String targetMonth;

        @Schema(description = "총 인건비 (실수령액 합계)")
        private Long totalLaborCost;

        @Schema(description = "총 지급액 (기본급 + 수당 합계)")
        private Long totalGrossPay;

        @Schema(description = "총 공제액 합계")
        private Long totalDeduction;

        @Schema(description = "급여 대상 직원 수")
        private Integer employeeCount;

        @Schema(description = "직원별 급여 목록")
        private List<EmployeePayrollSummary> employees;

        public static StorePayrollSummary from(List<Payroll> payrolls, String targetMonth) {
            long totalLaborCost = payrolls.stream().mapToLong(Payroll::getNetPay).sum();
            long totalGrossPay = payrolls.stream()
                    .mapToLong(p -> p.getBasicPay() + p.getTotalAllowance()).sum();
            long totalDeduction = payrolls.stream().mapToLong(Payroll::getTotalDeduction).sum();

            List<EmployeePayrollSummary> employees = payrolls.stream()
                    .map(EmployeePayrollSummary::from)
                    .toList();

            return StorePayrollSummary.builder()
                    .targetMonth(targetMonth)
                    .totalLaborCost(totalLaborCost)
                    .totalGrossPay(totalGrossPay)
                    .totalDeduction(totalDeduction)
                    .employeeCount(payrolls.size())
                    .employees(employees)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class EmployeePayrollSummary {
        @Schema(description = "급여 ID")
        private Long payrollId;

        @Schema(description = "직원 ID")
        private Long employeeId;

        @Schema(description = "직원 이름")
        private String employeeName;

        @Schema(description = "직책")
        private String position;

        @Schema(description = "총 근무 시간(분)")
        private Integer totalWorkMinutes;

        @Schema(description = "기본급")
        private Long basicPay;

        @Schema(description = "총 수당")
        private Long totalAllowance;

        @Schema(description = "총 공제")
        private Long totalDeduction;

        @Schema(description = "실수령액")
        private Long netPay;

        @Schema(description = "승인 여부")
        private Boolean isApproved;

        @Schema(description = "이체 완료 여부")
        private Boolean isTransferred;

        @Schema(description = "이체 완료 일시")
        private String transferredAt;

        public static EmployeePayrollSummary from(Payroll payroll) {
            return EmployeePayrollSummary.builder()
                    .payrollId(payroll.getId())
                    .employeeId(payroll.getEmployee().getId())
                    .employeeName(payroll.getEmployee().getUser().getName())
                    .position(payroll.getEmployee().getPosition())
                    .totalWorkMinutes(payroll.getTotalWorkMinutes())
                    .basicPay(payroll.getBasicPay())
                    .totalAllowance(payroll.getTotalAllowance())
                    .totalDeduction(payroll.getTotalDeduction())
                    .netPay(payroll.getNetPay())
                    .isApproved(payroll.getIsApproved())
                    .isTransferred(payroll.getIsTransferred())
                    .transferredAt(payroll.getTransferredAt() != null ? payroll.getTransferredAt().toLocalDate().toString() : null)
                    .build();
        }
    }

    // ─── API 3: 급여 상세 조회 ───

    @Getter
    @Builder
    public static class PayrollDetailView {
        @Schema(description = "급여 ID")
        private Long payrollId;

        @Schema(description = "직원 이름")
        private String employeeName;

        @Schema(description = "정산 대상 월", example = "2026-03")
        private String targetMonth;

        @Schema(description = "총 근무 시간(분)")
        private Integer totalWorkMinutes;

        @Schema(description = "야간 근무 시간(분)")
        private Integer nightWorkMinutes;

        @Schema(description = "기본급")
        private Long basicPay;

        @Schema(description = "총 수당")
        private Long totalAllowance;

        @Schema(description = "총 공제")
        private Long totalDeduction;

        @Schema(description = "실수령액")
        private Long netPay;

        @Schema(description = "승인 여부")
        private Boolean isApproved;

        @Schema(description = "기본급 항목")
        private List<DetailItem> baseItems;

        @Schema(description = "수당 항목")
        private List<DetailItem> allowanceItems;

        @Schema(description = "공제 항목")
        private List<DetailItem> deductionItems;

        public static PayrollDetailView from(Payroll payroll, List<PayrollDetail> details) {
            return PayrollDetailView.builder()
                    .payrollId(payroll.getId())
                    .employeeName(payroll.getEmployee().getUser().getName())
                    .targetMonth(payroll.getTargetMonth().toString().substring(0, 7))
                    .totalWorkMinutes(payroll.getTotalWorkMinutes())
                    .nightWorkMinutes(payroll.getNightWorkMinutes())
                    .basicPay(payroll.getBasicPay())
                    .totalAllowance(payroll.getTotalAllowance())
                    .totalDeduction(payroll.getTotalDeduction())
                    .netPay(payroll.getNetPay())
                    .isApproved(payroll.getIsApproved())
                    .baseItems(filterByType(details, PayrollDetailType.BASE))
                    .allowanceItems(filterByType(details, PayrollDetailType.ALLOWANCE))
                    .deductionItems(filterByType(details, PayrollDetailType.DEDUCTION))
                    .build();
        }

        private static List<DetailItem> filterByType(List<PayrollDetail> details, PayrollDetailType type) {
            return details.stream()
                    .filter(d -> d.getDetailType() == type)
                    .map(DetailItem::from)
                    .toList();
        }
    }

    // ─── 공통: 급여 상세 항목 ───

    @Getter
    @Builder
    public static class DetailItem {
        @Schema(description = "상세 항목 ID")
        private Long detailId;

        @Schema(description = "항목 유형 (BASE, ALLOWANCE, DEDUCTION, OTHER)")
        private String detailType;

        @Schema(description = "항목명", example = "기본급")
        private String itemName;

        @Schema(description = "금액")
        private Long amount;

        @Schema(description = "계산식")
        private String calculationFormula;

        @Schema(description = "해당 근무 시간(분)")
        private Integer workMinutes;

        public static DetailItem from(PayrollDetail detail) {
            return DetailItem.builder()
                    .detailId(detail.getId())
                    .detailType(detail.getDetailType().name())
                    .itemName(detail.getItemName())
                    .amount(detail.getAmount())
                    .calculationFormula(detail.getCalculationFormula())
                    .workMinutes(detail.getWorkMinutes())
                    .build();
        }
    }

    // ─── API 5: 급여 일괄 생성 결과 ───

    @Getter
    @Builder
    public static class GenerateResult {
        @Schema(description = "생성 성공 직원 수")
        private Integer successCount;

        @Schema(description = "생성 실패 직원 수")
        private Integer failedCount;

        @Schema(description = "실패 직원 목록")
        private List<FailedEmployeeInfo> failedEmployees;

        public static GenerateResult from(PayrollService.StorePayrollResult result) {
            List<FailedEmployeeInfo> failed = result.failedList().stream()
                    .map(FailedEmployeeInfo::from)
                    .toList();

            return GenerateResult.builder()
                    .successCount(result.successList().size())
                    .failedCount(result.failedList().size())
                    .failedEmployees(failed)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class FailedEmployeeInfo {
        @Schema(description = "직원 ID")
        private Long employeeId;

        @Schema(description = "직원 이름")
        private String employeeName;

        @Schema(description = "실패 사유")
        private String reason;

        public static FailedEmployeeInfo from(PayrollService.FailedEmployee failedEmployee) {
            return FailedEmployeeInfo.builder()
                    .employeeId(failedEmployee.employeeId())
                    .employeeName(failedEmployee.employeeName())
                    .reason(failedEmployee.reason())
                    .build();
        }
    }

    // ─── API 6: 급여 지출 요약 (전월 대비) ───

    @Getter
    @Builder
    public static class MonthlySummary {
        @Schema(description = "정산 대상 월", example = "2026-03")
        private String targetMonth;

        @Schema(description = "이번 달 총 급여 지출 (netPay 합계)")
        private Long thisMonthTotal;

        @Schema(description = "지난 달 총 급여 지출")
        private Long lastMonthTotal;

        @Schema(description = "전월 대비 증감률 (%, 소수점 첫째 자리)", example = "12.5")
        private Double changeRate;

        @Schema(description = "증감 방향 (UP, DOWN, UNCHANGED)")
        private String changeDirection;

        @Schema(description = "이번 달 급여 대상 직원 수")
        private Integer employeeCount;
    }
}
