package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.global.config.PayrollProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 급여 산정의 순수 계산 로직을 담당하는 stateless 서비스입니다.
 * DB 접근 없이 파라미터만으로 계산합니다.
 */
@Service
@RequiredArgsConstructor
public class PayrollCalculationService {

    private final PayrollProperties props;

    // ========================================
    // 1. 총 근무시간 계산
    // ========================================

    /**
     * 출퇴근 기록에서 총 근무 시간(분)을 계산합니다.
     */
    public int calculateTotalWorkMinutes(List<Attendance> attendances) {
        return attendances.stream()
                .mapToInt(this::getActualWorkMinutes)
                .sum();
    }

    // ========================================
    // 2. 야간 근무시간 계산
    // ========================================

    /**
     * 22:00 ~ 06:00 구간에 해당하는 야간 근무 시간(분)을 산출합니다.
     */
    public int calculateNightWorkMinutes(List<Attendance> attendances) {
        LocalTime nightStart = LocalTime.parse(props.getNightStart());  // 22:00
        LocalTime nightEnd = LocalTime.parse(props.getNightEnd());      // 06:00

        int totalNightMinutes = 0;

        for (Attendance a : attendances) {
            LocalDateTime clockIn = a.getClockIn();
            LocalDateTime clockOut = a.getClockOut();
            int breakMin = a.getBreakMinutes() != null ? a.getBreakMinutes() : 0;

            // 총 근무시간(분) — 휴게 차감 전 원본
            int rawTotalMinutes = (int) Duration.between(clockIn, clockOut).toMinutes();

            // 근무 시간을 날짜별로 쪼개서 야간 구간 교집합 계산
            int nightMinutesForThis = 0;
            LocalDate currentDate = clockIn.toLocalDate();
            LocalDate endDate = clockOut.toLocalDate();

            while (!currentDate.isAfter(endDate)) {
                // 이 날의 야간 구간: [22:00 ~ 다음날 06:00]
                LocalDateTime nightBlockStart = currentDate.atTime(nightStart);
                LocalDateTime nightBlockEnd = currentDate.plusDays(1).atTime(nightEnd);

                // 근무 시간과 야간 구간의 교집합
                LocalDateTime overlapStart = clockIn.isAfter(nightBlockStart) ? clockIn : nightBlockStart;
                LocalDateTime overlapEnd = clockOut.isBefore(nightBlockEnd) ? clockOut : nightBlockEnd;

                if (overlapStart.isBefore(overlapEnd)) {
                    nightMinutesForThis += (int) Duration.between(overlapStart, overlapEnd).toMinutes();
                }

                currentDate = currentDate.plusDays(1);
            }

            // 야간 비율만큼 휴게시간 비례 차감
            if (rawTotalMinutes > 0 && breakMin > 0 && nightMinutesForThis > 0) {
                int nightBreak = (int) ((long) breakMin * nightMinutesForThis / rawTotalMinutes);
                nightMinutesForThis = Math.max(0, nightMinutesForThis - nightBreak);
            }

            totalNightMinutes += nightMinutesForThis;
        }

        return totalNightMinutes;
    }

    // ========================================
    // 3. 기본급 계산
    // ========================================

    /**
     * 기본급 = 총 근무시간(분) × 시급 / 60
     */
    public long calculateBasicPay(int totalWorkMinutes, int hourlyWage) {
        return (long) totalWorkMinutes * hourlyWage / 60;
    }

    // ========================================
    // 4. 주휴수당 계산 (FR-PY-001) — 월 경계 보정 포함
    // ========================================

    /**
     * 주별 15시간 이상 근무 시 주휴수당 산출.
     * 주휴수당 = (주 소정근로시간(분) × 시급 × 8) / (40 × 60)
     *
     * @param attendances  월 경계를 포함한 확장 범위의 출퇴근 기록
     * @param hourlyWage   시급
     * @param targetMonth  정산 대상 월 (1일로 정규화된 값)
     */
    public long calculateWeeklyHolidayPay(List<Attendance> attendances, int hourlyWage,
                                           LocalDate targetMonth) {
        WeekFields weekFields = WeekFields.ISO;

        Map<String, List<Attendance>> weeklyGroups = groupByISOWeek(attendances);

        long totalHolidayPay = 0;

        for (List<Attendance> weekAttendances : weeklyGroups.values()) {
            // 해당 주의 월요일이 targetMonth에 속하는지 확인
            LocalDate monday = weekAttendances.stream()
                    .map(Attendance::getTargetDate)
                    .min(Comparator.naturalOrder())
                    .orElseThrow()
                    .with(weekFields.dayOfWeek(), 1);

            if (monday.getMonth() != targetMonth.getMonth()
                    || monday.getYear() != targetMonth.getYear()) {
                continue;
            }

            int weekMinutes = weekAttendances.stream()
                    .mapToInt(this::getActualWorkMinutes)
                    .sum();

            // 주 15시간(900분) 이상인 경우만
            if (weekMinutes >= props.getHolidayPayWeeklyThresholdMinutes()) {
                totalHolidayPay += (long) weekMinutes * hourlyWage * 8 / (40 * 60);
            }
        }

        return totalHolidayPay;
    }

