package com.almaengi.be.domain.store.entity;

import com.almaengi.be.domain.store.type.DayOfWeek;
import com.almaengi.be.domain.store.type.DayOfWeekConverter;
import com.almaengi.be.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Table(name = "work_schedules", uniqueConstraints = {
        @UniqueConstraint(name = "uq_work_schedules_slot",
                columnNames = {"employee_id", "day_of_week", "start_time", "end_time"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkSchedule extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private StoreEmployee employee;

    // 요일 (0=일 ~ 6=토)
    @Convert(converter = DayOfWeekConverter.class)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "break_minutes", nullable = false)
    private int breakMinutes;

    @Builder
    public WorkSchedule(StoreEmployee employee, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, int breakMinutes) {
        this.employee = employee;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.breakMinutes = breakMinutes;
    }

    // 근무 요일, 근무 시간 및 휴게 시간을 수정합니다.
    public void update(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, Integer breakMinutes) {
        if(dayOfWeek != null) this.dayOfWeek = dayOfWeek;
        if(startTime != null) this.startTime = startTime;
        if(endTime != null) this.endTime = endTime;
        if(breakMinutes != null) this.breakMinutes = breakMinutes;
    }
}
