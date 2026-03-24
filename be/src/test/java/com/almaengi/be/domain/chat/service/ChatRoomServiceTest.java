package com.almaengi.be.domain.chat.service;

import com.almaengi.be.domain.chat.ChatBotProperties;
import com.almaengi.be.domain.chat.dto.ChatRoomRequestDto;
import com.almaengi.be.domain.chat.dto.ChatRoomResponseDto;
import com.almaengi.be.domain.chat.entity.ChatDirectPair;
import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.entity.ChatRoomMember;
import com.almaengi.be.domain.chat.repository.ChatDirectPairRepository;
import com.almaengi.be.domain.chat.repository.ChatMessageRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomMemberRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomRepository;
import com.almaengi.be.domain.chat.type.ChatMemberRole;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Constructor;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatRoomService Step3 단위 테스트")
class ChatRoomServiceTest {

    @InjectMocks
    private ChatRoomService chatRoomService;

    @Mock
    private ChatRoomRepository chatRoomRepository;
    @Mock
    private ChatRoomMemberRepository chatRoomMemberRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private ChatDirectPairRepository chatDirectPairRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ChatIntegrityValidator chatIntegrityValidator;
    @Mock
    private ChatBotProperties chatBotProperties;

    @Nested
    @DisplayName("DM 생성/재사용")
    class DirectRoomTest {

        @Test
        @DisplayName("새 DM 생성: room/member/directPair 저장 후 상세 반환")
        void createOrGetDirectRoom_createNewSuccess() {
            Long storeId = 1L;
            Long requesterId = 10L;
            Long targetId = 11L;

            User requester = user(requesterId, "사장");
            User target = user(targetId, "직원");
            Store store = store(storeId, requester);

            ChatRoom room = chatRoom(100L, store, requester, ChatRoomType.DM, null, 0);

            ChatRoomRequestDto.CreateDirect request = new ChatRoomRequestDto.CreateDirect();
            ReflectionTestUtils.setField(request, "targetUserId", targetId);

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(userRepository.findById(requesterId)).willReturn(Optional.of(requester));
            given(userRepository.findById(targetId)).willReturn(Optional.of(target));
            given(storeEmployeeRepository.findByStoreIdAndUserId(storeId, targetId))
                    .willReturn(Optional.of(employee(store, target, StoreEmployeeStatus.WORKING)));
            given(chatIntegrityValidator.normalizeDmPair(requesterId, targetId))
                    .willReturn(new ChatIntegrityValidator.DmPair(requesterId, targetId));
            given(chatDirectPairRepository.findByStoreIdAndUser1IdAndUser2Id(storeId, requesterId, targetId))
                    .willReturn(Optional.empty());
            given(chatRoomRepository.save(any(ChatRoom.class))).willReturn(room);
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(100L)).willReturn(List.of(
                    ChatRoomMember.builder().room(room).user(requester).memberRole(ChatMemberRole.OWNER).build(),
                    ChatRoomMember.builder().room(room).user(target).memberRole(ChatMemberRole.MEMBER).build()
            ));

            ChatRoomResponseDto.RoomDetail response = chatRoomService.createOrGetDirectRoom(requesterId, storeId, request);

            assertThat(response.getRoomId()).isEqualTo(100L);
            assertThat(response.getRoomType()).isEqualTo(ChatRoomType.DM);
            verify(chatRoomRepository, times(1)).save(any(ChatRoom.class));
            verify(chatRoomMemberRepository, times(2)).save(any(ChatRoomMember.class));
            verify(chatDirectPairRepository, times(1)).save(any(ChatDirectPair.class));
        }

