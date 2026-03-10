package com.almaengi.be.domain.attendance.repository;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    /**
     * 알바생의 특정 상태(예: LATE, ABSENT) 근태 기록 횟수를 조회합니다.
     */
    int countByEmployeeIdAndStatus(Long employeeId, AttendanceStatus status);
}
