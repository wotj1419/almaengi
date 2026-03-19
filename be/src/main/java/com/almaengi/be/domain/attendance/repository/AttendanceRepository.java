package com.almaengi.be.domain.attendance.repository;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * 출퇴근 기록 Repository입니다.
 */
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    /**
     * 알바생의 특정 상태(예: LATE, ABSENT) 근태 기록 횟수를 조회합니다.
     */
    int countByEmployeeIdAndStatus(Long employeeId, AttendanceStatus status);

    /** 출퇴근 API: 오늘 해당 직원의 Attendance 조회 */
    Optional<Attendance> findByEmployeeIdAndTargetDate(Long employeeId, LocalDate targetDate);

    /** 스케줄러 - 지각 판정: 출근시각 경과 + WAITING 상태인 레코드 */
    List<Attendance> findByTargetDateAndStatusAndScheduledStartTimeLessThanEqual(
            LocalDate targetDate, AttendanceStatus status, LocalTime time);

    /** 스케줄러 - 퇴근시각 경과: clockOut 없음 + ABSENT 아닌 + overtime 미처리 레코드 */
    List<Attendance> findByTargetDateAndClockOutIsNullAndScheduledEndTimeLessThanEqualAndStatusNotAndOvertimeFalse(
            LocalDate targetDate, LocalTime time, AttendanceStatus status);

    /** 일일 배치: 당일 기존 레코드 확인 (중복 생성 방지) */
    List<Attendance> findByTargetDate(LocalDate targetDate);

    /** 대시보드 상태별 직원 목록: Attendance → StoreEmployee → User를 JOIN FETCH하여 1회 쿼리로 조회 */
    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee e JOIN FETCH e.user WHERE e.id IN :ids AND a.targetDate = :date")
    List<Attendance> findByEmployeeIdInAndTargetDateWithUser(@Param("ids") List<Long> ids, @Param("date") LocalDate date);

    /** 근태 로그 조회: 매장 직원들의 특정 날짜 근태 기록을 JOIN FETCH로 조회 (출근 시간순 정렬) */
    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee e JOIN FETCH e.user WHERE e.store.id = :storeId AND a.targetDate = :date ORDER BY a.scheduledStartTime, e.user.name")
    List<Attendance> findByStoreIdAndTargetDateWithUser(@Param("storeId") Long storeId, @Param("date") LocalDate date);

    /**
     * 특정 직원의 지정 기간 내 출퇴근 완료된 기록을 조회합니다. (급여 계산용)
     */
    List<Attendance> findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(Long employeeId, LocalDate startDate, LocalDate endDate);
}
