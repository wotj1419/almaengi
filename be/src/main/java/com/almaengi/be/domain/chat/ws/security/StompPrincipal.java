package com.almaengi.be.domain.chat.ws.security;

import java.security.Principal;

// STOMP 세션에 바인딩할 인증 주체
//     - HTTP SecurityContext 대신, WebSocket 세션 단위로 userId를 보관하기 위해 사용
public class StompPrincipal implements Principal {
    private final String name;

    public StompPrincipal(Long userId) {
        this.name = String.valueOf(userId);
    }

    @Override
    public String getName() {
        return name;
    }
    public Long getUserId() {
        return Long.parseLong(name);
    }
}
