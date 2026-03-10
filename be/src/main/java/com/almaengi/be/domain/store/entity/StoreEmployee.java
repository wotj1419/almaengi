package com.almaengi.be.domain.store.entity;

import com.almaengi.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;

/**
 * 매장에 소속된 알바생(Store_Employees) 정보를 담는 엔티티입니다.
 */
@Entity
@Table(name = "store_employees")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreEmployee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Long id;

    // 소속된 매장
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    // 실제 알바생의 유저 정보
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private StoreEmployeeStatus status;

    @Column(name = "position", length = 50)
    private String position;

    @Column(name = "hourly_wage")
    private Integer hourlyWage;

    @Enumerated(EnumType.STRING)
    @Column(name = "tax_type", length = 20)
    private TaxType taxType;

    @Column(name = "is_4insurances")
    private Boolean is4insurances;

    @Column(name = "worked_minutes")
    private Integer workedMinutes;

    @Column(name = "will_working_minutes")
    private Integer willWorkingMinutes;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "dependents_count")
    private Integer dependentsCount;

    @Column(name = "include_holiday_pay")
    private Boolean includeHolidayPay;

    @Builder
    public StoreEmployee(Store store, User user, StoreEmployeeStatus status, String position, Integer hourlyWage,
            TaxType taxType, Boolean is4insurances, Integer workedMinutes, Integer willWorkingMinutes,
            LocalDate hireDate, Integer dependentsCount, Boolean includeHolidayPay) {
        this.store = store;
        this.user = user;
        this.status = status;
        this.position = position;
        this.hourlyWage = hourlyWage;
        this.taxType = taxType;
        this.is4insurances = is4insurances;
        this.workedMinutes = workedMinutes;
        this.willWorkingMinutes = willWorkingMinutes;
        this.hireDate = hireDate;
        this.dependentsCount = dependentsCount;
        this.includeHolidayPay = includeHolidayPay;
    }

    /**
     * 알바생의 이번 주 예정 근무 시간(대타 확정 등)을 추가합니다.
     */
    public void addWillWorkingMinutes(int minutesToAdd) {
        if (this.willWorkingMinutes == null) {
            this.willWorkingMinutes = 0;
        }
        this.willWorkingMinutes += minutesToAdd;
    }
}