    // ========================================
    // 5. 연장근무시간 및 연장수당 계산 (FR-PY-002)
    // ========================================

    /**
     * 연장근무시간(분)을 계산합니다.
     * 일 8시간 / 주 40시간 초과분을 합산하며, 중복 계산을 방지합니다.
     * 월 경계를 포함한 확장 범위 데이터를 받아, targetMonth에 속하는 주차만 계산합니다.
     *
     * @param attendances       월 경계를 포함한 확장 범위의 출퇴근 기록
     * @param isOver5Employees  5인 이상 사업장 여부
     * @param includeHolidayPay 5인 미만 사업장에서도 가산수당 지급 여부 (5인 이상이면 무시)
     * @param targetMonth       정산 대상 월 (1일로 정규화된 값)
     * @return 연장근무시간 (분)
     */
    public int calculateOvertimeMinutes(List<Attendance> attendances,
                                         boolean isOver5Employees, boolean includeHolidayPay,
                                         LocalDate targetMonth) {
        // 5인 미만 사업장이고 지급 옵션도 꺼져 있으면 → 면제
        if (!isOver5Employees && !includeHolidayPay) {
            return 0;
        }

        WeekFields weekFields = WeekFields.ISO;
        Map<String, List<Attendance>> weeklyGroups = groupByISOWeek(attendances);

        int totalOvertimeMinutes = 0;

        for (List<Attendance> weekAttendances : weeklyGroups.values()) {

            // 해당 주의 월요일이 targetMonth에 속하는 주차만 계산
            LocalDate monday = weekAttendances.stream()
                    .map(Attendance::getTargetDate)
                    .min(Comparator.naturalOrder())
                    .orElseThrow()
                    .with(weekFields.dayOfWeek(), 1);

            if (monday.getMonth() != targetMonth.getMonth()
                    || monday.getYear() != targetMonth.getYear()) {
                continue;
            }

            // 일별 8시간 초과분 합산
            Map<LocalDate, List<Attendance>> dailyGroups = weekAttendances.stream()
                    .collect(Collectors.groupingBy(Attendance::getTargetDate));

            int dailyOvertimeMinutes = 0;
            for (List<Attendance> dayAttendances : dailyGroups.values()) {
                int dayMinutes = dayAttendances.stream()
                        .mapToInt(this::getActualWorkMinutes)
                        .sum();
                if (dayMinutes > props.getOvertimeDailyThresholdMinutes()) {
                    dailyOvertimeMinutes += (dayMinutes - props.getOvertimeDailyThresholdMinutes());
                }
            }

            // 주 40시간 초과분
            int weekTotalMinutes = weekAttendances.stream()
                    .mapToInt(this::getActualWorkMinutes)
                    .sum();
            int weeklyExcess = Math.max(0,
                    weekTotalMinutes - props.getOvertimeWeeklyThresholdMinutes());

            // 주 초과분에서 일 초과분 차감 → 중복 방지
            int weeklyOnlyOvertime = Math.max(0, weeklyExcess - dailyOvertimeMinutes);

            totalOvertimeMinutes += dailyOvertimeMinutes + weeklyOnlyOvertime;
        }

        return totalOvertimeMinutes;
    }

    /**
     * 연장근로 가산수당을 계산합니다.
     * 내부적으로 calculateOvertimeMinutes()를 호출하여 연장근무시간(분)을 구한 뒤,
     * 시급의 50% 가산율을 적용합니다.
     *
     * @param attendances       월 경계를 포함한 확장 범위의 출퇴근 기록
     * @param hourlyWage        시급
     * @param isOver5Employees  5인 이상 사업장 여부
     * @param includeHolidayPay 5인 미만 사업장에서도 가산수당 지급 여부 (5인 이상이면 무시)
     * @param targetMonth       정산 대상 월 (1일로 정규화된 값)
     */
    public long calculateOvertimePay(List<Attendance> attendances, int hourlyWage,
                                     boolean isOver5Employees, boolean includeHolidayPay,
                                     LocalDate targetMonth) {
        int overtimeMinutes = calculateOvertimeMinutes(attendances, isOver5Employees, includeHolidayPay, targetMonth);
        return (long) overtimeMinutes * hourlyWage / (60 * 2);
    }

