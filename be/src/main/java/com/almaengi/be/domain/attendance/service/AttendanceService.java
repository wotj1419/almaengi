package com.almaengi.be.domain.attendance.service;

import com.almaengi.be.domain.attendance.dto.AttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.dto.AttendanceRequestDto;
import com.almaengi.be.domain.attendance.dto.AttendanceResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardDetailResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardSummaryResponseDto;
import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.attendance.type.AttendanceResultType;
import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import com.almaengi.be.domain.attendance.util.GpsUtil;
import com.almaengi.be.domain.attendance.util.RedisKeyUtil;
import com.almaengi.be.domain.store.entity.WorkSchedule;
import com.almaengi.be.domain.store.repository.WorkScheduleRepository;
import com.almaengi.be.domain.store.type.DayOfWeek;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 출퇴근 비즈니스 로직을 담당하는 서비스입니다.
 *
 * 처리 흐름:
 *
 * 1. QR 토큰 → 매장 조회 → GPS 100m 검증 → 직원 조회
 * 2. 오늘 Attendance 유무 및 clockIn/clockOut 여부에 따라 출근/퇴근 분기
 * 3. 출근: clockIn 기록 + 지각 판정 + Redis working 추가
 * 4. 퇴근: clockOut 기록 + 연장근무 판정 + Redis working 제거
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StoreRepository storeRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final StringRedisTemplate redisTemplate;

    /**
     * GPS+QR 출퇴근 기록 처리.
     * Attendance 상태에 따라 출근(CLOCK_IN) 또는 퇴근(CLOCK_OUT)을 수행합니다.
     *
     * @param userId  인증된 사용자 ID
     * @param request QR 토큰, GPS 좌표, 연장근무 확인 값
     * @return 출퇴근 결과 DTO
     */
    @Transactional
    public AttendanceResponseDto recordAttendance(Long userId, AttendanceRequestDto request) {
        // 1. QR 토큰 → 매장 조회
        Store store = storeRepository.findByQrCode(request.getQrToken())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_QR_TOKEN));

        // 2. GPS 검증 (100m 이내)
        if (!GpsUtil.isWithinRange(request.getLatitude(), request.getLongitude(),
                store.getLatitude(), store.getLongitude())) {
            throw new BusinessException(ErrorCode.GPS_OUT_OF_RANGE);
        }

        // 3. 매장 직원 조회
        StoreEmployee employee = storeEmployeeRepository.findByStoreIdAndUserId(store.getId(), userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        // 3.5. 승인 대기 상태의 직원 차단
        if(employee.getStatus() == StoreEmployeeStatus.WAITING)
            throw new BusinessException(ErrorCode.INVALID_EMPLOYEE_STATUS);

        // 4. 오늘 Attendance 조회
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndTargetDate(employee.getId(), today)
                .orElse(null);

        // 5. 분기 처리:
        //    - 기록 없음 → 출근 (스케줄 없는 직원, Attendance 신규 생성)
        //    - clockIn=null → 출근 (스케줄러가 만든 WAITING/LATE 레코드)
        //    - clockOut=null → 퇴근
        //    - clockOut≠null → 이미 퇴근 완료
        if (attendance == null) {
            attendance = createAttendance(employee, today);
        }

        if (attendance.getClockIn() == null) {
            return clockIn(attendance);
        } else if (attendance.getClockOut() == null) {
            return clockOut(attendance, request.getOvertimeConfirm());
        } else {
            throw new BusinessException(ErrorCode.ALREADY_CLOCKED_OUT);
        }
    }

    /**
     * 스케줄 없는 직원의 출근 시 Attendance를 새로 생성합니다.
     */
    private Attendance createAttendance(StoreEmployee employee, LocalDate today) {
        DayOfWeek dayOfWeek = DayOfWeek.from(today.getDayOfWeek().getValue() % 7);
        WorkSchedule schedule = workScheduleRepository
                .findFirstByEmployeeIdAndDayOfWeek(employee.getId(), dayOfWeek)
                .orElse(null);

        return Attendance.builder()
                .employee(employee)
                .targetDate(today)
                .scheduledStartTime(schedule != null ? schedule.getStartTime() : null)
                .scheduledEndTime(schedule != null ? schedule.getEndTime() : null)
                .status(AttendanceStatus.WAITING)
                .build();
    }

    private AttendanceResponseDto clockIn(Attendance attendance) {
        LocalDateTime now = LocalDateTime.now();
        StoreEmployee employee = attendance.getEmployee();

        attendance.clockIn(now);

        // DB status: 지각이면 LATE 유지 (이력), 정상이면 WORKING
        // Redis: 지각 여부 관계없이 working 추가, late 제거 (현재 근무 상태 반영)
        if (attendance.getScheduledStartTime() != null
                && now.toLocalTime().isAfter(attendance.getScheduledStartTime())) {
            attendance.updateStatus(AttendanceStatus.LATE);
        } else {
            attendance.updateStatus(AttendanceStatus.WORKING);
        }

        attendanceRepository.save(attendance);

        Long storeId = employee.getStore().getId();
        String employeeIdStr = employee.getId().toString();
        redisTemplate.opsForSet().add(RedisKeyUtil.workingKey(storeId), employeeIdStr);
        redisTemplate.opsForSet().remove(RedisKeyUtil.lateKey(storeId), employeeIdStr);

        return AttendanceResponseDto.builder()
                .type(AttendanceResultType.CLOCK_IN)
                .attendanceId(attendance.getId())
                .clockIn(attendance.getClockIn())
                .clockOut(null)
                .status(attendance.getStatus())
                .overtime(attendance.getOvertime())
                .scheduledEndTime(attendance.getScheduledEndTime())
                .message("출근이 기록되었습니다.")
                .build();
    }

    // ========== 대시보드 API ==========

    /**
     * 대시보드 요약 조회.
     * Redis SCARD × 3으로 매장의 근무중/지각/결근 직원 수를 반환합니다.
     * DB 접근 없이 Redis만 사용합니다.
     *
     * @param userId  인증된 사용자 ID
     * @param storeId 매장 ID
     */
    public DashboardSummaryResponseDto getDashboardSummary(Long userId, Long storeId) {
        validateStoreOwner(userId, storeId);

        Long working = redisTemplate.opsForSet().size(RedisKeyUtil.workingKey(storeId));
        Long late = redisTemplate.opsForSet().size(RedisKeyUtil.lateKey(storeId));
        Long absent = redisTemplate.opsForSet().size(RedisKeyUtil.absentKey(storeId));

        return DashboardSummaryResponseDto.builder()
                .working(working != null ? working : 0L)
                .late(late != null ? late : 0L)
                .absent(absent != null ? absent : 0L)
                .build();
    }

    /**
     * 상태별 직원 목록 조회.
     * Redis SMEMBERS로 employee ID 목록을 가져온 뒤,
     * DB에서 Attendance + StoreEmployee + User를 JOIN FETCH하여 직원 정보를 반환합니다.
     *
     * @param userId  인증된 사용자 ID
     * @param storeId 매장 ID
     * @param status  조회할 상태 (working, late, absent)
     */
    public DashboardDetailResponseDto getDashboardDetail(Long userId, Long storeId, String status) {
        validateStoreOwner(userId, storeId);
        // status 검증 (working/late/absent 외 → 예외)
        if (!Set.of("working", "late", "absent").contains(status)) {
            throw new BusinessException(ErrorCode.INVALID_DASHBOARD_STATUS);
        }

        // Redis SMEMBERS: 해당 상태의 employee ID 목록 조회
        Set<String> memberIds = redisTemplate.opsForSet().members(RedisKeyUtil.storeKey(storeId, status));

        if (memberIds == null || memberIds.isEmpty()) {
            return DashboardDetailResponseDto.builder()
                    .status(status.toUpperCase())
                    .employees(List.of())
                    .build();
        }

        // String → Long 변환 (Redis는 문자열, DB 쿼리는 Long 필요)
        List<Long> employeeIds = memberIds.stream()
                .map(Long::valueOf)
                .collect(Collectors.toList());

        // DB 조회: Attendance → StoreEmployee → User JOIN FETCH (1회 쿼리)
        LocalDate today = LocalDate.now();
        List<Attendance> attendances = attendanceRepository
                .findByEmployeeIdInAndTargetDateWithUser(employeeIds, today);

        // DTO 매핑
        List<DashboardDetailResponseDto.DashboardEmployeeDto> employees = attendances.stream()
                .map(a -> DashboardDetailResponseDto.DashboardEmployeeDto.builder()
                        .employeeId(a.getEmployee().getId())
                        .userName(a.getEmployee().getUser().getName())
                        .phone(a.getEmployee().getUser().getPhone())
                        .scheduledStartTime(a.getScheduledStartTime())
                        .scheduledEndTime(a.getScheduledEndTime())
                        .build())
                .collect(Collectors.toList());

        return DashboardDetailResponseDto.builder()
                .status(status.toUpperCase())
                .employees(employees)
                .build();
    }

    // ========== 근태 로그 조회 ==========

    /**
     * 근태 로그 조회.
     * 특정 매장의 특정 날짜 근태 기록을 반환합니다.
     * 당일은 조회 불가 — 전일까지만 허용합니다.
     *
     * @param userId  인증된 사용자 ID
     * @param storeId 매장 ID
     * @param date    조회 날짜 (오늘 미만만 허용)
     */
    public AttendanceLogResponseDto getAttendanceLog(Long userId, Long storeId, LocalDate date) {
        validateStoreOwner(userId, storeId);

        if (!date.isBefore(LocalDate.now())) {
            throw new BusinessException(ErrorCode.INVALID_ATTENDANCE_LOG_DATE);
        }

        List<Attendance> attendances = attendanceRepository
                .findByStoreIdAndTargetDateWithUser(storeId, date);

        // 1. 상태별 인원수 카운트 (Map 형태로 추출)
        Map<AttendanceStatus, Long> statusCounts = attendances.stream()
                .filter(a -> a.getStatus() != null)
                .collect(Collectors.groupingBy(Attendance::getStatus, Collectors.counting()));

        long workingCount = statusCounts.getOrDefault(AttendanceStatus.WORKING, 0L);
        long lateCount = statusCounts.getOrDefault(AttendanceStatus.LATE, 0L);
        long absentCount = statusCounts.getOrDefault(AttendanceStatus.ABSENT, 0L);
        long allCount = workingCount + lateCount + absentCount; // 전체 인원수는 리스트의 사이즈

        // 2. DTO 매핑 로직 (기존과 동일)
        List<AttendanceLogResponseDto.AttendanceLogDto> logs = attendances.stream()
                .map(a -> AttendanceLogResponseDto.AttendanceLogDto.builder()
                        .employeeId(a.getEmployee().getId())
                        .employeeName(a.getEmployee().getUser().getName())
                        .scheduledStartTime(a.getScheduledStartTime())
                        .scheduledEndTime(a.getScheduledEndTime())
                        .clockIn(a.getClockIn())
                        .clockOut(a.getClockOut())
                        .status(a.getStatus() != null ? a.getStatus().name() : null)
                        .overtime(a.getOvertime())
                        .build())
                .collect(Collectors.toList());

        return AttendanceLogResponseDto.builder()
                .storeId(storeId)
                .all(allCount)
                .working(workingCount)
                .late(lateCount)
                .absent(absentCount)
                .date(date)
                .attendances(logs)
                .build();
    }

    // ========== Private Helpers ==========

    /**
     * 매장 존재 여부 및 사장님 권한을 검증합니다.
     *
     * @param userId  인증된 사용자 ID
     * @param storeId 매장 ID
     */
    private void validateStoreOwner(Long userId, Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if (!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.ATTENDANCE_STORE_NOT_OWNED);
        }
    }

    /**
     * 퇴근 처리.
     * 퇴근시각 경과 + overtimeConfirm 미전달 시, clockOut을 저장하지 않고 OVERTIME_CHECK 응답을 반환합니다.
     * 프론트에서 연장근무 팝업 후 overtimeConfirm=true/false로 재요청하면 퇴근이 확정됩니다.
     */
    private AttendanceResponseDto clockOut(Attendance attendance, Boolean overtimeConfirm) {
        LocalDateTime now = LocalDateTime.now();
        boolean isOvertime = attendance.getScheduledEndTime() != null
                && now.toLocalTime().isAfter(attendance.getScheduledEndTime());

        // 연장근무 확인 필요: clockOut 저장 없이 확인 요청 응답
        if (isOvertime && overtimeConfirm == null) {
            return AttendanceResponseDto.builder()
                    .type(AttendanceResultType.OVERTIME_CHECK)
                    .attendanceId(attendance.getId())
                    .clockIn(attendance.getClockIn())
                    .clockOut(null)
                    .status(attendance.getStatus())
                    .overtime(true)
                    .scheduledEndTime(attendance.getScheduledEndTime())
                    .message("연장근무 확인이 필요합니다.")
                    .build();
        }

        attendance.clockOut(now);
        attendance.updateOvertime(isOvertime && Boolean.TRUE.equals(overtimeConfirm));

        // 실근무시간을 이번 주 worked_minutes에 누적
        int totalMinutes = (int) java.time.Duration.between(attendance.getClockIn(), now).toMinutes();
        attendance.getEmployee().addWorkedMinutes(totalMinutes, attendance.getBreakMinutes());

        attendanceRepository.save(attendance);

        Long storeId = attendance.getEmployee().getStore().getId();
        String employeeIdStr = attendance.getEmployee().getId().toString();
        redisTemplate.opsForSet().remove(RedisKeyUtil.workingKey(storeId), employeeIdStr);

        return AttendanceResponseDto.builder()
                .type(AttendanceResultType.CLOCK_OUT)
                .attendanceId(attendance.getId())
                .clockIn(attendance.getClockIn())
                .clockOut(attendance.getClockOut())
                .status(attendance.getStatus())
                .overtime(attendance.getOvertime())
                .scheduledEndTime(attendance.getScheduledEndTime())
                .message("퇴근이 기록되었습니다.")
                .build();
    }
}
