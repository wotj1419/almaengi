package com.almaengi.be.domain.store.entity;

import com.almaengi.be.domain.user.entity.User;
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
public class Store {

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

    @Column(name = "address", length = 255)
    private String address;

    @Builder
    public Store(User owner, String name, String address) {
        this.owner = owner;
        this.name = name;
        this.address = address;
    }
}
