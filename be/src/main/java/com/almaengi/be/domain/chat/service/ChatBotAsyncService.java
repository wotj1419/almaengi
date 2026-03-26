package com.almaengi.be.domain.chat.service;
import com.almaengi.be.domain.chat.ChatBotProperties;
import com.almaengi.be.domain.chat.client.RagClient;
import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.repository.ChatMessageRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomRepository;
import com.almaengi.be.domain.chat.ws.pubsub.ChatRedisPublisher;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.List;
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatBotAsyncService {
    private static final String FALLBACK_TEXT = "현재 답변 생성이 지연되고 있습니다. 잠시 후 다시 시도해주세요.";
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatBotProperties chatBotProperties;
    private final RagClient ragClient;
    private final ObjectMapper objectMapper;
    private final ChatRedisPublisher chatRedisPublisher;
    /**
     * 사용자 질문 저장 후 호출되는 비동기 처리.
     * 1) 최근 히스토리 구성
     * 2) AI 호출 (/ask)
     * 3) answer/sources/intent를 meta_json으로 저장
     * 4) 커밋 후 Redis publish로 WS 실시간 전파
     */
    @Async
    @Transactional
    public void generateAndSaveBotReply(
            Long storeId,
            Long roomId,
            Long requesterId,
            Long userMessageId,
            String question,
            String requesterRole
    ) {
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            log.warn("[CHAT-BOT] room not found. roomId={}", roomId);
            return;
        }
        User botUser = userRepository.findById(chatBotProperties.getBotUserId()).orElse(null);
        if (botUser == null) {
            log.warn("[CHAT-BOT] bot user not found. botUserId={}", chatBotProperties.getBotUserId());
            return;
        }
        String answer;
        List<String> sources;
        String intent;
        try {
            List<String> history = chatMessageRepository
                    .findPageByRoomIdWithCursor(roomId, null, PageRequest.of(0, 20))
                    .stream()
                    .map(ChatMessage::getContent)
                    .filter(v -> v != null && !v.isBlank())
                    .toList();
            RagClient.RagResult ragResult = ragClient.ask(
                    new RagClient.RagRequest(question, requesterRole, storeId, history)
            );
            answer = ragResult.answer();
            sources = ragResult.sources() == null ? List.of() : ragResult.sources();
            intent = ragResult.intent();
        } catch (Exception e) {
            log.warn("[CHAT-BOT] rag fails. roomId={}, userMessageId={}, reason={}",
                    roomId, userMessageId, e.getMessage());
            // 실패 시에도 클라이언트에서 일관된 필드 구조를 받을 수 있게 기본값 세팅
            answer = FALLBACK_TEXT;
            sources = List.of();
            intent = null;
        }
        String metaJson = toMetaJson(answer, sources, intent);
        ChatMessage botMessage = FALLBACK_TEXT.equals(answer)
                ? ChatMessage.createFallbackText(room, botUser, answer, metaJson)
                : ChatMessage.createBotText(room, botUser, answer, metaJson);
        ChatMessage saved = chatMessageRepository.save(botMessage);
        room.updateLastMessagePointer(saved.getId(), saved.getSentAt());
        // 중요: 봇 메시지도 커밋 후 Redis publish 하여 WS 실시간 수신되게 함
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    ChatMessageResponseDto.MessageItem payload = ChatMessageResponseDto.MessageItem.from(saved);
                    chatRedisPublisher.publishMessageCreated(roomId, payload);
                } catch (Exception e) {
                    log.warn("[CHAT-BOT] redis publish failed. roomId={}, messageId={}, reason={}",
                            roomId, saved.getId(), e.getMessage());
                }
            }
        });
    }
    private String toMetaJson(String answer, List<String> sources, String intent) {
        try {
            return objectMapper.writeValueAsString(new BotAiMeta(answer, sources, intent));
        } catch (JsonProcessingException e) {
            // meta 직렬화 실패가 메시지 저장 자체를 깨지 않도록 null 허용
            log.warn("[CHAT-BOT] meta serialization failed. reason={}", e.getMessage());
            return null;
        }
    }
    // chat_messages.meta_json에 저장할 구조
    private record BotAiMeta(
            String answer,
            List<String> sources,
            String intent
    ) {}
}