        @Test
        @DisplayName("기존 DM 재사용: 기존 방 반환, 신규 room/member/directPair 저장 없음")
        void createOrGetDirectRoom_reuseExistingSuccess() {
            Long storeId = 1L;
            Long requesterId = 10L;
            Long targetId = 11L;

            User requester = user(requesterId, "사장");
            User target = user(targetId, "직원");
            Store store = store(storeId, requester);

            ChatRoom existingRoom = chatRoom(101L, store, requester, ChatRoomType.DM, null, 0);
            ChatDirectPair pair = ChatDirectPair.builder()
                    .store(store)
                    .user1(requester)
                    .user2(target)
                    .room(existingRoom)
                    .build();

            ChatRoomRequestDto.CreateDirect request = new ChatRoomRequestDto.CreateDirect();
            ReflectionTestUtils.setField(request, "targetUserId", targetId);

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(userRepository.findById(requesterId)).willReturn(Optional.of(requester));
            given(userRepository.findById(targetId)).willReturn(Optional.of(target));
            given(storeEmployeeRepository.findByStoreIdAndUserId(storeId, targetId))
                    .willReturn(Optional.of(employee(store, target, StoreEmployeeStatus.WORKING)));
            given(chatIntegrityValidator.normalizeDmPair(requesterId, targetId))
                    .willReturn(new ChatIntegrityValidator.DmPair(requesterId, targetId));
            given(chatDirectPairRepository.findByStoreIdAndUser1IdAndUser2Id(storeId, requesterId, targetId))
                    .willReturn(Optional.of(pair));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(101L, requesterId)).willReturn(true);
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(101L)).willReturn(List.of(
                    ChatRoomMember.builder().room(existingRoom).user(requester).memberRole(ChatMemberRole.OWNER).build(),
                    ChatRoomMember.builder().room(existingRoom).user(target).memberRole(ChatMemberRole.MEMBER).build()
            ));

            ChatRoomResponseDto.RoomDetail response = chatRoomService.createOrGetDirectRoom(requesterId, storeId, request);

            assertThat(response.getRoomId()).isEqualTo(101L);
            verify(chatRoomRepository, never()).save(any(ChatRoom.class));
            verify(chatRoomMemberRepository, never()).save(any(ChatRoomMember.class));
            verify(chatDirectPairRepository, never()).save(any(ChatDirectPair.class));
        }

        @Test
        @DisplayName("기존 DM 재사용 실패: 요청자가 비활성 멤버면 CHAT_MEMBER_NOT_ACTIVE")
        void createOrGetDirectRoom_failWhenRequesterNotActiveMember() {
            Long storeId = 1L;
            Long requesterId = 10L;
            Long targetId = 11L;

            User requester = user(requesterId, "사장");
            User target = user(targetId, "직원");
            Store store = store(storeId, requester);

            ChatRoom existingRoom = chatRoom(101L, store, requester, ChatRoomType.DM, null, 0);
            ChatDirectPair pair = ChatDirectPair.builder()
                    .store(store)
                    .user1(requester)
                    .user2(target)
                    .room(existingRoom)
                    .build();

            ChatRoomRequestDto.CreateDirect request = new ChatRoomRequestDto.CreateDirect();
            ReflectionTestUtils.setField(request, "targetUserId", targetId);

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(userRepository.findById(requesterId)).willReturn(Optional.of(requester));
            given(userRepository.findById(targetId)).willReturn(Optional.of(target));
            given(storeEmployeeRepository.findByStoreIdAndUserId(storeId, targetId))
                    .willReturn(Optional.of(employee(store, target, StoreEmployeeStatus.WORKING)));
            given(chatIntegrityValidator.normalizeDmPair(requesterId, targetId))
                    .willReturn(new ChatIntegrityValidator.DmPair(requesterId, targetId));
            given(chatDirectPairRepository.findByStoreIdAndUser1IdAndUser2Id(storeId, requesterId, targetId))
                    .willReturn(Optional.of(pair));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(101L, requesterId)).willReturn(false);

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatRoomService.createOrGetDirectRoom(requesterId, storeId, request));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_MEMBER_NOT_ACTIVE);
        }
    }

    @Nested
    @DisplayName("그룹 방 생성/수정")
    class GroupRoomTest {

        @Test
        @DisplayName("요청자 ID가 초대 목록에 있어도 OWNER 1건 + 초대멤버만 저장")
        void createGroupRoom_excludesRequesterFromInviteMembers() {
            Long storeId = 1L;
            Long requesterId = 10L;
            Long inviteeId = 11L;

            User requester = user(requesterId, "사장");
            User invitee = user(inviteeId, "직원");
            Store store = store(storeId, requester);
            ChatRoom room = chatRoom(110L, store, requester, ChatRoomType.GROUP, "오픈조", 0);

            ChatRoomRequestDto.CreateGroup request = new ChatRoomRequestDto.CreateGroup();
            ReflectionTestUtils.setField(request, "name", "오픈조");
            ReflectionTestUtils.setField(request, "memberUserIds", List.of(requesterId, inviteeId, inviteeId));

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(userRepository.findById(requesterId)).willReturn(Optional.of(requester));
            given(chatRoomRepository.save(any(ChatRoom.class))).willReturn(room);
            given(userRepository.findAllById(any())).willReturn(List.of(invitee));
            given(storeEmployeeRepository.findByStoreIdAndUserId(storeId, inviteeId))
                    .willReturn(Optional.of(employee(store, invitee, StoreEmployeeStatus.WORKING)));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(110L)).willReturn(List.of());

            chatRoomService.createGroupRoom(requesterId, storeId, request);

            ArgumentCaptor<ChatRoomMember> captor = ArgumentCaptor.forClass(ChatRoomMember.class);
            verify(chatRoomMemberRepository, times(2)).save(captor.capture());

            List<ChatRoomMember> savedMembers = captor.getAllValues();
            assertThat(savedMembers).hasSize(2);
            assertThat(savedMembers.stream().filter(m -> m.getMemberRole() == ChatMemberRole.OWNER).count()).isEqualTo(1);
            assertThat(savedMembers.stream().filter(m -> m.getMemberRole() == ChatMemberRole.MEMBER).count()).isEqualTo(1);

            Set<Long> userIds = new LinkedHashSet<>();
            for (ChatRoomMember member : savedMembers) {
                userIds.add(member.getUser().getId());
            }
            assertThat(userIds).containsExactlyInAnyOrder(requesterId, inviteeId);
        }

        @Test
        @DisplayName("그룹 방 생성 실패: 초대 멤버 중 조회 누락이 있으면 USER_NOT_FOUND")
        void createGroupRoom_failWhenInviteeNotFound() {
            Long storeId = 1L;
            Long requesterId = 10L;
            Long missingUserId = 12L;

            User requester = user(requesterId, "사장");
            Store store = store(storeId, requester);
            ChatRoom room = chatRoom(111L, store, requester, ChatRoomType.GROUP, "마감조", 0);

            ChatRoomRequestDto.CreateGroup request = new ChatRoomRequestDto.CreateGroup();
            ReflectionTestUtils.setField(request, "name", "마감조");
            ReflectionTestUtils.setField(request, "memberUserIds", List.of(missingUserId));

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(userRepository.findById(requesterId)).willReturn(Optional.of(requester));
            given(chatRoomRepository.save(any(ChatRoom.class))).willReturn(room);
            given(userRepository.findAllById(any())).willReturn(List.of());

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatRoomService.createGroupRoom(requesterId, storeId, request));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND);
        }

        @Test
        @DisplayName("방 이름 수정 성공: OWNER + GROUP 조건 충족")
        void updateRoomName_success() {
            Long roomId = 120L;
            Long ownerId = 10L;

            User owner = user(ownerId, "사장");
            Store store = store(1L, owner);
            ChatRoom room = chatRoom(roomId, store, owner, ChatRoomType.GROUP, "기존방", 0);

            ChatRoomMember ownerMember = ChatRoomMember.builder()
                    .room(room)
                    .user(owner)
                    .memberRole(ChatMemberRole.OWNER)
                    .build();

            ChatRoomRequestDto.UpdateName request = new ChatRoomRequestDto.UpdateName();
            ReflectionTestUtils.setField(request, "name", "변경된방");

            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, ownerId))
                    .willReturn(Optional.of(ownerMember));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(roomId)).willReturn(List.of(ownerMember));

            ChatRoomResponseDto.RoomDetail response = chatRoomService.updateRoomName(ownerId, roomId, request);

            assertThat(response.getName()).isEqualTo("변경된방");
        }

        @Test
        @DisplayName("방 이름 수정 실패: OWNER가 아니면 CHAT_ROOM_ACCESS_DENIED")
        void updateRoomName_failWhenNotOwner() {
            Long roomId = 121L;
            Long requesterId = 11L;

            User owner = user(10L, "사장");
            User memberUser = user(requesterId, "직원");
            Store store = store(1L, owner);
            ChatRoom room = chatRoom(roomId, store, owner, ChatRoomType.GROUP, "기존방", 0);

            ChatRoomMember member = ChatRoomMember.builder()
                    .room(room)
                    .user(memberUser)
                    .memberRole(ChatMemberRole.MEMBER)
                    .build();

            ChatRoomRequestDto.UpdateName request = new ChatRoomRequestDto.UpdateName();
            ReflectionTestUtils.setField(request, "name", "새 이름");

            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, requesterId))
                    .willReturn(Optional.of(member));

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatRoomService.updateRoomName(requesterId, roomId, request));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }

        @Test
        @DisplayName("방 이름 수정 실패: GROUP 타입이 아니면 CHAT_INVALID_REFERENCE")
        void updateRoomName_failWhenRoomTypeIsNotGroup() {
            Long roomId = 122L;
            Long ownerId = 10L;

            User owner = user(ownerId, "사장");
            Store store = store(1L, owner);
            ChatRoom dmRoom = chatRoom(roomId, store, owner, ChatRoomType.DM, null, 0);

            ChatRoomMember ownerMember = ChatRoomMember.builder()
                    .room(dmRoom)
                    .user(owner)
                    .memberRole(ChatMemberRole.OWNER)
                    .build();

            ChatRoomRequestDto.UpdateName request = new ChatRoomRequestDto.UpdateName();
            ReflectionTestUtils.setField(request, "name", "새 이름");

            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(dmRoom));
            given(chatRoomMemberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, ownerId))
                    .willReturn(Optional.of(ownerMember));

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatRoomService.updateRoomName(ownerId, roomId, request));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_INVALID_REFERENCE);
        }
    }

    @Nested
    @DisplayName("BOT 방 생성/재사용")
    class BotRoomTest {

        @Test
        @DisplayName("개인 BOT 방 재사용: 같은 사용자 요청이면 동일 roomId 반환")
        void createOrGetBotRoom_reusePersonalBotRoom() {
            Long storeId = 1L;
            Long requesterId = 10L;

            User requester = user(requesterId, "사장");
            Store store = store(storeId, requester);
            ChatRoom botRoom = chatRoom(130L, store, requester, ChatRoomType.BOT, "AI 업무 도우미", 0);

            ChatRoomRequestDto.CreateBot request = new ChatRoomRequestDto.CreateBot();
            ReflectionTestUtils.setField(request, "name", "AI 업무 도우미");

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(userRepository.findById(requesterId)).willReturn(Optional.of(requester));
            given(chatRoomRepository.findPersonalBotRoom(storeId, requesterId, ChatRoomType.BOT))
                    .willReturn(Optional.of(botRoom));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(130L)).willReturn(List.of());

            ChatRoomResponseDto.RoomDetail first = chatRoomService.createOrGetBotRoom(requesterId, storeId, request);
            ChatRoomResponseDto.RoomDetail second = chatRoomService.createOrGetBotRoom(requesterId, storeId, request);

            assertThat(first.getRoomId()).isEqualTo(130L);
            assertThat(second.getRoomId()).isEqualTo(130L);
            assertThat(botRoom.getSortPriority()).isEqualTo(10_000);
            verify(chatRoomMemberRepository, never()).save(any(ChatRoomMember.class));
        }

        @Test
        @DisplayName("개인 BOT 방 신규 생성: 사용자별 BOT 방이 없으면 새로 저장")
        void createOrGetBotRoom_createPersonalBotRoomWhenNotExists() {
            Long storeId = 1L;
            Long requesterId = 10L;

            User requester = user(requesterId, "사장");
            Store store = store(storeId, requester);
            ChatRoom savedRoom = chatRoom(131L, store, requester, ChatRoomType.BOT, "AI 업무 도우미", 10_000);

            User botUser = user(999L, "알맹이봇");
            given(chatBotProperties.getBotUserId()).willReturn(999L);
            given(userRepository.findById(999L)).willReturn(Optional.of(botUser));
            given(chatMessageRepository.save(any(ChatMessage.class))).willAnswer(invocation -> {
                ChatMessage msg = invocation.getArgument(0);
                ReflectionTestUtils.setField(msg, "id", 3000L);
                return msg;
            });

            ChatRoomRequestDto.CreateBot request = new ChatRoomRequestDto.CreateBot();
            ReflectionTestUtils.setField(request, "name", "AI 업무 도우미");

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(userRepository.findById(requesterId)).willReturn(Optional.of(requester));
            given(chatRoomRepository.findPersonalBotRoom(storeId, requesterId, ChatRoomType.BOT))
                    .willReturn(Optional.empty());
            given(chatRoomRepository.save(any(ChatRoom.class))).willReturn(savedRoom);
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(131L)).willReturn(List.of());

            ChatRoomResponseDto.RoomDetail response = chatRoomService.createOrGetBotRoom(requesterId, storeId, request);

            assertThat(response.getRoomId()).isEqualTo(131L);
            verify(chatRoomRepository, times(1)).save(any(ChatRoom.class));
            verify(chatRoomMemberRepository, times(1)).save(any(ChatRoomMember.class));
            verify(chatMessageRepository, times(1)).save(any(ChatMessage.class));
        }

        @Test
        @DisplayName("개인 BOT 방 분리: 서로 다른 사용자는 서로 다른 BOT 방을 사용")
        void createOrGetBotRoom_isolatedPerUser() {
            Long storeId = 1L;
            Long ownerId = 10L;
            Long employeeId = 11L;

            User owner = user(ownerId, "사장");
            User employee = user(employeeId, "직원");
            Store store = store(storeId, owner);

            ChatRoom ownerBotRoom = chatRoom(201L, store, owner, ChatRoomType.BOT, "AI 업무 도우미", 10_000);
            ChatRoom employeeBotRoom = chatRoom(202L, store, employee, ChatRoomType.BOT, "AI 업무 도우미", 10_000);

            ChatRoomRequestDto.CreateBot request = new ChatRoomRequestDto.CreateBot();
            ReflectionTestUtils.setField(request, "name", "AI 업무 도우미");

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(userRepository.findById(ownerId)).willReturn(Optional.of(owner));
            given(userRepository.findById(employeeId)).willReturn(Optional.of(employee));
            given(storeEmployeeRepository.findByStoreIdAndUserId(storeId, employeeId))
                    .willReturn(Optional.of(employee(store, employee, StoreEmployeeStatus.WORKING)));

            given(chatRoomRepository.findPersonalBotRoom(storeId, ownerId, ChatRoomType.BOT))
                    .willReturn(Optional.of(ownerBotRoom));
            given(chatRoomRepository.findPersonalBotRoom(storeId, employeeId, ChatRoomType.BOT))
                    .willReturn(Optional.of(employeeBotRoom));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(201L)).willReturn(List.of());
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(202L)).willReturn(List.of());

            ChatRoomResponseDto.RoomDetail ownerResponse = chatRoomService.createOrGetBotRoom(ownerId, storeId, request);
            ChatRoomResponseDto.RoomDetail employeeResponse = chatRoomService.createOrGetBotRoom(employeeId, storeId, request);

            assertThat(ownerResponse.getRoomId()).isEqualTo(201L);
            assertThat(employeeResponse.getRoomId()).isEqualTo(202L);
            assertThat(ownerResponse.getRoomId()).isNotEqualTo(employeeResponse.getRoomId());
        }
    }

    @Nested
    @DisplayName("조회/권한 검증")
    class QueryAndAuthorizationTest {

        @Test
        @DisplayName("방 목록 조회: sortPriority DESC, lastMessageAt DESC 정렬")
        void getRooms_sortsByPriorityThenLastMessageAt() {
            Long storeId = 1L;
            Long requesterId = 10L;

            User owner = user(requesterId, "사장");
            User member = user(11L, "직원");
            Store store = store(storeId, owner);

            ChatRoom normalRecent = chatRoom(140L, store, owner, ChatRoomType.GROUP, "일반방", 0);
            ReflectionTestUtils.setField(normalRecent, "lastMessageAt", LocalDateTime.of(2026, 3, 20, 10, 0));

            ChatRoom botTop = chatRoom(141L, store, owner, ChatRoomType.BOT, "봇방", 10_000);
            ReflectionTestUtils.setField(botTop, "lastMessageAt", LocalDateTime.of(2026, 3, 20, 9, 0));

            ChatRoom normalOld = chatRoom(142L, store, owner, ChatRoomType.GROUP, "공지방", 0);
            ReflectionTestUtils.setField(normalOld, "lastMessageAt", LocalDateTime.of(2026, 3, 19, 12, 0));

            List<ChatRoomMember> memberships = List.of(
                    ChatRoomMember.builder().room(normalOld).user(owner).memberRole(ChatMemberRole.OWNER).build(),
                    ChatRoomMember.builder().room(botTop).user(owner).memberRole(ChatMemberRole.OWNER).build(),
                    ChatRoomMember.builder().room(normalRecent).user(owner).memberRole(ChatMemberRole.OWNER).build()
            );

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(chatRoomMemberRepository.findActiveMembersWithRoomByUserIdAndStoreId(requesterId, storeId)).willReturn(memberships);

            given(chatMessageRepository.findTopByRoomIdOrderByIdDesc(141L))
                    .willReturn(Optional.of(chatMessage(900L, botTop, owner, "봇 응답")));
            given(chatMessageRepository.findTopByRoomIdOrderByIdDesc(140L))
                    .willReturn(Optional.of(chatMessage(901L, normalRecent, member, "최근 일반")));
            given(chatMessageRepository.findTopByRoomIdOrderByIdDesc(142L))
                    .willReturn(Optional.of(chatMessage(902L, normalOld, owner, "오래된 일반")));

            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(141L)).willReturn(List.of(
                    ChatRoomMember.builder().room(botTop).user(owner).memberRole(ChatMemberRole.OWNER).build(),
                    ChatRoomMember.builder().room(botTop).user(member).memberRole(ChatMemberRole.MEMBER).build()
            ));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(140L)).willReturn(List.of(
                    ChatRoomMember.builder().room(normalRecent).user(owner).memberRole(ChatMemberRole.OWNER).build()
            ));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(142L)).willReturn(List.of(
                    ChatRoomMember.builder().room(normalOld).user(owner).memberRole(ChatMemberRole.OWNER).build()
            ));

            List<ChatRoomResponseDto.RoomSummary> result = chatRoomService.getRooms(requesterId, storeId);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).getRoomId()).isEqualTo(141L);
            assertThat(result.get(1).getRoomId()).isEqualTo(140L);
            assertThat(result.get(2).getRoomId()).isEqualTo(142L);
            assertThat(result.get(0).getMemberCount()).isEqualTo(2);
            assertThat(result.get(0).getLastMessagePreview()).isEqualTo("봇 응답");
        }

        @Test
        @DisplayName("방 목록 조회: lastReadMessageId가 null이면 전체 메시지 수를 unread로 계산")
        void getRooms_unreadCountWhenLastReadIsNull() {
            Long storeId = 1L;
            Long requesterId = 10L;

            User owner = user(requesterId, "사장");
            Store store = store(storeId, owner);
            ChatRoom room = chatRoom(160L, store, owner, ChatRoomType.GROUP, "공지방", 0);

            ChatRoomMember membership = ChatRoomMember.builder()
                    .room(room)
                    .user(owner)
                    .memberRole(ChatMemberRole.OWNER)
                    .build();

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(chatRoomMemberRepository.findActiveMembersWithRoomByUserIdAndStoreId(requesterId, storeId))
                    .willReturn(List.of(membership));
            given(chatMessageRepository.findTopByRoomIdOrderByIdDesc(160L))
                    .willReturn(Optional.of(chatMessage(910L, room, owner, "최근 공지")));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(160L)).willReturn(List.of(membership));
            given(chatMessageRepository.countByRoomId(160L)).willReturn(7L);

            List<ChatRoomResponseDto.RoomSummary> result = chatRoomService.getRooms(requesterId, storeId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUnreadCount()).isEqualTo(7L);
            verify(chatMessageRepository, times(1)).countByRoomId(160L);
        }

        @Test
        @DisplayName("방 목록 조회: lastReadMessageId가 있으면 이후 메시지 수를 unread로 계산")
        void getRooms_unreadCountWhenLastReadExists() {
            Long storeId = 1L;
            Long requesterId = 10L;

            User owner = user(requesterId, "사장");
            Store store = store(storeId, owner);
            ChatRoom room = chatRoom(161L, store, owner, ChatRoomType.GROUP, "오픈조", 0);

            ChatRoomMember membership = ChatRoomMember.builder()
                    .room(room)
                    .user(owner)
                    .memberRole(ChatMemberRole.OWNER)
                    .build();
            membership.updateLastRead(1200L, LocalDateTime.now());

            given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
            given(chatRoomMemberRepository.findActiveMembersWithRoomByUserIdAndStoreId(requesterId, storeId))
                    .willReturn(List.of(membership));
            given(chatMessageRepository.findTopByRoomIdOrderByIdDesc(161L))
                    .willReturn(Optional.of(chatMessage(920L, room, owner, "최근 전달")));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(161L)).willReturn(List.of(membership));
            given(chatMessageRepository.countByRoomIdAndIdGreaterThan(161L, 1200L)).willReturn(3L);

            List<ChatRoomResponseDto.RoomSummary> result = chatRoomService.getRooms(requesterId, storeId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUnreadCount()).isEqualTo(3L);
            verify(chatMessageRepository, times(1)).countByRoomIdAndIdGreaterThan(161L, 1200L);
            verify(chatMessageRepository, never()).countByRoomId(161L);
        }

        @Test
        @DisplayName("방 상세 조회 실패: 활성 멤버가 아니면 CHAT_MEMBER_NOT_ACTIVE")
        void getRoom_failWhenRequesterNotActiveMember() {
            Long roomId = 150L;
            Long requesterId = 10L;

            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, requesterId)).willReturn(false);

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatRoomService.getRoom(requesterId, roomId));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_MEMBER_NOT_ACTIVE);
        }

        @Test
        @DisplayName("방 상세 조회 성공: 활성 멤버이면 RoomDetail 반환")
        void getRoom_success() {
            Long roomId = 151L;
            Long requesterId = 10L;

            User owner = user(requesterId, "사장");
            Store store = store(1L, owner);
            ChatRoom room = chatRoom(roomId, store, owner, ChatRoomType.GROUP, "공지방", 0);

            ChatRoomMember ownerMember = ChatRoomMember.builder()
                    .room(room)
                    .user(owner)
                    .memberRole(ChatMemberRole.OWNER)
                    .build();

            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, requesterId)).willReturn(true);
            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(roomId)).willReturn(List.of(ownerMember));

            ChatRoomResponseDto.RoomDetail response = chatRoomService.getRoom(requesterId, roomId);

            assertThat(response.getRoomId()).isEqualTo(roomId);
            assertThat(response.getRoomType()).isEqualTo(ChatRoomType.GROUP);
            assertThat(response.getMembers()).hasSize(1);
        }
    }

    private User user(Long id, String name) {
        User user = User.builder()
                .name(name)
                .email(name + "@test.com")
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Store store(Long id, User owner) {
        Store store = Store.builder()
                .owner(owner)
                .name("테스트매장")
                .address("서울시 강남구")
                .phone("010-0000-0000")
                .qrCode("qr-test")
                .isOver5Employees(false)
                .build();
        ReflectionTestUtils.setField(store, "id", id);
        return store;
    }

    private StoreEmployee employee(Store store, User user, StoreEmployeeStatus status) {
        return StoreEmployee.builder()
                .store(store)
                .user(user)
                .status(status)
                .build();
    }

    private ChatRoom chatRoom(Long id, Store store, User createdBy, ChatRoomType roomType, String name, int sortPriority) {
        ChatRoom room = ChatRoom.builder()
                .store(store)
                .roomType(roomType)
                .name(name)
                .createdBy(createdBy)
                .sortPriority(sortPriority)
                .build();
        ReflectionTestUtils.setField(room, "id", id);
        return room;
    }

    private ChatMessage chatMessage(Long id, ChatRoom room, User sender, String content) {
        try {
            Constructor<ChatMessage> constructor = ChatMessage.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            ChatMessage message = constructor.newInstance();
            ReflectionTestUtils.setField(message, "id", id);
            ReflectionTestUtils.setField(message, "room", room);
            ReflectionTestUtils.setField(message, "sender", sender);
            ReflectionTestUtils.setField(message, "messageType", ChatMessageType.TEXT);
            ReflectionTestUtils.setField(message, "content", content);
            ReflectionTestUtils.setField(message, "sentAt", LocalDateTime.now());
            return message;
        } catch (Exception e) {
            throw new IllegalStateException("ChatMessage 테스트 객체 생성 실패", e);
        }
    }
}
