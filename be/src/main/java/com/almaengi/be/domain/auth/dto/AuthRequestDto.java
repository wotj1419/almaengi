package com.almaengi.be.domain.auth.dto;

import com.almaengi.be.domain.user.type.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class AuthRequestDto {

    @Getter
    @NoArgsConstructor
    @Schema(description = "회원가입 요청")
    public static class Signup {

        @Schema(description = "이메일", example = "user@example.com")
        @NotBlank(message = "이메일은 필수입니다.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;

        @Schema(description = "비밀번호 (8~72자, 영문/숫자/특수문자 포함)", example = "Password1!")
        @NotBlank(message = "비밀번호는 필수입니다.")
        @Size(max = 72, message = "비밀번호는 72자 이하여야 합니다.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,72}$",
                message = "비밀번호는 8자 이상 72자 이하, 영문/숫자/특수문자를 포함해야 합니다."
        )
        private String password;

        @Schema(description = "이름", example = "홍길동")
        @NotBlank(message = "이름은 필수입니다.")
        private String name;

        @Schema(description = "연락처", example = "010-1234-5678")
        private String phone;

        @Schema(description = "역할 (OWNER 또는 EMPLOYEE)", example = "OWNER")
        @NotNull(message = "역할은 필수입니다.")
        private Role role;
    }

    @Getter
    @NoArgsConstructor
    @Schema(description = "로그인 요청")
    public static class Login {

        @Schema(description = "이메일", example = "user@example.com")
        @NotBlank(message = "이메일은 필수입니다.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;

        @Schema(description = "비밀번호", example = "Password1!")
        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;
    }

    @Getter
    @NoArgsConstructor
    @Schema(description = "회원 탈퇴 요청")
    public static class Withdraw {

        @Schema(description = "비밀번호 (LOCAL 로그인 유저만 필수)", example = "Password1!")
        private String password;
    }
}
