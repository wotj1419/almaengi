package com.almaengi.be.domain.chat.client;
import com.almaengi.be.domain.chat.ChatBotProperties;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.List;
@Component
@RequiredArgsConstructor
public class HttpRagClient implements RagClient {
    private final ChatBotProperties chatBotProperties;
    // AI 서버 신규 엔드포인트
    private static final String AI_ASK_PATH = "/ask";
    @Override
    public RagResult ask(RagRequest request) {
        try {
            RestClient restClient = RestClient.create(chatBotProperties.getRagApiBaseUrl());
            // BE 내부 요청 모델 -> AI /ask 요청 스키마로 매핑
            AiAskRequest aiRequest = new AiAskRequest(
                    request.question(),
                    request.role(),
                    request.storeId(), // optional
                    request.history() == null ? List.of() : request.history()
            );
            AiAskResponse response = restClient.post()
                    .uri(AI_ASK_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(aiRequest)
                    .retrieve()
                    .body(AiAskResponse.class);
            // answer가 없으면 실패로 간주
            if (response == null || response.answer() == null || response.answer().isBlank()) {
                throw new BusinessException(ErrorCode.CHAT_BOT_UPSTREAM_FAILED);
            }
            // AI 응답을 그대로 RagResult로 전달
            List<String> sources = response.sources() == null ? List.of() : response.sources();
            return new RagResult(
                    response.answer(),
                    sources,
                    response.intent()
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.CHAT_BOT_UPSTREAM_FAILED);
        }
    }
    /**
     * AI /ask 요청 모델
     * {
     *   "question": "...",
     *   "role": "OWNER",
     *   "store_id": 1,
     *   "history": []
     * }
     */
    private record AiAskRequest(
            String question,
            String role,
            @JsonProperty("store_id") Long storeId,
            List<String> history
    ) {}
    /**
     * AI /ask 응답 모델
     * {
     *   "answer": "...",
     *   "sources": ["근로기준법 제55조", "..."],
     *   "intent": "LEGAL_QUERY"
     * }
     */
    private record AiAskResponse(
            String answer,
            List<String> sources,
            String intent
    ) {}
}