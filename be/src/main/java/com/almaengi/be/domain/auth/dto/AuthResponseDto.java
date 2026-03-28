package com.almaengi.be.domain.auth.dto;

import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.type.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

public class AuthResponseDto {

    @Getter
    @Builder
    @Schema(description = "회원가입 응답")
    public static class Signup {

        @Schema(description = "사용자 ID", example = "1")
        private Long userId;

        @Schema(description = "이메일", example = "user@example.com")
        private String email;

        @Schema(description = "이름", example = "홍길동")
        private String name;

        @Schema(description = "역할", example = "OWNER")
        private Role role;

        public static Signup from(User user) {
            return Signup.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole())
                    .build();
        }
    }

    @Getter
    @Builder
    @Schema(description = "로그인 응답")
    public static class Login {

        @Schema(description = "사용자 ID", example = "1")
        private Long userId;

        @Schema(description = "이메일", example = "user@example.com")
        private String email;

        @Schema(description = "이름", example = "홍길동")
        private String name;

        @Schema(description = "역할", example = "OWNER")
        private Role role;

        @Schema(description = "액세스 토큰")
        private String accessToken;

        @JsonIgnore
        private String refreshToken;

        public static Login from(User user, String accessToken, String refreshToken) {
            return Login.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole())
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();
        }
    }

    @Getter
    @Builder
    @Schema(description = "토큰 재발급 응답")
    public static class Token {

        @Schema(description = "액세스 토큰")
        private String accessToken;
    }

    @Getter
    @Builder
    @Schema(description = "이메일 중복 체크 응답")
    public static class EmailCheck {

        @Schema(description = "이메일 존재 여부", example = "false")
        private boolean exists;
    }
}
