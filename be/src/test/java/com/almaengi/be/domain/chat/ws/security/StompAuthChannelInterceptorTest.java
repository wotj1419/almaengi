package com.almaengi.be.domain.chat.ws.security;

import com.almaengi.be.domain.chat.repository.ChatRoomMemberRepository;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("StompAuthChannelInterceptor 단위 테스트")
class StompAuthChannelInterceptorTest {

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private RedisTokenRepository redisTokenRepository;

    @Mock
    private ChatRoomMemberRepository chatRoomMemberRepository;

    @Mock
    private MessageChannel messageChannel;

    @Test
    @DisplayName("CONNECT 성공: 유효 access 토큰이면 Principal(userId) 세팅")
    void connect_success_setsPrincipal() {
        StompAuthChannelInterceptor interceptor = new StompAuthChannelInterceptor(
                jwtProvider,
                redisTokenRepository,
                chatRoomMemberRepository
        );

        String token = "valid-token";
        Claims claims = org.mockito.Mockito.mock(Claims.class);

        given(jwtProvider.validateToken(token)).willReturn(true);
        given(jwtProvider.parseToken(token)).willReturn(claims);
        given(jwtProvider.getType(claims)).willReturn("access");
        given(jwtProvider.getJti(claims)).willReturn("jti-1");
        given(redisTokenRepository.isBlacklisted("jti-1")).willReturn(false);
        given(jwtProvider.getUserId(claims)).willReturn(10L);

        Message<?> message = connectMessage(token);

        Message<?> result = interceptor.preSend(message, messageChannel);
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);

        assertThat(accessor.getUser()).isNotNull();
        assertThat(accessor.getUser().getName()).isEqualTo("10");
        verify(chatRoomMemberRepository, never()).existsByRoomIdAndUserIdAndLeftAtIsNull(anyLong(), anyLong());
    }

    @Test
    @DisplayName("CONNECT 실패: Authorization 헤더가 없으면 차단")
    void connect_fail_whenNoAuthorizationHeader() {
        StompAuthChannelInterceptor interceptor = new StompAuthChannelInterceptor(
                jwtProvider,
                redisTokenRepository,
                chatRoomMemberRepository
        );

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    @Test
    @DisplayName("SUBSCRIBE 성공: 활성 멤버면 구독 허용")
    void subscribe_success_whenActiveMember() {
        StompAuthChannelInterceptor interceptor = new StompAuthChannelInterceptor(
                jwtProvider,
                redisTokenRepository,
                chatRoomMemberRepository
        );

        given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(100L, 10L)).willReturn(true);

        Message<?> message = subscribeMessage(100L, 10L);

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("SEND 실패: 활성 멤버가 아니면 전송 차단")
    void send_fail_whenNotActiveMember() {
        StompAuthChannelInterceptor interceptor = new StompAuthChannelInterceptor(
                jwtProvider,
                redisTokenRepository,
                chatRoomMemberRepository
        );

        given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(100L, 10L)).willReturn(false);

        Message<?> message = sendMessage(100L, 10L);

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    private Message<?> connectMessage(String token) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.setNativeHeader("Authorization", "Bearer " + token);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<?> subscribeMessage(Long roomId, Long userId) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setLeaveMutable(true);
        accessor.setDestination("/sub/chat/rooms/" + roomId);
        accessor.setUser(new StompPrincipal(userId));
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<?> sendMessage(Long roomId, Long userId) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setLeaveMutable(true);
        accessor.setDestination("/pub/chat/rooms/" + roomId + "/messages");
        accessor.setUser(new StompPrincipal(userId));
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
