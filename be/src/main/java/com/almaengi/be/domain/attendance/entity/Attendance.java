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
        this.overtime = overtime;
        this.breakMinutes = breakMinutes != null ? breakMinutes : 0;
    }
}
