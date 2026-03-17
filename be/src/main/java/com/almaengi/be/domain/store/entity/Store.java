package com.almaengi.be.domain.store.entity;

import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사장님이 운영하는 매장(Stores) 정보를 담는 엔티티입니다.
 * ShiftAuction과 1:N 관계를 맺습니다.
 */
@Entity
@Table(name = "stores")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_id")
    private Long id;

    // 매장의 소유주(사장님)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "store_name", length = 100, nullable = false)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(name = "qr_code", nullable = false)
    private String qrCode;

    @Column(name = "is_over_5_employees", nullable = false)
    private Boolean isOver5Employees = false;

    @Column(name = "is_closed", nullable = false)
    private Boolean isClosed = false;

    @Builder
    public Store(User owner, String name, String address, String phone, Boolean isOver5Employees, String qrCode) {
        this.owner = owner;
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.isOver5Employees = (isOver5Employees != null) ? isOver5Employees : true;
        this.qrCode = qrCode;
    }

    public void updateStoreInfo(String name, String address, String phone, Boolean isOver5Employees) {
        if(name != null) this.name = name;
        if(address != null) this.address = address;
        if(phone != null) this.phone = phone;
        if(isOver5Employees != null) this.isOver5Employees = isOver5Employees;
    }

    public void closeStore() {
        this.isClosed = true;
    }
}
