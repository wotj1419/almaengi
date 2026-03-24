package com.almaengi.be.domain.user.entity;

import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private LoginType loginType;

    private String password;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Role role;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, unique = true, length = 50)
    private String email;

    private LocalDate birthDate;

    @Column(length = 20)
    private String accountNo;

    @Column(length = 10)
    private String bankCode;

    @Column(nullable = false)
    private Boolean isWithdraw = false;

    private OffsetDateTime withdrawnAt;

    @Builder
    public User(LoginType loginType, String password, Role role,
                String name, String phone, String email, LocalDate birthDate) {
        this.loginType = loginType;
        this.password = password;
        this.role = role;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.birthDate = birthDate;
        this.isWithdraw = false;
    }

    /**
     * 계좌 정보를 등록합니다.
     */
    public void updateAccount(String accountNo, String bankCode) {
        this.accountNo = accountNo;
        this.bankCode = bankCode;
    }

    public void withdraw() {
        this.isWithdraw = true;
        this.withdrawnAt = OffsetDateTime.now();
    }
}