    // ========================================
    // 6. 야간수당 계산 (FR-PY-002)
    // ========================================

    /**
     * 야간수당 = 야간 근무시간(분) × 시급 / 60 / 2
     */
    public long calculateNightPay(int nightWorkMinutes, int hourlyWage) {
        return (long) nightWorkMinutes * hourlyWage / (60 * 2);
    }

    // ========================================
    // 7. 세금 공제 총액 (FR-PY-003)
    // ========================================

    /**
     * 총 지급액에서 세금 공제 총액을 계산합니다.
     */
    public long calculateDeduction(long grossPay, TaxType taxType) {
        return calculateDeductionDetails(grossPay, taxType).values().stream()
                .mapToLong(Long::longValue)
                .sum();
    }

    // ========================================
    // 8. 세금 공제 항목별 상세 (FR-PY-003)
    // ========================================

    /**
     * 공제 항목별 내역을 반환합니다.
     * LinkedHashMap으로 삽입 순서를 유지합니다.
     */
    public Map<String, Long> calculateDeductionDetails(long grossPay, TaxType taxType) {
        Map<String, Long> details = new LinkedHashMap<>();

        switch (taxType) {
            case INCOME_3_3 -> {
                // 국세청 원천징수 기준: 원 미만 절사
                details.put("소득세(3%)", (long) (grossPay * props.getIncomeTaxRate()));
                details.put("지방소득세(0.3%)", (long) (grossPay * props.getLocalIncomeTaxRate()));
            }
            case FOUR_INSURANCE -> {
                // 국민연금: 기준소득월액 상·하한 적용
                long pensionBase = clamp(grossPay,
                        props.getNationalPensionMin(), props.getNationalPensionMax());
                long nationalPension = (long) (pensionBase * props.getNationalPensionRate());

                // 건강보험: 보수월액 상·하한 적용
                long healthBase = clamp(grossPay,
                        props.getHealthInsuranceMin(), props.getHealthInsuranceMax());
                long healthInsurance = (long) (healthBase * props.getHealthInsuranceRate());

                // 장기요양: 건강보험료 기준
                long longTermCare = (long) (healthInsurance * props.getLongTermCareRate());

                // 고용보험: 상한 없음
                long employmentInsurance = (long) (grossPay * props.getEmploymentInsuranceRate());

                details.put("국민연금(4.75%)", nationalPension);
                details.put("건강보험(3.595%)", healthInsurance);
                details.put("장기요양보험(13.14%)", longTermCare);
                details.put("고용보험(0.9%)", employmentInsurance);
            }
            case NONE -> {
                // 미설정 → 공제 없음
            }
        }

        return details;
    }

    // ========================================
    // private 헬퍼
    // ========================================

    /**
     * 하나의 출퇴근 기록에서 실제 근무시간(분)을 계산합니다.
     * clockOut - clockIn - breakMinutes
     */
    private int getActualWorkMinutes(Attendance a) {
        int raw = (int) Duration.between(a.getClockIn(), a.getClockOut()).toMinutes();
        int breakMin = a.getBreakMinutes() != null ? a.getBreakMinutes() : 0;
        return Math.max(raw - breakMin, 0);
    }

    /**
     * 출퇴근 기록을 ISO 주차(월요일 시작) 기준으로 그룹핑합니다.
     * 주휴수당 계산과 연장수당 계산에서 공통으로 사용합니다.
     *
     * [정책] 월 경계 주차의 귀속 기준:
     * 해당 주의 "월요일"이 속한 월에 전액 귀속시킵니다.
     * 예) 3/30(월)~4/3(금) 주차 → 월요일이 3월이므로 3월 급여에 전액 포함.
     * 근로기준법상 소정근로일의 첫 날(월요일) 기준으로 귀속하는 일반적 방식이며,
     * 일할 계산 방식 대비 구현이 단순하고 월간 정합성이 유지됩니다.
     */
    private Map<String, List<Attendance>> groupByISOWeek(List<Attendance> attendances) {
        WeekFields weekFields = WeekFields.ISO;
        return attendances.stream()
                .collect(Collectors.groupingBy(a -> {
                    int year = a.getTargetDate().get(weekFields.weekBasedYear());
                    int week = a.getTargetDate().get(weekFields.weekOfWeekBasedYear());
                    return year + "-W" + week;
                }));
    }

    /**
     * 값을 min~max 범위로 제한합니다.
     * 4대 보험 기준소득월액 상·하한선 적용에 사용합니다.
     */
    private long clamp(long value, long min, long max) {
        return Math.max(min, Math.min(value, max));
    }
}
