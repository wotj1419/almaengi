package com.almaengi.be.domain.chat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("ChatBotProperties 유효성 검증 테스트")
class ChatBotPropertiesTest {

    @Test
    @DisplayName("실패: bot-user-id가 null/0 이하이면 예외")
    void failWhenBotUserIdIsInvalid() {
        ChatBotProperties properties = new ChatBotProperties();
        ReflectionTestUtils.setField(properties, "botUserId", 0L);
        ReflectionTestUtils.setField(properties, "ragApiBaseUrl", "http://localhost:8000");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("app.chat.bot-user-id");
    }

    @Test
    @DisplayName("실패: rag-api-base-url이 비어 있으면 예외")
    void failWhenRagApiBaseUrlIsBlank() {
        ChatBotProperties properties = new ChatBotProperties();
        ReflectionTestUtils.setField(properties, "botUserId", 1L);
        ReflectionTestUtils.setField(properties, "ragApiBaseUrl", "   ");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("app.chat.rag-api-base-url");
    }
}
