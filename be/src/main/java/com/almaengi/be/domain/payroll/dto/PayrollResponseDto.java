package com.almaengi.be.domain.payroll.dto;

import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.entity.PayrollDetail;
import com.almaengi.be.domain.payroll.service.PayrollService;
import com.almaengi.be.domain.payroll.type.PayrollDetailType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

public class PayrollResponseDto {

    // ─── API 1: 알바생 내 급여 조회 ───

    @Getter
    @Builder
    public static class MyPayroll {
        @Schema(description = "매장 급여일 (1~31, 미설정 시 null)", example = "25")
        private Integer payDay;

        @Schema(description = "급여 ID (미생성 시 null)")
        private Long payrollId;

        @Schema(description = "정산 대상 월", example = "2026-03")
        private String targetMonth;

        @Schema(description = "true면 실시간 추정값, false면 확정 급여")
        private Boolean isEstimated;

        @Schema(description = "승인 여부")
        private Boolean isApproved;

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

        @Schema(description = "이체 완료 여부")
        private Boolean isTransferred;

        @Schema(description = "이체 완료 시각")
        private java.time.OffsetDateTime transferredAt;

        @Schema(description = "급여 상세 항목 목록")
        private List<DetailItem> details;

        public static MyPayroll from(Payroll payroll, List<PayrollDetail> details, boolean isEstimated, Integer payDay) {
            return MyPayroll.builder()
                    .payDay(payDay)
                    .payrollId(payroll.getId())
                    .targetMonth(payroll.getTargetMonth().toString().substring(0, 7))
                    .isEstimated(isEstimated)
                    .isApproved(payroll.getIsApproved())
                    .totalWorkMinutes(payroll.getTotalWorkMinutes())
                    .nightWorkMinutes(payroll.getNightWorkMinutes())
                    .basicPay(payroll.getBasicPay())
                    .totalAllowance(payroll.getTotalAllowance())
                    .totalDeduction(payroll.getTotalDeduction())
                    .netPay(payroll.getNetPay())
                    .isTransferred(payroll.getIsTransferred())
                    .transferredAt(payroll.getTransferredAt())
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

        @Schema(description = "총 근무 시간 합계(분)")
        private Integer totalWorkMinutes;

        @Schema(description = "총 연장근무 시간 합계(분)")
        private Integer totalOvertimeMinutes;

        @Schema(description = "총 야간근무 시간 합계(분)")
        private Integer totalNightWorkMinutes;

        @Schema(description = "급여 대상 직원 수")
        private Integer employeeCount;

        @Schema(description = "직원별 급여 목록")
        private List<EmployeePayrollSummary> employees;

        /**
         * Payroll 목록과 직원별 연장근무시간 Map으로 StorePayrollSummary를 생성합니다.
         *
         * @param payrolls           해당 월 급여 목록
         * @param targetMonth        정산 대상 월 문자열 (yyyy-MM)
         * @param overtimeMinutesMap 직원 ID → 연장근무시간(분) 매핑
         */
        public static StorePayrollSummary from(List<Payroll> payrolls, String targetMonth,
                                                Map<Long, Integer> overtimeMinutesMap) {
            long totalLaborCost = payrolls.stream().mapToLong(Payroll::getNetPay).sum();

            List<EmployeePayrollSummary> employees = payrolls.stream()
                    .map(p -> EmployeePayrollSummary.from(p, overtimeMinutesMap.getOrDefault(p.getEmployee().getId(), 0)))
                    .toList();

            // 직원별 합계 집계
            int totalWork = payrolls.stream().mapToInt(Payroll::getTotalWorkMinutes).sum();
            int totalOvertime = overtimeMinutesMap.values().stream().mapToInt(Integer::intValue).sum();
            int totalNight = payrolls.stream().mapToInt(Payroll::getNightWorkMinutes).sum();

            return StorePayrollSummary.builder()
                    .targetMonth(targetMonth)
                    .totalLaborCost(totalLaborCost)
                    .totalWorkMinutes(totalWork)
                    .totalOvertimeMinutes(totalOvertime)
                    .totalNightWorkMinutes(totalNight)
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

        @Schema(description = "계약 시급 (원)")
        private Integer hourlyWage;

        @Schema(description = "총 근무 시간(분)")
        private Integer totalWorkMinutes;

        @Schema(description = "야간근무 시간(분, 22:00~06:00)")
        private Integer nightWorkMinutes;

        @Schema(description = "연장근무 시간(분, 일 8h/주 40h 초과)")
        private Integer overtimeMinutes;

        @Schema(description = "실수령액")
        private Long netPay;

        @Schema(description = "승인 여부")
        private Boolean isApproved;

        @Schema(description = "이체 완료 여부")
        private Boolean isTransferred;

        @Schema(description = "이체 완료 시각")
        private java.time.OffsetDateTime transferredAt;

        /**
         * Payroll 엔티티와 동적 계산된 연장근무시간으로 EmployeePayrollSummary를 생성합니다.
         *
         * @param payroll         급여 엔티티
         * @param overtimeMinutes 연장근무시간 (분, Attendance 기반 동적 계산값)
         */
        public static EmployeePayrollSummary from(Payroll payroll, int overtimeMinutes) {
            return EmployeePayrollSummary.builder()
                    .payrollId(payroll.getId())
                    .employeeId(payroll.getEmployee().getId())
                    .employeeName(payroll.getEmployee().getUser().getName())
                    .position(payroll.getEmployee().getPosition())
                    .hourlyWage(payroll.getEmployee().getHourlyWage())
                    .totalWorkMinutes(payroll.getTotalWorkMinutes())
                    .nightWorkMinutes(payroll.getNightWorkMinutes())
                    .overtimeMinutes(overtimeMinutes)
                    .netPay(payroll.getNetPay())
                    .isApproved(payroll.getIsApproved())
                    .isTransferred(payroll.getIsTransferred())
                    .transferredAt(payroll.getTransferredAt())
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
        @Schema(description = "매장 급여일 (1~31, 미설정 시 null)", example = "25")
        private Integer payDay;

        @Schema(description = "이전 달 급여 전체 이체 완료 여부 (모두 이체 시 true, 하나라도 미이체 시 false)")
        private Boolean isAllTransferred;

        @Schema(description = "정산 대상 월", example = "2026-03")
        private String targetMonth;

        @Schema(description = "진행 중인 월 여부 (true면 부분 기간 비교)")
        private Boolean isPartialMonth;

        @Schema(description = "이번 달 비교 시작일")
        private java.time.LocalDate thisMonthStart;

        @Schema(description = "이번 달 비교 종료일")
        private java.time.LocalDate thisMonthEnd;

        @Schema(description = "이전 달 비교 시작일")
        private java.time.LocalDate lastMonthStart;

        @Schema(description = "이전 달 비교 종료일 (이전 달 말일로 cap)")
        private java.time.LocalDate lastMonthEnd;

        // ── 총액 비교 ──

        @Schema(description = "이번 달 총 급여 지출 (netPay 합계)")
        private Long thisMonthTotal;

        @Schema(description = "이전 달 총 급여 지출")
        private Long lastMonthTotal;

        @Schema(description = "전월 대비 증감률 (%, 소수점 첫째 자리)", example = "12.5")
        private Double changeRate;

        @Schema(description = "증감 방향 (UP, DOWN, UNCHANGED)")
        private String changeDirection;

        // ── 수당 비교 ──

        @Schema(description = "이번 달 기본급 합계")
        private Long thisMonthBasicPay;

        @Schema(description = "이전 달 기본급 합계")
        private Long lastMonthBasicPay;

        @Schema(description = "이번 달 주휴수당 합계")
        private Long thisMonthWeeklyHolidayPay;

        @Schema(description = "이전 달 주휴수당 합계")
        private Long lastMonthWeeklyHolidayPay;

        @Schema(description = "이번 달 연장수당 합계")
        private Long thisMonthOvertimePay;

        @Schema(description = "이전 달 연장수당 합계")
        private Long lastMonthOvertimePay;

        @Schema(description = "이번 달 야간수당 합계")
        private Long thisMonthNightPay;

        @Schema(description = "이전 달 야간수당 합계")
        private Long lastMonthNightPay;

        // ── 직원 목록 ──

        @Schema(description = "이번 달 급여 대상 직원 수")
        private Integer employeeCount;

        @Schema(description = "직원별 급여 요약 (netPay 내림차순)")
        private List<SummaryEmployee> employees;

        @Schema(description = "최고 급여자 리스트 (동점 시 복수)")
        private List<SummaryEmployee> topEarners;
    }

    /**
     * 급여 지출 요약의 직원별 급여 정보입니다.
     */
    @Getter
    @Builder
    public static class SummaryEmployee {
        @Schema(description = "직원 ID")
        private Long employeeId;

        @Schema(description = "직원 이름")
        private String employeeName;

        @Schema(description = "실수령액")
        private Long netPay;
    }
}
