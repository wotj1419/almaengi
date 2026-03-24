package com.almaengi.be.domain.chat.client;

import com.almaengi.be.domain.chat.ChatBotProperties;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
@RequiredArgsConstructor
public class HttpRagClient implements RagClient {
    private final ChatBotProperties chatBotProperties;

    // Rag server 호출
    @Override
    public String ask(Long storeId, Long roomId, Long userId, Long messageId, String question, List<String> history) {
        RestClient restClient = RestClient.create(chatBotProperties.getRagApiBaseUrl());

        RagAskResponse response = restClient.post()
                .uri("/ask")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RagAskRequest(storeId, roomId, userId, messageId, question, history))
                .retrieve()
                .body(RagAskResponse.class);

        if(response == null || response.answer() == null || response.answer().isBlank())
            throw new BusinessException(ErrorCode.CHAT_BOT_UPSTREAM_FAILED);

        return response.answer();
    }

    public record RagAskRequest(
            Long storeId,
            Long roomId,
            Long userId,
            Long messageId,
            String question,
            List<String> history
    ) {}
    public record RagAskResponse(
            String answer
    ) {}
}
