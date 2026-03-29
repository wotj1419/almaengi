package com.almaengi.be.global.config;

import com.almaengi.be.domain.chat.ws.handler.ChatStompErrorHandler;
import com.almaengi.be.global.websocket.security.StompAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;
    private final ChatStompErrorHandler chatStompErrorHandler;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // STOMP over WebSocket 접속 endpoint
        // 예: ws://localhost:8090/ws-chat
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 SEND 할 때 사용하는 prefix
        // 예: /pub/chat/rooms/100/messages
        registry.setApplicationDestinationPrefixes("/pub");

        // 서버 -> 클라이언트 브로드캐스트 prefix
        // 예: /sub/chat/rooms/100
        registry.enableSimpleBroker("/sub");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // inbound channel에 STOMP 인증 인터셉터 적용
        registration.interceptors(stompAuthChannelInterceptor);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        registry.setDecoratorFactories(handler -> handler);
    }

    @Bean
    public StompSubProtocolErrorHandler stompSubProtocolErrorHandler() {
        return chatStompErrorHandler;
    }
}
