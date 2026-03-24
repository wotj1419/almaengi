package com.almaengi.be.domain.chat.controller;

import com.almaengi.be.domain.chat.dto.ChatRoomRequestDto;
import com.almaengi.be.domain.chat.dto.ChatRoomResponseDto;
import com.almaengi.be.domain.chat.service.ChatRoomService;
import com.almaengi.be.domain.chat.type.ChatMemberRole;
import com.almaengi.be.domain.chat.type.ChatRoomType;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ChatRoomController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@DisplayName("ChatRoomController Step3 WebMvc 테스트")
class ChatRoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ChatRoomService chatRoomService;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private RedisTokenRepository redisTokenRepository;

    @Nested
    @DisplayName("DM 방 생성/재사용 API")
    class CreateDirectRoomApiTest {

        @Test
        @DisplayName("성공: 유효한 요청이면 DM RoomDetail 반환")
        void createDirectRoom_success() throws Exception {
            Long storeId = 1L;

            ChatRoomRequestDto.CreateDirect request = new ChatRoomRequestDto.CreateDirect();
            ReflectionTestUtils.setField(request, "targetUserId", 2L);

            ChatRoomResponseDto.RoomDetail mockResponse = ChatRoomResponseDto.RoomDetail.builder()
                    .roomId(201L)
                    .storeId(storeId)
                    .roomType(ChatRoomType.DM)
                    .name(null)
                    .sortPriority(0)
                    .isArchived(false)
                    .members(List.of())
                    .build();

            Mockito.when(chatRoomService.createOrGetDirectRoom(any(), eq(storeId), any(ChatRoomRequestDto.CreateDirect.class)))
                    .thenReturn(mockResponse);

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/dm", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.roomId").value(201L))
                    .andExpect(jsonPath("$.data.roomType").value("DM"));
        }

        @Test
        @DisplayName("실패: targetUserId 누락 시 400 + G002")
        void createDirectRoom_failByValidation() throws Exception {
            Long storeId = 1L;
            String invalidJson = "{}";

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/dm", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }

        @Test
        @DisplayName("실패: 잘못된 DM 페어면 400 + C006")
        void createDirectRoom_failInvalidPair() throws Exception {
            Long storeId = 1L;

            ChatRoomRequestDto.CreateDirect request = new ChatRoomRequestDto.CreateDirect();
            ReflectionTestUtils.setField(request, "targetUserId", 1L);

            Mockito.when(chatRoomService.createOrGetDirectRoom(any(), eq(storeId), any(ChatRoomRequestDto.CreateDirect.class)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_INVALID_DM_PAIR));

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/dm", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("C006"))
                    .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_INVALID_DM_PAIR.getMessage()));
        }

        @Test
        @DisplayName("실패: 기존 DM이지만 활성 멤버가 아니면 403 + C003")
        void createDirectRoom_failNotActiveMember() throws Exception {
            Long storeId = 1L;

            ChatRoomRequestDto.CreateDirect request = new ChatRoomRequestDto.CreateDirect();
            ReflectionTestUtils.setField(request, "targetUserId", 2L);

            Mockito.when(chatRoomService.createOrGetDirectRoom(any(), eq(storeId), any(ChatRoomRequestDto.CreateDirect.class)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_MEMBER_NOT_ACTIVE));

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/dm", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("C003"))
                    .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_MEMBER_NOT_ACTIVE.getMessage()));
        }
    }

    @Nested
    @DisplayName("그룹 방 생성 API")
    class CreateGroupRoomApiTest {

        @Test
        @DisplayName("성공: 유효한 요청이면 RoomDetail을 반환한다")
        void createGroupRoom_success() throws Exception {
            Long storeId = 1L;

            ChatRoomRequestDto.CreateGroup request = new ChatRoomRequestDto.CreateGroup();
            ReflectionTestUtils.setField(request, "name", "오픈조 인수인계");
            ReflectionTestUtils.setField(request, "memberUserIds", List.of(2L, 3L));

            ChatRoomResponseDto.MemberInfo owner = ChatRoomResponseDto.MemberInfo.builder()
                    .userId(1L)
                    .name("사장")
                    .role(ChatMemberRole.OWNER)
                    .joinedAt(LocalDateTime.of(2026, 3, 20, 9, 0))
                    .build();

            ChatRoomResponseDto.MemberInfo member = ChatRoomResponseDto.MemberInfo.builder()
                    .userId(2L)
                    .name("직원A")
                    .role(ChatMemberRole.MEMBER)
                    .joinedAt(LocalDateTime.of(2026, 3, 20, 9, 1))
                    .build();

            ChatRoomResponseDto.RoomDetail mockResponse = ChatRoomResponseDto.RoomDetail.builder()
                    .roomId(100L)
                    .storeId(storeId)
                    .roomType(ChatRoomType.GROUP)
                    .name("오픈조 인수인계")
                    .sortPriority(0)
                    .isArchived(false)
                    .lastMessageId(null)
                    .lastMessageAt(null)
                    .members(List.of(owner, member))
                    .build();

            Mockito.when(chatRoomService.createGroupRoom(any(), eq(storeId), any(ChatRoomRequestDto.CreateGroup.class)))
                    .thenReturn(mockResponse);

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/group", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.roomId").value(100L))
                    .andExpect(jsonPath("$.data.roomType").value("GROUP"))
                    .andExpect(jsonPath("$.data.name").value("오픈조 인수인계"))
                    .andExpect(jsonPath("$.data.members.length()").value(2))
                    .andExpect(jsonPath("$.data.members[0].role").value("OWNER"));
        }

        @Test
        @DisplayName("실패: name이 blank면 G002(Bad Request)")
        void createGroupRoom_failByValidation() throws Exception {
            Long storeId = 1L;
            String invalidJson = """
                    {
                      "name": "",
                      "memberUserIds": [2, 3]
                    }
                    """;

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/group", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }

        @Test
        @DisplayName("실패: 서비스에서 C002를 던지면 403 + C002로 응답")
        void createGroupRoom_failByBusinessException() throws Exception {
            Long storeId = 1L;

            ChatRoomRequestDto.CreateGroup request = new ChatRoomRequestDto.CreateGroup();
            ReflectionTestUtils.setField(request, "name", "권한테스트");
            ReflectionTestUtils.setField(request, "memberUserIds", List.of(2L));

            Mockito.when(chatRoomService.createGroupRoom(any(), eq(storeId), any(ChatRoomRequestDto.CreateGroup.class)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_ROOM_ACCESS_DENIED));

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/group", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("C002"))
                    .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_ROOM_ACCESS_DENIED.getMessage()))
                    .andExpect(jsonPath("$.data").value(nullValue()));
        }
    }

    @Nested
    @DisplayName("BOT 방 생성/재사용 API")
    class CreateBotRoomApiTest {

        @Test
        @DisplayName("성공: 유효한 요청이면 BOT RoomDetail 반환")
        void createBotRoom_success() throws Exception {
            Long storeId = 1L;

            ChatRoomRequestDto.CreateBot request = new ChatRoomRequestDto.CreateBot();
            ReflectionTestUtils.setField(request, "name", "AI 업무 도우미");

            ChatRoomResponseDto.RoomDetail mockResponse = ChatRoomResponseDto.RoomDetail.builder()
                    .roomId(300L)
                    .storeId(storeId)
                    .roomType(ChatRoomType.BOT)
                    .name("AI 업무 도우미")
                    .sortPriority(10_000)
                    .isArchived(false)
                    .members(List.of())
                    .build();

            Mockito.when(chatRoomService.createOrGetBotRoom(any(), eq(storeId), any(ChatRoomRequestDto.CreateBot.class)))
                    .thenReturn(mockResponse);

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/bot", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.roomType").value("BOT"))
                    .andExpect(jsonPath("$.data.sortPriority").value(10_000));
        }

        @Test
        @DisplayName("실패: name이 blank면 400 + G002")
        void createBotRoom_failByValidation() throws Exception {
            Long storeId = 1L;
            String invalidJson = """
                    {
                      "name": ""
                    }
                    """;

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/bot", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }

        @Test
        @DisplayName("실패: 매장 경계 권한 없으면 403 + C002")
        void createBotRoom_failAccessDenied() throws Exception {
            Long storeId = 1L;

            ChatRoomRequestDto.CreateBot request = new ChatRoomRequestDto.CreateBot();
            ReflectionTestUtils.setField(request, "name", "AI 업무 도우미");

            Mockito.when(chatRoomService.createOrGetBotRoom(any(), eq(storeId), any(ChatRoomRequestDto.CreateBot.class)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_ROOM_ACCESS_DENIED));

            mockMvc.perform(post("/api/v1/chat/stores/{storeId}/rooms/bot", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("C002"))
                    .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_ROOM_ACCESS_DENIED.getMessage()));
        }
    }

    @Nested
    @DisplayName("방 이름 수정 API")
    class UpdateRoomNameApiTest {

        @Test
        @DisplayName("실패: OWNER가 아니면 403 + C002")
        void updateRoomName_failNotOwner() throws Exception {
            Long roomId = 55L;

            ChatRoomRequestDto.UpdateName request = new ChatRoomRequestDto.UpdateName();
            ReflectionTestUtils.setField(request, "name", "새 공지방 이름");

            Mockito.when(chatRoomService.updateRoomName(any(), eq(roomId), any(ChatRoomRequestDto.UpdateName.class)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_ROOM_ACCESS_DENIED));

            mockMvc.perform(patch("/api/v1/chat/rooms/{roomId}", roomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("C002"))
                    .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_ROOM_ACCESS_DENIED.getMessage()));
        }

        @Test
        @DisplayName("실패: GROUP 타입이 아닌 방 수정 시 400 + C008")
        void updateRoomName_failNotGroupType() throws Exception {
            Long roomId = 56L;

            ChatRoomRequestDto.UpdateName request = new ChatRoomRequestDto.UpdateName();
            ReflectionTestUtils.setField(request, "name", "수정 시도");

            Mockito.when(chatRoomService.updateRoomName(any(), eq(roomId), any(ChatRoomRequestDto.UpdateName.class)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_INVALID_REFERENCE));

            mockMvc.perform(patch("/api/v1/chat/rooms/{roomId}", roomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("C008"))
                    .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_INVALID_REFERENCE.getMessage()));
        }
    }

    @Nested
    @DisplayName("방 목록 조회 API")
    class GetRoomsApiTest {

        @Test
        @DisplayName("성공: 목록 조회 시 RoomSummary 배열 반환")
        void getRooms_success() throws Exception {
            Long storeId = 1L;

            ChatRoomResponseDto.RoomSummary bot = ChatRoomResponseDto.RoomSummary.builder()
                    .roomId(400L)
                    .roomType(ChatRoomType.BOT)
                    .name("AI 업무 도우미")
                    .sortPriority(10_000)
                    .lastMessageId(1000L)
                    .lastMessagePreview("업무 요약입니다")
                    .lastMessageAt(LocalDateTime.of(2026, 3, 20, 10, 0))
                    .unreadCount(0)
                    .memberCount(3)
                    .build();

            ChatRoomResponseDto.RoomSummary group = ChatRoomResponseDto.RoomSummary.builder()
                    .roomId(401L)
                    .roomType(ChatRoomType.GROUP)
                    .name("오픈조")
                    .sortPriority(0)
                    .lastMessageId(999L)
                    .lastMessagePreview("오늘 전달사항")
                    .lastMessageAt(LocalDateTime.of(2026, 3, 20, 9, 0))
                    .unreadCount(2)
                    .memberCount(5)
                    .build();

            Mockito.when(chatRoomService.getRooms(any(), eq(storeId))).thenReturn(List.of(bot, group));

            mockMvc.perform(get("/api/v1/chat/stores/{storeId}/rooms", storeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.length()").value(2))
                    .andExpect(jsonPath("$.data[0].roomId").value(400L))
                    .andExpect(jsonPath("$.data[0].roomType").value("BOT"));
        }

        @Test
        @DisplayName("실패: 매장 경계 권한 없으면 403 + C002")
        void getRooms_failAccessDenied() throws Exception {
            Long storeId = 1L;

            Mockito.when(chatRoomService.getRooms(any(), eq(storeId)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_ROOM_ACCESS_DENIED));

            mockMvc.perform(get("/api/v1/chat/stores/{storeId}/rooms", storeId))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("C002"))
                    .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_ROOM_ACCESS_DENIED.getMessage()));
        }
    }

    @Nested
    @DisplayName("방 상세 조회 API")
    class GetRoomApiTest {

        @Test
        @DisplayName("실패: 활성 멤버가 아니면 403 + C003")
        void getRoom_failNotActiveMember() throws Exception {
            Long roomId = 77L;

            Mockito.when(chatRoomService.getRoom(any(), eq(roomId)))
                    .thenThrow(new BusinessException(ErrorCode.CHAT_MEMBER_NOT_ACTIVE));

            mockMvc.perform(get("/api/v1/chat/rooms/{roomId}", roomId))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("C003"))
                    .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_MEMBER_NOT_ACTIVE.getMessage()));
        }
    }
}
