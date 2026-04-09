package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.global.config.PayrollProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PayrollCalculationServiceTest {

    private PayrollCalculationService calculationService;

    @BeforeEach
    void setUp() {
        PayrollProperties props = new PayrollProperties();
        props.setNightStart("22:00");
        props.setNightEnd("06:00");
        props.setOvertimeDailyThresholdMinutes(480);
        props.setOvertimeWeeklyThresholdMinutes(2400);
        props.setHolidayPayWeeklyThresholdMinutes(900);
        props.setIncomeTaxRate(0.03);
        props.setLocalIncomeTaxRate(0.003);
        props.setNationalPensionRate(0.0475);
        props.setHealthInsuranceRate(0.03595);
        props.setLongTermCareRate(0.1314);
        props.setEmploymentInsuranceRate(0.009);
        props.setNationalPensionMin(390000L);
        props.setNationalPensionMax(6170000L);
        props.setHealthInsuranceMin(279300L);
        props.setHealthInsuranceMax(119625000L);

        calculationService = new PayrollCalculationService(props);
    }

    /**
     * 테스트용 Attendance 객체를 생성합니다.
     */
    private Attendance createAttendance(LocalDate date, int startHour, int endHour, int breakMinutes) {
        Attendance attendance = Attendance.builder()
                .targetDate(date)
                .scheduledStartTime(LocalTime.of(startHour, 0))
                .scheduledEndTime(LocalTime.of(endHour, 0))
                .build();
        ReflectionTestUtils.setField(attendance, "clockIn", date.atTime(startHour, 0));
        ReflectionTestUtils.setField(attendance, "clockOut", date.atTime(endHour, 0));
        ReflectionTestUtils.setField(attendance, "breakMinutes", breakMinutes);
        return attendance;
    }

    /**
     * 야간 근무를 포함하는 Attendance를 생성합니다 (자정을 넘기는 경우).
     */
    private Attendance createNightAttendance(LocalDate date, int startHour, int endHourNextDay, int breakMinutes) {
        Attendance attendance = Attendance.builder()
                .targetDate(date)
                .build();
        ReflectionTestUtils.setField(attendance, "clockIn", date.atTime(startHour, 0));
        ReflectionTestUtils.setField(attendance, "clockOut", date.plusDays(1).atTime(endHourNextDay, 0));
        ReflectionTestUtils.setField(attendance, "breakMinutes", breakMinutes);
        return attendance;
    }

    @Nested
    @DisplayName("기본급 계산")
    class BasicPayTest {

        @Test
        @DisplayName("총 근무시간 × 시급 ÷ 60 = 기본급 (정수 연산)")
        void calculateBasicPay() {
            // 8시간(480분) × 10,320원 / 60 = 82,560원
            long result = calculationService.calculateBasicPay(480, 10320);
            assertThat(result).isEqualTo(82560L);
        }

        @Test
        @DisplayName("근무시간 0분이면 기본급 0원")
        void calculateBasicPay_zero() {
            long result = calculationService.calculateBasicPay(0, 10320);
            assertThat(result).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("총 근무시간 계산")
    class TotalWorkMinutesTest {

        @Test
        @DisplayName("휴게시간이 차감된 실근무시간을 계산한다")
        void calculateTotalWorkMinutes_withBreak() {
            // 9시~18시(540분) - 휴게60분 = 480분
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 18, 60)
            );
            int result = calculationService.calculateTotalWorkMinutes(attendances);
            assertThat(result).isEqualTo(480);
        }

        @Test
        @DisplayName("여러 날의 근무시간을 합산한다")
        void calculateTotalWorkMinutes_multipleDays() {
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 18, 60),  // 480분
                    createAttendance(LocalDate.of(2026, 3, 17), 9, 14, 0)    // 300분
            );
            int result = calculationService.calculateTotalWorkMinutes(attendances);
            assertThat(result).isEqualTo(780);
        }
    }

    @Nested
    @DisplayName("주휴수당 계산 (FR-PY-001)")
    class WeeklyHolidayPayTest {

        @Test
        @DisplayName("주 15시간 이상 → 주휴수당 발생")
        void weeklyHolidayPay_over15h() {
            // 월~금 하루 4시간씩 = 주 20시간(1200분) → 15시간 이상
            // 주휴수당 = 1200 × 10320 × 8 / (40 × 60) = 41,280원
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 13, 0),  // 월 4h
                    createAttendance(LocalDate.of(2026, 3, 17), 9, 13, 0),  // 화 4h
                    createAttendance(LocalDate.of(2026, 3, 18), 9, 13, 0),  // 수 4h
                    createAttendance(LocalDate.of(2026, 3, 19), 9, 13, 0),  // 목 4h
                    createAttendance(LocalDate.of(2026, 3, 20), 9, 13, 0)   // 금 4h
            );
            // targetMonth = 3월 1일 (정규화된 값)
            long result = calculationService.calculateWeeklyHolidayPay(
                    attendances, 10320, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(41280L);
        }

        @Test
        @DisplayName("주 15시간 미만 → 주휴수당 = 0")
        void weeklyHolidayPay_under15h() {
            // 주 2일 × 3시간 = 6시간 → 15시간 미만
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 12, 0),  // 월 3h
                    createAttendance(LocalDate.of(2026, 3, 17), 9, 12, 0)   // 화 3h
            );
            long result = calculationService.calculateWeeklyHolidayPay(
                    attendances, 10320, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(0L);
        }

        @Test
        @DisplayName("월 경계 주차 — 월요일이 해당 월이면 포함")
        void weeklyHolidayPay_monthBoundary_included() {
            // 3/30(월)~4/3(금) 하루 4시간씩 → 주 20시간 → 월요일이 3월 → 3월에 포함
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 30), 9, 13, 0),  // 월 4h
                    createAttendance(LocalDate.of(2026, 3, 31), 9, 13, 0),  // 화 4h
                    createAttendance(LocalDate.of(2026, 4, 1), 9, 13, 0),   // 수 4h
                    createAttendance(LocalDate.of(2026, 4, 2), 9, 13, 0),   // 목 4h
                    createAttendance(LocalDate.of(2026, 4, 3), 9, 13, 0)    // 금 4h
            );
            long result = calculationService.calculateWeeklyHolidayPay(
                    attendances, 10320, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(41280L);
        }

        @Test
        @DisplayName("월 경계 주차 — 월요일이 전월이면 제외")
        void weeklyHolidayPay_monthBoundary_excluded() {
            // 2/23(월)~2/27(금) 하루 4시간씩 → 월요일이 2월 → 3월 계산 시 제외
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 2, 23), 9, 13, 0),
                    createAttendance(LocalDate.of(2026, 2, 24), 9, 13, 0),
                    createAttendance(LocalDate.of(2026, 2, 25), 9, 13, 0),
                    createAttendance(LocalDate.of(2026, 2, 26), 9, 13, 0),
                    createAttendance(LocalDate.of(2026, 2, 27), 9, 13, 0)
            );
            long result = calculationService.calculateWeeklyHolidayPay(
                    attendances, 10320, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("연장수당 계산 (FR-PY-002)")
    class OvertimePayTest {

        @Test
        @DisplayName("일 8시간 초과 → 가산수당 발생")
        void overtimePay_over8h() {
            // 9시~20시(660분) - 휴게60분 = 실근무 10시간 → 2시간(120분) 초과
            // 연장수당 = 120 × 10320 / (60 × 2) = 10,320원
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 20, 60)
            );
            long result = calculationService.calculateOvertimePay(attendances, 10320, true, false, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(10320L);
        }

        @Test
        @DisplayName("5인 미만 + includeHolidayPay=false → 0원")
        void overtimePay_under5_noInclude() {
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 20, 60)
            );
            long result = calculationService.calculateOvertimePay(attendances, 10320, false, false, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(0L);
        }

        @Test
        @DisplayName("5인 미만 + includeHolidayPay=true → 가산수당 발생")
        void overtimePay_under5_include() {
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 20, 60)
            );
            long result = calculationService.calculateOvertimePay(attendances, 10320, false, true, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(10320L);
        }

        @Test
        @DisplayName("주 40시간 초과만 있는 케이스")
        void overtimePay_weeklyOnly() {
            // 하루 7시간 × 6일(월~토) = 42시간 → 일 초과 0, 주 초과 120분
            // 연장수당 = 120 × 10320 / (60 × 2) = 10,320원
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 16, 0),  // 월 7h
                    createAttendance(LocalDate.of(2026, 3, 17), 9, 16, 0),  // 화 7h
                    createAttendance(LocalDate.of(2026, 3, 18), 9, 16, 0),  // 수 7h
                    createAttendance(LocalDate.of(2026, 3, 19), 9, 16, 0),  // 목 7h
                    createAttendance(LocalDate.of(2026, 3, 20), 9, 16, 0),  // 금 7h
                    createAttendance(LocalDate.of(2026, 3, 21), 9, 16, 0)   // 토 7h
            );
            long result = calculationService.calculateOvertimePay(attendances, 10320, true, false, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(10320L);
        }

        @Test
        @DisplayName("일 + 주 중복 케이스 → 일 초과분 우선 차감으로 중복 방지")
        void overtimePay_dailyAndWeekly_overlap() {
            // 하루 9시간 × 5일 = 45시간
            // 일 초과: 5일 × 60분 = 300분
            // 주 초과: 45h - 40h = 300분
            // 주에서만 발생한 초과: max(0, 300 - 300) = 0분 → 중복 제거
            // 최종 연장: 300분
            // 연장수당 = 300 × 10320 / (60 × 2) = 25,800원
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 18, 0),  // 월 9h
                    createAttendance(LocalDate.of(2026, 3, 17), 9, 18, 0),  // 화 9h
                    createAttendance(LocalDate.of(2026, 3, 18), 9, 18, 0),  // 수 9h
                    createAttendance(LocalDate.of(2026, 3, 19), 9, 18, 0),  // 목 9h
                    createAttendance(LocalDate.of(2026, 3, 20), 9, 18, 0)   // 금 9h
            );
            long result = calculationService.calculateOvertimePay(attendances, 10320, true, false, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(25800L);
        }

        @Test
        @DisplayName("일 초과 < 주 초과 케이스 → 주에서만 발생한 추가 연장분 포함")
        void overtimePay_weeklyExceedsDailyOvertime() {
            // 하루 9시간 × 5일 + 토 4시간 = 49시간
            // 일 초과: 5일 × 60분 = 300분
            // 주 초과: 49h - 40h = 540분
            // 주에서만 발생한 초과: max(0, 540 - 300) = 240분
            // 최종 연장: 300 + 240 = 540분
            // 연장수당 = 540 × 10320 / (60 × 2) = 46,440원
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 18, 0),  // 월 9h
                    createAttendance(LocalDate.of(2026, 3, 17), 9, 18, 0),  // 화 9h
                    createAttendance(LocalDate.of(2026, 3, 18), 9, 18, 0),  // 수 9h
                    createAttendance(LocalDate.of(2026, 3, 19), 9, 18, 0),  // 목 9h
                    createAttendance(LocalDate.of(2026, 3, 20), 9, 18, 0),  // 금 9h
                    createAttendance(LocalDate.of(2026, 3, 21), 9, 13, 0)   // 토 4h
            );
            long result = calculationService.calculateOvertimePay(attendances, 10320, true, false, LocalDate.of(2026, 3, 1));
            assertThat(result).isEqualTo(46440L);
        }
    }

    @Nested
    @DisplayName("야간수당 계산")
    class NightPayTest {

        @Test
        @DisplayName("22~06시 구간 근무 → 야간시간 산출")
        void nightWorkMinutes_nightShift() {
            // 18시~02시(다음날) → 야간구간 22:00~02:00 = 240분
            // 휴게 0분 → 차감 없음 → 야간 240분
            List<Attendance> attendances = List.of(
                    createNightAttendance(LocalDate.of(2026, 3, 16), 18, 2, 0)
            );
            int result = calculationService.calculateNightWorkMinutes(attendances);
            assertThat(result).isEqualTo(240);
        }

        @Test
        @DisplayName("야간수당 = 야간시간 × 시급 ÷ 60 ÷ 2 (정수 연산)")
        void nightPay_calculation() {
            // 240분 × 10320 / (60 × 2) = 20,640원
            long result = calculationService.calculateNightPay(240, 10320);
            assertThat(result).isEqualTo(20640L);
        }

        @Test
        @DisplayName("야간 구간 없는 근무 → 야간시간 0분")
        void nightWorkMinutes_dayShift() {
            List<Attendance> attendances = List.of(
                    createAttendance(LocalDate.of(2026, 3, 16), 9, 18, 60)
            );
            int result = calculationService.calculateNightWorkMinutes(attendances);
            assertThat(result).isEqualTo(0);
        }

        @Test
        @DisplayName("야간 근무 + 휴게시간 비례 차감")
        void nightWorkMinutes_withBreakProration() {
            // 18:00~02:00(480분), 휴게 60분
            // 야간 구간: 22:00~02:00 = 240분
            // 야간 비율: 240 / 480 = 50%
            // 야간 휴게: 60 × 240 / 480 = 30분
            // 실제 야간: 240 - 30 = 210분
            List<Attendance> attendances = List.of(
                    createNightAttendance(LocalDate.of(2026, 3, 16), 18, 2, 60)
            );
            int result = calculationService.calculateNightWorkMinutes(attendances);
            assertThat(result).isEqualTo(210);
        }
    }

    @Nested
    @DisplayName("세금 공제 (FR-PY-003)")
    class DeductionTest {

        @Test
        @DisplayName("INCOME_3_3 → 총 지급액 × 3.3%")
        void deduction_income33() {
            long grossPay = 1_000_000L;
            long result = calculationService.calculateDeduction(grossPay, TaxType.INCOME_3_3);
            // 소득세 30,000 + 지방소득세 3,000 = 33,000
            assertThat(result).isEqualTo(33000L);
        }

        @Test
        @DisplayName("FOUR_INSURANCE → 4대 보험 합산 (상·하한 범위 내)")
        void deduction_fourInsurance() {
            long grossPay = 1_000_000L;
            Map<String, Long> details = calculationService.calculateDeductionDetails(grossPay, TaxType.FOUR_INSURANCE);

            assertThat(details.get("국민연금(4.75%)")).isEqualTo(47500L);
            assertThat(details.get("건강보험(3.595%)")).isEqualTo(35950L);
            assertThat(details.get("장기요양보험(13.14%)")).isEqualTo(4723L);  // 35950 × 0.1314 = 4723.83 → 절사
            assertThat(details.get("고용보험(0.9%)")).isEqualTo(9000L);
        }

        @Test
        @DisplayName("FOUR_INSURANCE → grossPay < 하한 → 하한 기준 보험료")
        void deduction_fourInsurance_belowMin() {
            long grossPay = 300_000L;  // 국민연금 하한 390,000원보다 작음
            Map<String, Long> details = calculationService.calculateDeductionDetails(grossPay, TaxType.FOUR_INSURANCE);

            // 국민연금: clamp(300000, 390000, 6170000) = 390,000 × 4.75% = 18,525
            assertThat(details.get("국민연금(4.75%)")).isEqualTo(18525L);
            // 건강보험: clamp(300000, 279300, 119625000) = 300,000 × 3.595% = 10,785
            assertThat(details.get("건강보험(3.595%)")).isEqualTo(10785L);
        }

        @Test
        @DisplayName("FOUR_INSURANCE → grossPay > 상한 → 상한 기준 보험료")
        void deduction_fourInsurance_aboveMax() {
            long grossPay = 7_000_000L;  // 국민연금 상한 6,170,000원보다 큼
            Map<String, Long> details = calculationService.calculateDeductionDetails(grossPay, TaxType.FOUR_INSURANCE);

            // 국민연금: clamp(7000000, 390000, 6170000) = 6,170,000 × 4.75% = 293,075
            assertThat(details.get("국민연금(4.75%)")).isEqualTo(293075L);
            // 건강보험: clamp(7000000, 279300, 119625000) = 7,000,000 × 3.595% = 251,650
            assertThat(details.get("건강보험(3.595%)")).isEqualTo(251650L);
        }

        @Test
        @DisplayName("NONE → 공제 0원")
        void deduction_none() {
            long result = calculationService.calculateDeduction(1_000_000L, TaxType.NONE);
            assertThat(result).isEqualTo(0L);
        }
    }
}
