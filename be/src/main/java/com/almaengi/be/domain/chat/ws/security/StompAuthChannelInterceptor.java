package com.almaengi.be.domain.chat.ws.security;

import com.almaengi.be.domain.chat.repository.ChatRoomMemberRepository;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Connect 프레임에서 JWT 인증 수행, 인증 성공 시 STOMP 세션에 Principal(userId) 주입
// SUBSCRIBE/SEND: room 멤버십 권한 검증
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {
    private static final Pattern SUB_ROOM_PATTERN = Pattern.compile("^/sub/chat/rooms/(\\d+)(?:/read)?$");
    private static final Pattern PUB_ROOM_PATTERN = Pattern.compile("^/pub/chat/rooms/(\\d+)/(?:messages|read)$");

    private final JwtProvider jwtProvider;
    private final RedisTokenRepository redisTokenRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if(accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if(command == null) return message;

        if(command == StompCommand.CONNECT) {
            authenticateConnect(accessor);
            return message;
        }
        if(command == StompCommand.SUBSCRIBE) {
            authorizeSubscribe(accessor);
            return message;
        }
        if(command == StompCommand.SEND) {
            authorizeSend(accessor);
            return message;
        }

        return message;
    }


    private void authenticateConnect(StompHeaderAccessor accessor) {
        String token = resolveBearerToken(accessor);

        if(token == null || token.isBlank()) throw new AccessDeniedException("WS 인증 토큰이 없습니다.");
        if(!jwtProvider.validateToken(token)) throw new AccessDeniedException("유효하지 않은 WS 인증 토큰입니다.");

        Claims claims = jwtProvider.parseToken(token);

        String type = jwtProvider.getType(claims);
        if(!"access".equals(type)) throw new AccessDeniedException("access 토큰만 허용됩니다.");

        String jti = jwtProvider.getJti(claims);
        if(jti != null && redisTokenRepository.isBlacklisted(jti)) throw new AccessDeniedException("로그아웃된 토큰입니다.");

        Long userId = jwtProvider.getUserId(claims);
        accessor.setUser(new StompPrincipal(userId));
    }
    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if(destination == null) return;

        if(!destination.startsWith("/sub/chat/rooms/")) return;

        Long userId = extractUserId(accessor);
        Long roomId = extractRoomId(destination, SUB_ROOM_PATTERN);

        if(!chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId))
            throw new AccessDeniedException("채팅방 구독 권한이 없습니다.");
    }
    private void authorizeSend(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if(destination == null) return;

        if(!destination.startsWith("/pub/chat/rooms/")) return;

        Long userId = extractUserId(accessor);
        Long roomId = extractRoomId(destination, PUB_ROOM_PATTERN);

        if(!chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId))
            throw new AccessDeniedException("채팅방 전송 권한이 없습니다.");
    }

    //===========================================================================
    // private helper method
    //===========================================================================
    private String resolveBearerToken(StompHeaderAccessor accessor) {
        String header = firstNativeHeader(accessor, "Authorization");
        if (header == null) header = firstNativeHeader(accessor, "authorization");
        if (header == null) return null;

        if (header.startsWith("Bearer ")) return header.substring(7);

        return null;
    }
    private String firstNativeHeader(StompHeaderAccessor accessor, String headerName) {
        List<String> values = accessor.getNativeHeader(headerName);
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.get(0);
    }
    private Long extractUserId(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if(principal == null || principal.getName() == null || principal.getName().isBlank())
            throw new AccessDeniedException("인증된 사용자 정보가 없습니다.");

        try {
            return Long.parseLong(principal.getName());
        } catch(NumberFormatException e) {
            throw new AccessDeniedException("유효하지 않은 사용자 식별자 입니다.");
        }
    }
    private Long extractRoomId(String destination, Pattern pattern) {
        Matcher matcher = pattern.matcher(destination);
        if(!matcher.matches()) throw new AccessDeniedException("유효하지 않은 채팅방 입니다.");

        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException e) {
            throw new AccessDeniedException("유효하지 않은 채팅방 식별자입니다.");
        }
    }
}
