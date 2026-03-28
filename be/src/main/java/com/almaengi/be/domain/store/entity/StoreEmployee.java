package com.almaengi.be.domain.store.entity;

import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.entity.BaseTimeEntity;
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
@Table(name = "store_employees", uniqueConstraints = {
        @UniqueConstraint(name = "uq_store_employees_store_user", columnNames = {"store_id", "user_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreEmployee extends BaseTimeEntity {

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
    @Column(nullable = false, length = 20)
    private StoreEmployeeStatus status;

    @Column(length = 50)
    private String position;

    @Column(name = "hourly_wage",  nullable = false)
    private Integer hourlyWage;

    @Enumerated(EnumType.STRING)
    @Column(name = "tax_type", nullable = false, length = 20)
    private TaxType taxType = TaxType.INCOME_3_3;

    @Column(name = "worked_minutes", nullable = false)
    private Integer workedMinutes = 0;

    @Column(name = "will_working_minutes", nullable = false)
    private Integer willWorkingMinutes = 0;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "dependents_count", nullable = false)
    private Integer dependentsCount;

    /**
     * 5인 미만 사업장에서도 연장·야간·휴일 가산수당을 지급할지 여부.
     * 근로기준법상 5인 미만 사업장은 가산수당 지급 의무가 면제되지만,
     * 사장님이 자발적으로 지급을 선택할 수 있는 옵션입니다.
     * (5인 이상 사업장에서는 이 값과 무관하게 항상 가산수당이 적용됩니다)
     */
    @Column(name = "include_holiday_pay", nullable = false)
    private Boolean includeHolidayPay;

    @Builder
    public StoreEmployee(Store store, User user, StoreEmployeeStatus status, String position, Integer hourlyWage,
            TaxType taxType, Integer workedMinutes, Integer willWorkingMinutes,
            LocalDate hireDate, Integer dependentsCount, Boolean includeHolidayPay) {
        this.store = store;
        this.user = user;
        this.status = status;
        this.position = position;
        this.hourlyWage = hourlyWage;
        this.taxType = taxType;
        this.workedMinutes = workedMinutes;
        this.willWorkingMinutes = willWorkingMinutes;
        this.hireDate = hireDate;
        this.dependentsCount = dependentsCount;
        this.includeHolidayPay = includeHolidayPay;
    }

    /**
     * 퇴근 시 실근무시간을 이번 주 근무시간에 누적합니다.
     * 총 근무시간이 휴게시간보다 짧으면 누적하지 않습니다.
     *
     * @param totalMinutes 출근~퇴근 총 시간(분)
     * @param breakMinutes 휴게시간(분)
     */
    public void addWorkedMinutes(int totalMinutes, int breakMinutes) {
        int netMinutes = totalMinutes - breakMinutes;
        if (netMinutes <= 0) {
            return;
        }
        if (this.workedMinutes == null) {
            this.workedMinutes = 0;
        }
        this.workedMinutes += netMinutes;
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

    // 변경이 필요한 직원 정보를 업데이트하는 비지니스 메서드
    public void updateEmployeeInfo(String position, Integer hourlyWage, TaxType taxType, Boolean includeHolidayPay) {
        if(position != null) this.position = position;
        if(hourlyWage != null) this.hourlyWage = hourlyWage;
        if(taxType != null) this.taxType = taxType;
        if(includeHolidayPay != null) this.includeHolidayPay = includeHolidayPay;
    }

    // 직원 상태 변경(퇴사 등)
    public void changeStatus(StoreEmployeeStatus status) {
        this.status = status;
    }

    public void approveToWorking() {
        this.status = StoreEmployeeStatus.WORKING;
        this.hireDate =  LocalDate.now();
    }
}
