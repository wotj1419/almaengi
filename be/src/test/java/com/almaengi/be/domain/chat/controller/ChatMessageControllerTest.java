package com.almaengi.be.domain.chat.controller;

import com.almaengi.be.domain.chat.dto.ChatMessageRequestDto;
import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.service.ChatMessageService;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDateTime;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@WebMvcTest(controllers = ChatMessageController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@DisplayName("ChatMessageController Step4 WebMvc 테스트")
class ChatMessageControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @MockitoBean
    private ChatMessageService chatMessageService;
    @MockitoBean
    private JwtProvider jwtProvider;
    @MockitoBean
    private RedisTokenRepository redisTokenRepository;
    @Nested
    @DisplayName("메시지 전송 API")
    class SendMessageApiTest {
        @Test
        @DisplayName("성공: TEXT 메시지 전송")
        void sendMessage_success() throws Exception {
            Long roomId = 100L;
            ChatMessageRequestDto.SendMessage request = new ChatMessageRequestDto.SendMessage();
            ReflectionTestUtils.setField(request, "messageType", ChatMessageType.TEXT);
            ReflectionTestUtils.setField(request, "content", "오늘 6시 출근 가능해요.");
            ChatMessageResponseDto.MessageItem mockResponse = ChatMessageResponseDto.MessageItem.builder()
                    .messageId(1200L)
                    .roomId(roomId)
                    .senderId(1L)
                    .senderName("사장")
                    .messageType(ChatMessageType.TEXT)
                    .content("오늘 6시 출근 가능해요.")
                    .sentAt(LocalDateTime.of(2026, 3, 22, 10, 0))
                    .isDeleted(false)
                    .build();
            Mockito.when(chatMessageService.sendMessage(any(), eq(roomId), any(ChatMessageRequestDto.SendMessage.class)))
                    .thenReturn(mockResponse);
            mockMvc.perform(post("/api/v1/chat/rooms/{roomId}/messages", roomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.messageId").value(1200L))
                    .andExpect(jsonPath("$.data.messageType").value("TEXT"));
        }
        @Test
        @DisplayName("실패: content 누락 시 400 + G002")
        void sendMessage_failByValidation() throws Exception {
            Long roomId = 100L;
            String invalidJson = """
                    {
                      "messageType": "TEXT",
                      "content": ""
                    }
                    """;
            mockMvc.perform(post("/api/v1/chat/rooms/{roomId}/messages", roomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }
        @Test
        @DisplayName("실패: 활성 멤버가 아니면 403 + C003")
        void sendMessage_failNotActiveMember() throws Exception {
            Long roomId = 100L;
            ChatMessageRequestDto.SendMessage request = new ChatMessageRequestDto.SendMessage();
            ReflectionTestUtils.setField(request, "messageType", ChatMessageType.TEXT);
            ReflectionTestUtils.setField(request, "content", "테스트");
            Mockito.when(chatMessageService.sendMessage(any(), eq(roomId), any(ChatMessageRequestDto.SendMessage.class)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_MEMBER_NOT_ACTIVE));
            mockMvc.perform(post("/api/v1/chat/rooms/{roomId}/messages", roomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("C003"));
        }
    }
    @Nested
    @DisplayName("메시지 조회 API")
    class GetMessagesApiTest {
        @Test
        @DisplayName("성공: 커서 기반 조회")
        void getMessages_success() throws Exception {
            Long roomId = 100L;
            ChatMessageResponseDto.MessageItem m1 = ChatMessageResponseDto.MessageItem.builder()
                    .messageId(1200L)
                    .roomId(roomId)
                    .senderId(1L)
                    .senderName("사장")
                    .messageType(ChatMessageType.TEXT)
                    .content("최근 메시지")
                    .sentAt(LocalDateTime.of(2026, 3, 22, 10, 0))
                    .isDeleted(false)
                    .build();
            ChatMessageResponseDto.MessageItem m2 = ChatMessageResponseDto.MessageItem.builder()
                    .messageId(1199L)
                    .roomId(roomId)
                    .senderId(2L)
                    .senderName("직원")
                    .messageType(ChatMessageType.TEXT)
                    .content("이전 메시지")
                    .sentAt(LocalDateTime.of(2026, 3, 22, 9, 59))
                    .isDeleted(false)
                    .build();
            ChatMessageResponseDto.MessagePage page = ChatMessageResponseDto.MessagePage.of(List.of(m1, m2), 1199L, 30);
            Mockito.when(chatMessageService.getMessages(any(), eq(roomId), eq(null), eq(30)))
                    .thenReturn(page);
            mockMvc.perform(get("/api/v1/chat/rooms/{roomId}/messages", roomId)
                            .param("size", "30"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.messages.length()").value(2))
                    .andExpect(jsonPath("$.data.nextCursor").value(1199L));
        }
        @Test
        @DisplayName("실패: 잘못된 커서면 400 + C007")
        void getMessages_failInvalidCursor() throws Exception {
            Long roomId = 100L;
            Mockito.when(chatMessageService.getMessages(any(), eq(roomId), eq(0L), eq(30)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_INVALID_CURSOR));
            mockMvc.perform(get("/api/v1/chat/rooms/{roomId}/messages", roomId)
                            .param("cursor", "0")
                            .param("size", "30"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("C007"));
        }
    }

    @Nested
    @DisplayName("읽음 처리 API")
    class MarkAsReadApiTest {

        @Test
        @DisplayName("성공: 읽음 처리 요청")
        void markAsRead_success() throws Exception {
            Long roomId = 100L;
            String requestJson = """
                    {
                      "lastReadMessageId": 1200
                    }
                    """;

            mockMvc.perform(post("/api/v1/chat/rooms/{roomId}/read", roomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));
        }

        @Test
        @DisplayName("실패: lastReadMessageId 누락 시 400 + G002")
        void markAsRead_failByValidation() throws Exception {
            Long roomId = 100L;
            String invalidJson = "{}";

            mockMvc.perform(post("/api/v1/chat/rooms/{roomId}/read", roomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }

        @Test
        @DisplayName("실패: 비활성 멤버면 403 + C003")
        void markAsRead_failNotActiveMember() throws Exception {
            Long roomId = 100L;
            String requestJson = """
                    {
                      "lastReadMessageId": 1200
                    }
                    """;

            Mockito.doThrow(new BusinessException(ErrorCode.CHAT_MEMBER_NOT_ACTIVE))
                    .when(chatMessageService)
                    .markAsRead(any(), eq(roomId), any(ChatMessageRequestDto.MarkRead.class));

            mockMvc.perform(post("/api/v1/chat/rooms/{roomId}/read", roomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("C003"));
        }
    }
}
