package com.almaengi.be.domain.chat.service;

import com.almaengi.be.domain.chat.ChatBotProperties;
import com.almaengi.be.domain.chat.client.RagClient;
import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.repository.ChatMessageRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomRepository;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 비동기 BOT 응답 저장 서비스 코드
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

    /**
     * 사용자 질문 저장 후 호출되는 비동기 처리.
     * 1) 최근 히스토리를 구성해 RAG 요청
     * 2) 성공 시 봇 답변 저장
     * 3) 실패 시 fallback 안내 문구 저장
     *
     * 주의:
     * - @Async + @Transactional 조합으로, 사용자 요청 트랜잭션과 분리됩니다.
     * - 봇 응답 실패가 사용자 메시지 저장 성공을 깨지 않도록 best-effort로 동작합니다.
     */
    @Async
    @Transactional
    public void generateAndSaveBotReply(Long storeId, Long roomId, Long requesterId, Long userMessageId, String question) {
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);

        if(room == null) {
            log.warn("[CHAT-BOT] room not found. roomId = {}", roomId);
            return;
        }

        User botUser = userRepository.findById(chatBotProperties.getBotUserId()).orElse(null);
        if(botUser == null) {
            log.warn("[CHAT-BOT] bot user not found. botUserId={}", chatBotProperties.getBotUserId());
            return;
        }

        String answer;
        try {
            List<String> history = chatMessageRepository
                    .findPageByRoomIdWithCursor(roomId, null, PageRequest.of(0, 20))
                    .stream()
                    .map(ChatMessage::getContent)
                    .filter(v -> v != null && !v.isBlank())
                    .toList();

            answer = ragClient.ask(storeId, roomId, requesterId, userMessageId, question, history);
        } catch(Exception e) {
            log.warn("[CHAT-BOT] rag fails. roomId = {}, userMessageId = {}, reason = {}", roomId, userMessageId, e.getMessage());
            answer = FALLBACK_TEXT;
        }

        ChatMessage botMessage = (FALLBACK_TEXT.equals(answer))
                ? ChatMessage.createFallbackText(room, botUser, answer)
                : ChatMessage.createBotText(room, botUser, answer);

        ChatMessage saved = chatMessageRepository.save(botMessage);

        room.updateLastMessagePointer(saved.getId(), saved.getSentAt());
    }
}
