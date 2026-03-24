package com.almaengi.be.global.config;

import com.almaengi.be.domain.chat.ws.pubsub.ChatRedisSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

// Redis Pub/Sub 리스너 등록 설정
// 패턴 토픽으로 room별 채널을 수신
@Configuration
@RequiredArgsConstructor
public class ChatRedisListenerConfig {
    private final ChatRedisSubscriber chatRedisSubscriber;

    @Bean
    public RedisMessageListenerContainer chatRedisMessageListenerContainer(RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        container.addMessageListener(chatRedisSubscriber, new PatternTopic("chat:room:*:message"));
        container.addMessageListener(chatRedisSubscriber, new PatternTopic("chat:room:*:read"));

        return container;
    }
}
