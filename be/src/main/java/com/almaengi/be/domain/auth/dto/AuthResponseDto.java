package com.almaengi.be.domain.auth.dto;

import com.almaengi.be.domain.user.type.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Getter;

public class AuthResponseDto {

    @Getter
    @Builder
    public static class Signup {
        private Long userId;
        private String email;
        private String name;
        private Role role;
    }

    @Getter
    @Builder
    public static class Login {
        private Long userId;
        private String email;
        private String name;
        private Role role;
        private String accessToken;

        @JsonIgnore
        private String refreshToken;
    }

    @Getter
    @Builder
    public static class Token {
        private String accessToken;
    }

    @Getter
    @Builder
    public static class EmailCheck {
        private boolean exists;
    }
}
