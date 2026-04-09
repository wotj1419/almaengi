package com.almaengi.be.domain.attendance.entity;

import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 출퇴근 기록 엔티티입니다.
 *
 * - 일일 배치 스케줄러가 WAITING 상태로 사전 생성하거나, 스케줄 없는 직원이 QR 출근 시 생성됩니다.
 * - overtime: 퇴근시각 경과 시 스케줄러가 true로 설정하며, 퇴근 QR 시 사용자가 확인합니다.
 */
@Entity
@Table(name = "attendances")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private StoreEmployee employee;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "scheduled_start_time")
    private LocalTime scheduledStartTime;

    @Column(name = "scheduled_end_time")
    private LocalTime scheduledEndTime;

    @Column(name = "clock_in")
    private LocalDateTime clockIn;

    @Column(name = "clock_out")
    private LocalDateTime clockOut;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private AttendanceStatus status;

    @Column(name = "overtime")
    private Boolean overtime;

    @Column(name = "break_minutes", nullable = false)
    private Integer breakMinutes = 0;

    @Builder
    public Attendance(StoreEmployee employee, LocalDate targetDate, LocalTime scheduledStartTime,
                      LocalTime scheduledEndTime, AttendanceStatus status, Boolean overtime, Integer breakMinutes) {
        this.employee = employee;
        this.targetDate = targetDate;
        this.scheduledStartTime = scheduledStartTime;
        this.scheduledEndTime = scheduledEndTime;
        this.status = status;
        this.overtime = overtime != null ? overtime : false;
        this.breakMinutes = breakMinutes != null ? breakMinutes : 0;
    }

    public void clockIn(LocalDateTime clockIn) {
        this.clockIn = clockIn;
    }

    public void clockOut(LocalDateTime clockOut) {
        this.clockOut = clockOut;
    }

    public void updateStatus(AttendanceStatus status) {
        this.status = status;
    }

    public void updateOvertime(boolean overtime) {
        this.overtime = overtime;
    }
}
