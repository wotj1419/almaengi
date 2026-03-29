package com.almaengi.be.domain.attendance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import com.almaengi.be.domain.store.type.DayOfWeek;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import com.almaengi.be.domain.attendance.dto.AttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.dto.AttendanceRequestDto;
import com.almaengi.be.domain.attendance.dto.AttendanceResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardDetailResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardSummaryResponseDto;
import com.almaengi.be.domain.attendance.dto.MonthlyAttendanceReportResponseDto;
import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.attendance.type.AttendanceResultType;
import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.store.entity.WorkSchedule;
import com.almaengi.be.domain.store.repository.WorkScheduleRepository;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;

@ExtendWith(MockitoExtension.class)
@DisplayName("AttendanceService 단위 테스트")
class AttendanceServiceTest {

    @InjectMocks
    private AttendanceService attendanceService;

    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private WorkScheduleRepository workScheduleRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private SetOperations<String, String> setOperations;

    private Store store;
    private User owner;
    private User user;
    private StoreEmployee employee;

    private static final double STORE_LAT = 37.5665;
    private static final double STORE_LON = 126.9780;
    private static final double NEAR_LAT = 37.5666;
    private static final double NEAR_LON = 126.9781;
    private static final double FAR_LAT = 37.5765;
    private static final double FAR_LON = 126.9880;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .loginType(LoginType.LOCAL)
                .name("김사장")
                .email("owner@test.com")
                .build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        store = Store.builder()
                .owner(owner)
                .name("알맹이 편의점")
                .address("서울시 강남구")
                .qrCode("almaengi_store_test123")
                .latitude(STORE_LAT)
                .longitude(STORE_LON)
                .build();
        ReflectionTestUtils.setField(store, "id", 1L);

        user = User.builder()
                .loginType(LoginType.LOCAL)
                .name("김알바")
                .phone("010-1234-5678")
                .email("alba@test.com")
                .build();
        ReflectionTestUtils.setField(user, "id", 100L);

