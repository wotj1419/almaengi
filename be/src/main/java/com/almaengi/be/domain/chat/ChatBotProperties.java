package com.almaengi.be.domain.chat;

import com.almaengi.be.global.error.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class ChatBotProperties {
    @Value("${app.chat.bot-user-id}")
    private Long botUserId;

    @Value("${app.chat.rag-api-base-url}")
    private String ragApiBaseUrl;

    @PostConstruct
    public void validate() {
        if(botUserId == null || botUserId <= 0)
            throw new IllegalStateException("app.chat.bot-user-id 값이 유효하지 않음.");

        if(ragApiBaseUrl == null || ragApiBaseUrl.isBlank())
            throw new IllegalStateException("app.chat.rag-api-base-url 값이 유효하지 않음.");
    }
}
