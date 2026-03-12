package com.almaengi.be.domain.auth.dto;

import com.almaengi.be.domain.user.type.Role;
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
    public static class Signup {

        @NotBlank(message = "이메일은 필수입니다.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다.")
        @Size(max = 72, message = "비밀번호는 72자 이하여야 합니다.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,72}$",
                message = "비밀번호는 8자 이상 72자 이하, 영문/숫자/특수문자를 포함해야 합니다."
        )
        private String password;

        @NotBlank(message = "이름은 필수입니다.")
        private String name;

        private String phone;

        @NotNull(message = "역할은 필수입니다.")
        private Role role;
    }

    @Getter
    @NoArgsConstructor
    public static class Login {

        @NotBlank(message = "이메일은 필수입니다.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;
    }

    @Getter
    @NoArgsConstructor
    public static class Withdraw {
        private String password;
    }
}