        employee = StoreEmployee.builder().store(store).user(user).build();
        ReflectionTestUtils.setField(employee, "id", 10L);
    }

    private AttendanceRequestDto createRequest(double lat, double lon, Boolean overtimeConfirm) {
        AttendanceRequestDto req = new AttendanceRequestDto();
        ReflectionTestUtils.setField(req, "qrToken", "almaengi_store_test123");
        ReflectionTestUtils.setField(req, "latitude", lat);
        ReflectionTestUtils.setField(req, "longitude", lon);
        ReflectionTestUtils.setField(req, "overtimeConfirm", overtimeConfirm);
        return req;
    }

    private void stubRedis() {
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
    }

    @Nested
    @DisplayName("출근 (Clock In) 테스트")
    class ClockInTest {

        @Test
        @DisplayName("성공: Attendance 없는 직원이 출근하면 CLOCK_IN + WORKING")
        void clockInNewAttendance() {
            // given
            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.empty());
            when(workScheduleRepository.findFirstByEmployeeIdAndDayOfWeek(eq(10L), any(DayOfWeek.class)))
                    .thenReturn(Optional.empty());
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> {
                Attendance a = inv.getArgument(0);
                ReflectionTestUtils.setField(a, "id", 1L);
                return a;
            });
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then
            assertThat(res.getType()).isEqualTo(AttendanceResultType.CLOCK_IN);
            assertThat(res.getStatus()).isEqualTo(AttendanceStatus.WORKING);
            assertThat(res.getMessage()).isEqualTo("출근이 기록되었습니다.");
            verify(attendanceRepository, times(1)).save(any(Attendance.class));
            verify(setOperations, times(1)).add(eq("store:1:working"), eq("10"));
        }

        @Test
        @DisplayName("성공: Attendance 없지만 스케줄이 있는 직원이 출근하면 스케줄 시간이 설정된다")
        void clockInNewAttendanceWithSchedule() {
            // given
            WorkSchedule schedule = WorkSchedule.builder()
                    .employee(employee)
                    .dayOfWeek(DayOfWeek.from(LocalDate.now().getDayOfWeek().getValue() % 7))
                    .startTime(LocalTime.of(23, 59))
                    .endTime(LocalTime.of(23, 59))
                    .breakMinutes(0)
                    .build();

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.empty());
            when(workScheduleRepository.findFirstByEmployeeIdAndDayOfWeek(eq(10L), any(DayOfWeek.class)))
                    .thenReturn(Optional.of(schedule));
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> {
                Attendance a = inv.getArgument(0);
                ReflectionTestUtils.setField(a, "id", 1L);
                return a;
            });
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then: 스케줄 시간이 반영되었는지 엔티티 캡처로 확인
            assertThat(res.getType()).isEqualTo(AttendanceResultType.CLOCK_IN);
            assertThat(res.getStatus()).isEqualTo(AttendanceStatus.WORKING);
            verify(attendanceRepository).save(argThat(a ->
                    a.getScheduledStartTime() != null
                    && a.getScheduledStartTime().equals(LocalTime.of(23, 59))
                    && a.getScheduledEndTime() != null
                    && a.getScheduledEndTime().equals(LocalTime.of(23, 59))
            ));
        }

        @Test
        @DisplayName("성공: 정상 출근 시 DB 엔티티 status가 WORKING으로 설정된다")
        void clockInSetsEntityStatusToWorking() {
            // given
            Attendance waiting = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(LocalTime.of(23, 59))
                    .scheduledEndTime(LocalTime.of(23, 59))
                    .status(AttendanceStatus.WAITING)
                    .build();
            ReflectionTestUtils.setField(waiting, "id", 2L);

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(waiting));
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when
            attendanceService.recordAttendance(100L, req);

            // then: 응답 DTO가 아닌 실제 엔티티의 status 확인
            assertThat(waiting.getStatus()).isEqualTo(AttendanceStatus.WORKING);
            assertThat(waiting.getClockIn()).isNotNull();
        }

        @Test
        @DisplayName("성공: 스케줄러가 만든 WAITING 레코드에 출근 처리")
        void clockInExistingWaiting() {
            // given
            Attendance waiting = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(LocalTime.of(23, 59))
                    .scheduledEndTime(LocalTime.of(23, 59))
                    .status(AttendanceStatus.WAITING)
                    .build();
            ReflectionTestUtils.setField(waiting, "id", 2L);

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(waiting));
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then
            assertThat(res.getType()).isEqualTo(AttendanceResultType.CLOCK_IN);
            assertThat(res.getStatus()).isEqualTo(AttendanceStatus.WORKING);
            assertThat(waiting.getClockIn()).isNotNull();
        }

        @Test
        @DisplayName("성공: 출근시각 경과 후 출근하면 DB status=LATE, Redis는 working 추가 + late 제거")
        void clockInLate() {
            // given
            Attendance lateRecord = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(LocalTime.of(0, 0))
                    .scheduledEndTime(LocalTime.of(23, 59))
                    .status(AttendanceStatus.LATE)
                    .build();
            ReflectionTestUtils.setField(lateRecord, "id", 3L);

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(lateRecord));
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then
            assertThat(res.getType()).isEqualTo(AttendanceResultType.CLOCK_IN);
            assertThat(res.getStatus()).isEqualTo(AttendanceStatus.LATE);
            verify(setOperations, times(1)).add(eq("store:1:working"), eq("10"));
            verify(setOperations, times(1)).remove(eq("store:1:late"), eq("10"));
        }
    }

    @Nested
    @DisplayName("퇴근 (Clock Out) 테스트")
    class ClockOutTest {

        @Test
        @DisplayName("성공: 정상 퇴근 (퇴근시각 이전)")
        void clockOutNormal() {
            // given
            Attendance working = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(LocalTime.of(0, 0))
                    .scheduledEndTime(LocalTime.of(23, 59))
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(working, "id", 4L);
            working.clockIn(LocalDateTime.now().minusHours(8));

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(working));
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then
            assertThat(res.getType()).isEqualTo(AttendanceResultType.CLOCK_OUT);
            assertThat(res.getOvertime()).isFalse();
            assertThat(res.getMessage()).isEqualTo("퇴근이 기록되었습니다.");
            verify(setOperations, times(1)).remove(eq("store:1:working"), eq("10"));
        }

        @Test
        @DisplayName("성공: 연장근무 확인 후 퇴근 (overtimeConfirm=true)")
        void clockOutWithOvertimeConfirm() {
            // given
            Attendance working = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(LocalTime.of(0, 0))
                    .scheduledEndTime(LocalTime.of(0, 0))
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(working, "id", 5L);
            working.clockIn(LocalDateTime.now().minusHours(10));

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(working));
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, true);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then
            assertThat(res.getType()).isEqualTo(AttendanceResultType.CLOCK_OUT);
            assertThat(res.getOvertime()).isTrue();
        }

        @Test
        @DisplayName("성공: 연장근무 거절 (overtimeConfirm=false) 시 overtime=false로 저장")
        void clockOutOvertimeDeclined() {
            // given
            Attendance working = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(LocalTime.of(0, 0))
                    .scheduledEndTime(LocalTime.of(0, 0))
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(working, "id", 8L);
            working.clockIn(LocalDateTime.now().minusHours(10));

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(working));
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, false);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then
            assertThat(res.getType()).isEqualTo(AttendanceResultType.CLOCK_OUT);
            assertThat(res.getOvertime()).isFalse();
            assertThat(working.getOvertime()).isFalse();
            assertThat(working.getClockOut()).isNotNull();
        }

        @Test
        @DisplayName("성공: scheduledEndTime이 null이면 연장근무 판정 없이 정상 퇴근")
        void clockOutWithNullScheduledEndTime() {
            // given
            Attendance working = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(null)
                    .scheduledEndTime(null)
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(working, "id", 9L);
            working.clockIn(LocalDateTime.now().minusHours(8));

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(working));
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));
            stubRedis();

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then: OVERTIME_CHECK가 아닌 바로 CLOCK_OUT
            assertThat(res.getType()).isEqualTo(AttendanceResultType.CLOCK_OUT);
            assertThat(res.getOvertime()).isFalse();
            assertThat(working.getClockOut()).isNotNull();
        }

        @Test
        @DisplayName("성공: 퇴근시각 경과 + overtimeConfirm 없으면 OVERTIME_CHECK 응답 (저장 안 함)")
        void overtimeCheckResponse() {
            // given
            Attendance working = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(LocalTime.of(0, 0))
                    .scheduledEndTime(LocalTime.of(0, 0))
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(working, "id", 6L);
            working.clockIn(LocalDateTime.now().minusHours(10));

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(working));

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when
            AttendanceResponseDto res = attendanceService.recordAttendance(100L, req);

            // then
            assertThat(res.getType()).isEqualTo(AttendanceResultType.OVERTIME_CHECK);
            assertThat(res.getOvertime()).isTrue();
            assertThat(res.getClockOut()).isNull();
            assertThat(res.getMessage()).isEqualTo("연장근무 확인이 필요합니다.");
            verify(attendanceRepository, never()).save(any(Attendance.class));
        }
    }

    @Nested
    @DisplayName("검증 실패 테스트")
    class ValidationFailTest {

        @Test
        @DisplayName("실패: 유효하지 않은 QR 토큰이면 INVALID_QR_TOKEN")
        void failInvalidQrToken() {
            // given
            when(storeRepository.findByQrCode(any())).thenReturn(Optional.empty());

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.recordAttendance(100L, req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_QR_TOKEN);
        }

        @Test
        @DisplayName("실패: GPS 100m 초과이면 GPS_OUT_OF_RANGE")
        void failGpsOutOfRange() {
            // given
            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));

            AttendanceRequestDto req = createRequest(FAR_LAT, FAR_LON, null);

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.recordAttendance(100L, req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.GPS_OUT_OF_RANGE);
        }

        @Test
        @DisplayName("실패: 해당 매장 직원이 아니면 STORE_EMPLOYEE_NOT_FOUND")
        void failEmployeeNotFound() {
            // given
            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 999L)).thenReturn(Optional.empty());

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.recordAttendance(999L, req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.STORE_EMPLOYEE_NOT_FOUND);
        }

        @Test
        @DisplayName("실패: 이미 퇴근 완료된 상태이면 ALREADY_CLOCKED_OUT")
        void failAlreadyClockedOut() {
            // given
            Attendance done = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(done, "id", 7L);
            done.clockIn(LocalDateTime.now().minusHours(8));
            done.clockOut(LocalDateTime.now().minusHours(1));

            when(storeRepository.findByQrCode("almaengi_store_test123")).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findByStoreIdAndUserId(1L, 100L)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndTargetDate(eq(10L), any(LocalDate.class)))
                    .thenReturn(Optional.of(done));

            AttendanceRequestDto req = createRequest(NEAR_LAT, NEAR_LON, null);

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.recordAttendance(100L, req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.ALREADY_CLOCKED_OUT);
        }
    }

    @Nested
    @DisplayName("대시보드 요약 (getDashboardSummary) 테스트")
    class DashboardSummaryTest {

        @Test
        @DisplayName("성공: Redis SCARD로 working/late/absent 카운트 반환")
        void summaryReturnsCorrectCounts() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
            stubRedis();
            when(setOperations.size("store:1:working")).thenReturn(3L);
            when(setOperations.size("store:1:late")).thenReturn(1L);
            when(setOperations.size("store:1:absent")).thenReturn(0L);

            // when
            DashboardSummaryResponseDto res = attendanceService.getDashboardSummary(1L, 1L);

            // then
            assertThat(res.getWorking()).isEqualTo(3L);
            assertThat(res.getLate()).isEqualTo(1L);
            assertThat(res.getAbsent()).isEqualTo(0L);
        }

        @Test
        @DisplayName("성공: Redis 키가 없으면 (null) 0 반환")
        void summaryReturnsZeroWhenKeysNotExist() {
            // given
            Store store99 = Store.builder()
                    .owner(owner)
                    .name("다른매장")
                    .address("서울시 서초구")
                    .qrCode("qr_99")
                    .build();
            ReflectionTestUtils.setField(store99, "id", 99L);
            when(storeRepository.findById(99L)).thenReturn(Optional.of(store99));
            stubRedis();
            when(setOperations.size("store:99:working")).thenReturn(null);
            when(setOperations.size("store:99:late")).thenReturn(null);
            when(setOperations.size("store:99:absent")).thenReturn(null);

            // when
            DashboardSummaryResponseDto res = attendanceService.getDashboardSummary(1L, 99L);

            // then
            assertThat(res.getWorking()).isEqualTo(0L);
            assertThat(res.getLate()).isEqualTo(0L);
            assertThat(res.getAbsent()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("상태별 직원 목록 (getDashboardDetail) 테스트")
    class DashboardDetailTest {

        @Test
        @DisplayName("성공: Redis SMEMBERS + DB JOIN FETCH로 직원 정보 반환")
        void detailReturnsEmployeeInfo() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
            stubRedis();
            when(setOperations.members("store:1:working")).thenReturn(Set.of("10"));

            Attendance attendance = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.now())
                    .scheduledStartTime(LocalTime.of(9, 0))
                    .scheduledEndTime(LocalTime.of(18, 0))
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(attendance, "id", 1L);

            when(attendanceRepository.findByEmployeeIdInAndTargetDateWithUser(
                    eq(List.of(10L)), any(LocalDate.class)))
                    .thenReturn(List.of(attendance));

            // when
            DashboardDetailResponseDto res = attendanceService.getDashboardDetail(1L, 1L, "working");

            // then
            assertThat(res.getStatus()).isEqualTo("WORKING");
            assertThat(res.getEmployees()).hasSize(1);

            DashboardDetailResponseDto.DashboardEmployeeDto emp = res.getEmployees().get(0);
            assertThat(emp.getEmployeeId()).isEqualTo(10L);
            assertThat(emp.getUserName()).isEqualTo("김알바");
            assertThat(emp.getPhone()).isEqualTo("010-1234-5678");
            assertThat(emp.getScheduledStartTime()).isEqualTo(LocalTime.of(9, 0));
            assertThat(emp.getScheduledEndTime()).isEqualTo(LocalTime.of(18, 0));
        }

        @Test
        @DisplayName("성공: Redis SET이 비어있으면 빈 리스트 반환")
        void detailReturnsEmptyWhenNoMembers() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
            stubRedis();
            when(setOperations.members("store:1:late")).thenReturn(Set.of());

            // when
            DashboardDetailResponseDto res = attendanceService.getDashboardDetail(1L, 1L, "late");

            // then
            assertThat(res.getStatus()).isEqualTo("LATE");
            assertThat(res.getEmployees()).isEmpty();
            verify(attendanceRepository, never()).findByEmployeeIdInAndTargetDateWithUser(any(), any());
        }

        @Test
        @DisplayName("성공: Redis SET이 null이면 빈 리스트 반환")
        void detailReturnsEmptyWhenNull() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
            stubRedis();
            when(setOperations.members("store:1:absent")).thenReturn(null);

            // when
            DashboardDetailResponseDto res = attendanceService.getDashboardDetail(1L, 1L, "absent");

            // then
            assertThat(res.getStatus()).isEqualTo("ABSENT");
            assertThat(res.getEmployees()).isEmpty();
        }

        @Test
        @DisplayName("성공: Redis에 ID가 있지만 DB 조회 결과가 비어있으면 빈 리스트 반환")
        void detailReturnsEmptyWhenDbMismatch() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
            stubRedis();
            when(setOperations.members("store:1:working")).thenReturn(Set.of("999"));
            when(attendanceRepository.findByEmployeeIdInAndTargetDateWithUser(
                    eq(List.of(999L)), any(LocalDate.class)))
                    .thenReturn(List.of());

            // when
            DashboardDetailResponseDto res = attendanceService.getDashboardDetail(1L, 1L, "working");

            // then
            assertThat(res.getStatus()).isEqualTo("WORKING");
            assertThat(res.getEmployees()).isEmpty();
        }

        @Test
        @DisplayName("실패: 유효하지 않은 status이면 INVALID_DASHBOARD_STATUS")
        void failInvalidStatus() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.getDashboardDetail(1L, 1L, "invalid"));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_DASHBOARD_STATUS);
        }
    }

    @Nested
    @DisplayName("일별 근태 로그 조회 (getAttendanceLog) 테스트")
    class AttendanceLogTest {

        @Test
        @DisplayName("성공: 특정 날짜의 근태 기록을 반환한다")
        void getAttendanceLogSuccess() {
            // given
            LocalDate yesterday = LocalDate.now().minusDays(1);
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

            Attendance attendance = Attendance.builder()
                    .employee(employee)
                    .targetDate(yesterday)
                    .scheduledStartTime(LocalTime.of(9, 0))
                    .scheduledEndTime(LocalTime.of(18, 0))
                    .status(AttendanceStatus.WORKING)
                    .overtime(false)
                    .build();
            ReflectionTestUtils.setField(attendance, "id", 1L);
            attendance.clockIn(yesterday.atTime(9, 5));
            attendance.clockOut(yesterday.atTime(18, 0));

            when(attendanceRepository.findByStoreIdAndTargetDateWithUser(1L, yesterday))
                    .thenReturn(List.of(attendance));

            // when
            AttendanceLogResponseDto res = attendanceService.getAttendanceLog(1L, 1L, yesterday);

            // then
            assertThat(res.getStoreId()).isEqualTo(1L);
            assertThat(res.getDate()).isEqualTo(yesterday);
            assertThat(res.getAttendances()).hasSize(1);

            AttendanceLogResponseDto.AttendanceLogDto log = res.getAttendances().get(0);
            assertThat(log.getEmployeeId()).isEqualTo(10L);
            assertThat(log.getEmployeeName()).isEqualTo("김알바");
            assertThat(log.getScheduledStartTime()).isEqualTo(LocalTime.of(9, 0));
            assertThat(log.getScheduledEndTime()).isEqualTo(LocalTime.of(18, 0));
            assertThat(log.getClockIn()).isEqualTo(yesterday.atTime(9, 5));
            assertThat(log.getClockOut()).isEqualTo(yesterday.atTime(18, 0));
            assertThat(log.getStatus()).isEqualTo("WORKING");
            assertThat(log.getOvertime()).isFalse();
        }

        @Test
        @DisplayName("성공: 근태 기록이 없으면 빈 리스트 반환")
        void getAttendanceLogEmpty() {
            // given
            LocalDate yesterday = LocalDate.now().minusDays(1);
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
            when(attendanceRepository.findByStoreIdAndTargetDateWithUser(1L, yesterday))
                    .thenReturn(List.of());

            // when
            AttendanceLogResponseDto res = attendanceService.getAttendanceLog(1L, 1L, yesterday);

            // then
            assertThat(res.getStoreId()).isEqualTo(1L);
            assertThat(res.getDate()).isEqualTo(yesterday);
            assertThat(res.getAttendances()).isEmpty();
        }

        @Test
        @DisplayName("실패: 오늘 날짜 조회 시 INVALID_ATTENDANCE_LOG_DATE")
        void failTodayDate() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.getAttendanceLog(1L, 1L, LocalDate.now()));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_ATTENDANCE_LOG_DATE);
        }

        @Test
        @DisplayName("실패: 미래 날짜 조회 시 INVALID_ATTENDANCE_LOG_DATE")
        void failFutureDate() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.getAttendanceLog(1L, 1L, LocalDate.now().plusDays(1)));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_ATTENDANCE_LOG_DATE);
        }

        @Test
        @DisplayName("실패: 존재하지 않는 매장이면 STORE_NOT_FOUND")
        void failStoreNotFound() {
            // given
            when(storeRepository.findById(999L)).thenReturn(Optional.empty());

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.getAttendanceLog(1L, 999L, LocalDate.now().minusDays(1)));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.STORE_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("월별 근태 리포트 (getMonthlyReport) 테스트")
    class MonthlyReportTest {

        @Test
        @DisplayName("성공: 직원별 출근수/지각수/결근수/근무시간을 집계하고 출근수 내림차순 정렬")
        void monthlyReportSuccess() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

            // 두 번째 직원 생성
            User user2 = User.builder()
                    .loginType(LoginType.LOCAL)
                    .name("이알바")
                    .email("alba2@test.com")
                    .build();
            ReflectionTestUtils.setField(user2, "id", 101L);
            StoreEmployee employee2 = StoreEmployee.builder().store(store).user(user2).build();
            ReflectionTestUtils.setField(employee2, "id", 11L);

            LocalDate targetMonth = LocalDate.of(2026, 3, 1);

            // 김알바: 출근 2회 (WORKING 1 + LATE 1), 결근 0
            Attendance a1 = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.of(2026, 3, 1))
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(a1, "id", 1L);
            a1.clockIn(LocalDateTime.of(2026, 3, 1, 9, 0));
            a1.clockOut(LocalDateTime.of(2026, 3, 1, 18, 0));

            Attendance a2 = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.of(2026, 3, 2))
                    .status(AttendanceStatus.LATE)
                    .build();
            ReflectionTestUtils.setField(a2, "id", 2L);
            a2.clockIn(LocalDateTime.of(2026, 3, 2, 9, 30));
            a2.clockOut(LocalDateTime.of(2026, 3, 2, 18, 0));

            // 이알바: 출근 1회, 결근 1회
            Attendance a3 = Attendance.builder()
                    .employee(employee2)
                    .targetDate(LocalDate.of(2026, 3, 1))
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(a3, "id", 3L);
            a3.clockIn(LocalDateTime.of(2026, 3, 1, 9, 0));
            a3.clockOut(LocalDateTime.of(2026, 3, 1, 18, 0));

            Attendance a4 = Attendance.builder()
                    .employee(employee2)
                    .targetDate(LocalDate.of(2026, 3, 2))
                    .status(AttendanceStatus.ABSENT)
                    .build();
            ReflectionTestUtils.setField(a4, "id", 4L);

            when(attendanceRepository.findByStoreIdAndTargetDateBetweenWithUser(
                    eq(1L), eq(targetMonth), eq(LocalDate.of(2026, 3, 31))))
                    .thenReturn(List.of(a1, a2, a3, a4));

            // when
            MonthlyAttendanceReportResponseDto res = attendanceService.getMonthlyReport(1L, 1L, targetMonth);

            // then
            assertThat(res.getTargetMonth()).isEqualTo("2026-03");
            assertThat(res.getEmployees()).hasSize(2);

            // 출근수 내림차순: 김알바(2) > 이알바(1)
            MonthlyAttendanceReportResponseDto.EmployeeAttendanceSummary first = res.getEmployees().get(0);
            assertThat(first.getEmployeeName()).isEqualTo("김알바");
            assertThat(first.getAttendanceCount()).isEqualTo(2);
            assertThat(first.getLateCount()).isEqualTo(1);
            assertThat(first.getAbsentCount()).isEqualTo(0);
            assertThat(first.getTotalWorkMinutes()).isGreaterThan(0);

            MonthlyAttendanceReportResponseDto.EmployeeAttendanceSummary second = res.getEmployees().get(1);
            assertThat(second.getEmployeeName()).isEqualTo("이알바");
            assertThat(second.getAttendanceCount()).isEqualTo(1);
            assertThat(second.getAbsentCount()).isEqualTo(1);

            // 성실왕: 김알바만 (결근 0)
            assertThat(res.getDiligentEmployees()).hasSize(1);
            assertThat(res.getDiligentEmployees().get(0).getEmployeeName()).isEqualTo("김알바");

            // 지각왕: 김알바 (지각 1회 > 이알바 0회)
            assertThat(res.getLateChampions()).hasSize(1);
            assertThat(res.getLateChampions().get(0).getEmployeeName()).isEqualTo("김알바");
        }

        @Test
        @DisplayName("성공: 전원 지각 0이면 지각왕 빈 리스트")
        void noLateChampionWhenAllZero() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

            LocalDate targetMonth = LocalDate.of(2026, 3, 1);

            Attendance a1 = Attendance.builder()
                    .employee(employee)
                    .targetDate(LocalDate.of(2026, 3, 1))
                    .status(AttendanceStatus.WORKING)
                    .build();
            ReflectionTestUtils.setField(a1, "id", 1L);
            a1.clockIn(LocalDateTime.of(2026, 3, 1, 9, 0));
            a1.clockOut(LocalDateTime.of(2026, 3, 1, 18, 0));

            when(attendanceRepository.findByStoreIdAndTargetDateBetweenWithUser(
                    eq(1L), eq(targetMonth), eq(LocalDate.of(2026, 3, 31))))
                    .thenReturn(List.of(a1));

            // when
            MonthlyAttendanceReportResponseDto res = attendanceService.getMonthlyReport(1L, 1L, targetMonth);

            // then
            assertThat(res.getLateChampions()).isEmpty();
            assertThat(res.getDiligentEmployees()).hasSize(1);
        }

        @Test
        @DisplayName("성공: 근태 기록이 없으면 모든 리스트가 빈 상태")
        void emptyReport() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

            LocalDate targetMonth = LocalDate.of(2026, 3, 1);
            when(attendanceRepository.findByStoreIdAndTargetDateBetweenWithUser(
                    eq(1L), eq(targetMonth), eq(LocalDate.of(2026, 3, 31))))
                    .thenReturn(List.of());

            // when
            MonthlyAttendanceReportResponseDto res = attendanceService.getMonthlyReport(1L, 1L, targetMonth);

            // then
            assertThat(res.getEmployees()).isEmpty();
            assertThat(res.getDiligentEmployees()).isEmpty();
            assertThat(res.getLateChampions()).isEmpty();
        }

        @Test
        @DisplayName("실패: 매장 소유자가 아니면 ATTENDANCE_STORE_NOT_OWNED")
        void failNotOwner() {
            // given
            when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

            // when & then (owner.id=1L이므로 999L은 권한 없음)
            BusinessException e = assertThrows(BusinessException.class,
                    () -> attendanceService.getMonthlyReport(999L, 1L, LocalDate.of(2026, 3, 1)));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.ATTENDANCE_STORE_NOT_OWNED);
        }
    }
}
