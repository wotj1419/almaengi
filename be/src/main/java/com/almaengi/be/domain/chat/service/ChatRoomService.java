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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRoomService {
    private static final int BOT_SORT_PRIORITY = 10_000;
    private static final int NORMAL_SORT_PRIORITY = 0;
    private static final String DEFAULT_BOT_ROOM_NAME = "알맹이";
    private static final String DEFAULT_BOT_WELCOME_MESSAGE = "안녕하세요! 노동법 관련 궁금한 점을 물어보세요 :)";

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatDirectPairRepository chatDirectPairRepository;
    private final StoreRepository storeRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final UserRepository userRepository;
    private final ChatIntegrityValidator chatIntegrityValidator;
    private final ChatBotProperties chatBotProperties;

    // DM 방 생성 or 사용
    @Transactional
    public ChatRoomResponseDto.RoomDetail createOrGetDirectRoom(Long requesterId, Long storeId, ChatRoomRequestDto.CreateDirect request) {
        Store store = getStoreOrThrow(storeId);

        User requester = getUserOrThrow(requesterId);
        User targetUser = getUserOrThrow(request.getTargetUserId());

        ensureUserBelongsToStore(store, requesterId);
        ensureUserBelongsToStore(store, targetUser.getId());

        ChatIntegrityValidator.DmPair pair = chatIntegrityValidator.normalizeDmPair(requesterId, targetUser.getId());
        Optional<ChatDirectPair> existingPair = chatDirectPairRepository.findByStoreIdAndUser1IdAndUser2Id(storeId, pair.userA(), pair.userB());

        ChatRoom room;
        if(existingPair.isPresent()) {
            room = existingPair.get().getRoom();
            ensureActiveMember(room.getId(), requesterId);
        } else {
            room = chatRoomRepository.save(ChatRoom.builder()
                    .store(store)
                    .roomType(ChatRoomType.DM)
                    .name(null)
                    .createdBy(requester)
                    .sortPriority(NORMAL_SORT_PRIORITY)
                    .build());

            chatRoomMemberRepository.save(ChatRoomMember.builder()
                    .room(room)
                    .user(requester)
                    .memberRole(ChatMemberRole.OWNER)
                    .build());
            chatRoomMemberRepository.save(ChatRoomMember.builder()
                    .room(room)
                    .user(targetUser)
                    .memberRole(ChatMemberRole.MEMBER)
                    .build());

            chatDirectPairRepository.save(ChatDirectPair.builder()
                    .store(store)
                    .user1(getUserOrThrow(pair.userA()))
                    .user2(getUserOrThrow(pair.userB()))
                    .room(room)
                    .build());
        }

        return toRoomDetail(room, requesterId);
    }

    // 그룹방 생성
    @Transactional
    public ChatRoomResponseDto.RoomDetail createGroupRoom(Long requesterId, Long storeId, ChatRoomRequestDto.CreateGroup request) {
        Store store = getStoreOrThrow(storeId);
        User requester = getUserOrThrow(requesterId);

        ensureUserBelongsToStore(store, requesterId);

        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .store(store)
                .roomType(ChatRoomType.GROUP)
                .name(request.getName())
                .createdBy(requester)
                .sortPriority(NORMAL_SORT_PRIORITY)
                .build());

        chatRoomMemberRepository.save(ChatRoomMember.builder()
                .room(room)
                .user(requester)
                .memberRole(ChatMemberRole.OWNER)
                .build());

        List<Long> inviteIds = (request.getMemberUserIds() == null) ? List.of() : request.getMemberUserIds();
        if(!inviteIds.isEmpty()) {
            Set<Long> uniqueIds = new LinkedHashSet<>(inviteIds);
            uniqueIds.remove(requester.getId());

            if(!uniqueIds.isEmpty()) {
                List<User> users = userRepository.findAllById(uniqueIds);
                if(users.size() != uniqueIds.size())
                    throw new BusinessException(ErrorCode.USER_NOT_FOUND);

                for(User user : users) {
                    ensureUserBelongsToStore(store, user.getId());
                    chatRoomMemberRepository.save(ChatRoomMember.builder()
                            .room(room)
                            .user(user)
                            .memberRole(ChatMemberRole.MEMBER)
                            .build());
                }

            }
        }

        return toRoomDetail(room, requesterId);
    }

    // bot 방 생성 / 사용 (개인화: 매장 + 사용자 기준 1개)
    @Transactional
    public ChatRoomResponseDto.RoomDetail createOrGetBotRoom(Long requesterId, Long storeId, ChatRoomRequestDto.CreateBot request) {
        Store store = getStoreOrThrow(storeId);
        User requester = getUserOrThrow(requesterId);

        ensureUserBelongsToStore(store, requesterId);

        ChatRoom room = getOrCreatePersonalBotRoomWithWelcome(store, requester, request.getName());

        // BOT 방 재사용 시에도 우선순위 정책을 안전하게 보장
        if(!Objects.equals(room.getSortPriority(), BOT_SORT_PRIORITY))
            room.setSortPriority(BOT_SORT_PRIORITY);

        return toRoomDetail(room, requesterId);
    }

    // 방 이름 수정
    @Transactional
    public ChatRoomResponseDto.RoomDetail updateRoomName(Long requesterId, Long roomId, ChatRoomRequestDto.UpdateName request) {
        ChatRoom room = getRoomOrThrow(roomId);
        ChatRoomMember member = getActiveMemberOrThrow(roomId, requesterId);

        if(member.getMemberRole() != ChatMemberRole.OWNER)
            throw new BusinessException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
        if(room.getRoomType() != ChatRoomType.GROUP)
            throw new BusinessException(ErrorCode.CHAT_INVALID_REFERENCE);

        room.rename(request.getName());
        return toRoomDetail(room, requesterId);
    }

    // 내가 참여한 방 목록 조회
    public List<ChatRoomResponseDto.RoomSummary> getRooms(Long userId, Long storeId) {
        ensureUserBelongsToStore(getStoreOrThrow(storeId), userId);

        List<ChatRoomMember> myMemberships = chatRoomMemberRepository
                .findActiveMembersWithRoomByUserIdAndStoreId(userId, storeId);

        return myMemberships.stream()
                .sorted(Comparator
                        .comparing((ChatRoomMember m) -> m.getRoom().getSortPriority(), Comparator.nullsLast(Integer::compareTo)).reversed()
                        .thenComparing((ChatRoomMember m) -> m.getRoom().getLastMessageAt(), Comparator.nullsLast(Comparator.reverseOrder())))
                .map(member -> {
                    ChatRoom room = member.getRoom();
                    Optional<ChatMessage> lastMessageOpt = chatMessageRepository.findTopByRoomIdOrderByIdDesc(room.getId());
                    ChatMessage lastMessage = lastMessageOpt.orElse(null);

                    List<ChatRoomMember> activeMembers = chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(room.getId());
                    int memberCount = activeMembers.size();
                    long unreadCount = calculateUnreadCount(room.getId(), member.getLastReadMessageId());

                    String resolvedName = resolveRoomName(room, userId, activeMembers);

                    return ChatRoomResponseDto.RoomSummary.builder()
                            .roomId(room.getId())
                            .roomType(room.getRoomType())
                            .name(resolvedName)
                            .sortPriority(room.getSortPriority())
                            .lastMessageId(lastMessage != null ? lastMessage.getId() : room.getLastMessageId())
                            .lastMessagePreview(lastMessage != null ? lastMessage.getContent() : null)
                            .lastMessageAt(room.getLastMessageAt())
                            .unreadCount(unreadCount)
                            .memberCount(memberCount)
                            .build();
                }).toList();
    }

    // 단일 방 상세 조회
    public ChatRoomResponseDto.RoomDetail getRoom(Long userId, Long roomId) {
        ensureActiveMember(roomId, userId);
        ChatRoom room = getRoomOrThrow(roomId);
        return toRoomDetail(room, userId);
    }

    // 매장 합류 시(사장: 매장 생성 / 직원: joinStore) 호출
    // 사용자별 개인 BOT 방 보장 생성.
    @Transactional
    public void ensurePersonalBotRoomWithWelcome(Long requesterId, Long storeId) {
        Store store = getStoreOrThrow(storeId);
        User requester = getUserOrThrow(requesterId);

        ensureUserBelongsToStore(store, requesterId);
        getOrCreatePersonalBotRoomWithWelcome(store, requester, DEFAULT_BOT_ROOM_NAME);
    }

    // =======================================================================
    //  private helper method
    // =======================================================================
    private ChatRoomResponseDto.RoomDetail toRoomDetail(ChatRoom room, Long requesterId) {
        List<ChatRoomMember> members = chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(room.getId());

        List<ChatRoomResponseDto.MemberInfo> memberInfos = members.stream()
                .map(ChatRoomResponseDto.MemberInfo::from)
                .toList();

        String resolvedName = resolveRoomName(room, requesterId, members);
        return ChatRoomResponseDto.RoomDetail.builder()
                .roomId(room.getId())
                .storeId(room.getStore().getId())
                .roomType(room.getRoomType())
                .name(resolvedName)
                .sortPriority(room.getSortPriority())
                .isArchived(room.getIsArchived())
                .lastMessageId(room.getLastMessageId())
                .lastMessageAt(room.getLastMessageAt())
                .members(memberInfos)
                .build();
    }

    private String resolveRoomName(ChatRoom room, Long requesterId, List<ChatRoomMember> activeMembers) {
        if (room.getRoomType() != ChatRoomType.DM) {
            return room.getName();
        }
        String otherName = activeMembers.stream()
                .map(ChatRoomMember::getUser)
                .filter(user -> !user.getId().equals(requesterId))
                .map(User::getName)
                .filter(name -> name != null && !name.isBlank())
                .findFirst()
                .orElse("상대방");
        return otherName + "과의 채팅방";
    }

    private Store getStoreOrThrow(Long storeId) {
        return storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
    }
    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
    private ChatRoom getRoomOrThrow(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }
    private ChatRoomMember getActiveMemberOrThrow(Long roomId, Long userId) {
        return chatRoomMemberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_MEMBER_NOT_ACTIVE));
    }
    private void ensureActiveMember(Long roomId, Long userId) {
        if (!chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)) {
            throw new BusinessException(ErrorCode.CHAT_MEMBER_NOT_ACTIVE);
        }
    }

    // 매장 경계 검증: 사장(owner)이거나 해당 매장 직원이며 RESIGNED가 아니면 통과
    private void ensureUserBelongsToStore(Store store, Long userId) {
        if (store.getOwner().getId().equals(userId)) {
            return;
        }
        Optional<StoreEmployee> employeeOpt = storeEmployeeRepository.findByStoreIdAndUserId(store.getId(), userId);
        if (employeeOpt.isPresent() && employeeOpt.get().getStatus() != StoreEmployeeStatus.RESIGNED
                                    && employeeOpt.get().getStatus() != StoreEmployeeStatus.WAITING
                                    && employeeOpt.get().getStatus() != StoreEmployeeStatus.INVITED) {
            return;
        }
        throw new BusinessException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
    }

    private long calculateUnreadCount(Long roomId, Long lastReadMessageId) {
        if(lastReadMessageId == null) return chatMessageRepository.countByRoomId(roomId);

        return chatMessageRepository.countByRoomIdAndIdGreaterThan(roomId, lastReadMessageId);
    }

    private ChatRoom getOrCreatePersonalBotRoomWithWelcome(Store store, User requester, String roomName) {
        Optional<ChatRoom> existing = chatRoomRepository.findPersonalBotRoom(store.getId(), requester.getId(), ChatRoomType.BOT);
        if(existing.isPresent()) return existing.get();

        ChatRoom newRoom = chatRoomRepository.save(ChatRoom.builder()
                .store(store)
                .roomType(ChatRoomType.BOT)
                .name(roomName)
                .createdBy(requester)
                .sortPriority(BOT_SORT_PRIORITY)
                .build());

        chatRoomMemberRepository.save(ChatRoomMember.builder()
                .room(newRoom)
                .user(requester)
                .memberRole(ChatMemberRole.OWNER)
                .build());

        saveInitialBotWelcomeMessage(newRoom);
        return newRoom;
    }

    private void saveInitialBotWelcomeMessage(ChatRoom room) {
        User botUser = userRepository.findById(chatBotProperties.getBotUserId()).orElse(null);
        if(botUser == null) {
            log.warn("[CHAT-BOT] bot user not found. botUserId={}", chatBotProperties.getBotUserId());
            return;
        }

        ChatMessage welcome = ChatMessage.createBotText(room, botUser, DEFAULT_BOT_WELCOME_MESSAGE);
        ChatMessage saved = chatMessageRepository.save(welcome);
        room.updateLastMessagePointer(saved.getId(), saved.getSentAt());
    }
}
