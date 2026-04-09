package com.almaengi.be.domain.store.repository;

import com.almaengi.be.domain.store.entity.WorkSchedule;
import com.almaengi.be.domain.store.type.DayOfWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Long> {

    // 출퇴근: 특정 직원의 해당 요일 첫 번째 스케줄 조회
    Optional<WorkSchedule> findFirstByEmployeeIdAndDayOfWeek(Long employeeId, DayOfWeek dayOfWeek);

    // 출퇴근: 해당 요일의 모든 스케줄 조회 (일일 배치용)
    List<WorkSchedule> findByDayOfWeek(DayOfWeek dayOfWeek);

    // 매장 전체 직원의 주간 스케줄 조회
    List<WorkSchedule> findByEmployee_StoreId(Long storeId);

    // 특정 요일에 근무하는 매장 직원 스케줄 조회
    List<WorkSchedule> findByEmployee_StoreIdAndDayOfWeek(Long storeId, DayOfWeek dayOfWeek);

    // 특정 직원의 주간 스케줄 전체 조회
    List<WorkSchedule> findByEmployeeId(Long employeeId);

    // 동일 직원, 요일, 시간대의 중복 스케줄 존재 여부 확인 (밑에꺼 사용)
    boolean existsByEmployeeIdAndDayOfWeekAndStartTimeAndEndTime(Long employeeId, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime);

    // 동일 직원, 요일, 시간대의 중복 스케줄 존재 여부 확인
    @Query("""
        SELECT COUNT(ws) > 0 FROM WorkSchedule ws
        WHERE ws.employee.id = :employeeId
            AND ws.dayOfWeek = :dayOfWeek
            AND ws.startTime < :endTime AND ws.endTime > :startTime
    """)
    boolean existsTimeOverlapping(@Param("employeeId") Long employeeId, @Param("dayOfWeek") DayOfWeek dayOfWeek, @Param("startTime") LocalTime startTime, @Param("endTime") LocalTime endTime);
}
