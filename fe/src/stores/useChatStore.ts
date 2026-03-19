import { create } from 'zustand';
import type { ChatRoom, ChatMessage } from '@/features/store/types/chat';
import {
  mockChatRooms,
  mockMessages,
  CURRENT_USER_ID,
} from '@/features/store/data/mockChat';

interface ChatStore {
  rooms: ChatRoom[];
  messages: Record<number, ChatMessage[]>;
  nextRoomId: number;
  addRoom: (room: ChatRoom) => void;
  addMessage: (roomId: number, message: ChatMessage) => void;
  /** 선택한 유저들로 새 채팅방 생성하고 roomId 반환 */
  createRoom: (
    users: { userId: number; name: string; position: string }[]
  ) => number;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  rooms: mockChatRooms,
  messages: mockMessages,
  nextRoomId: 100,

  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),

  addMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] ?? []), message],
      },
      rooms: state.rooms.map((room) =>
        room.roomId === roomId
          ? {
              ...room,
              lastMessage: message.content ?? '',
              lastMessageTime: '방금',
              lastMessageAt: message.sentAt,
            }
          : room
      ),
    })),

  createRoom: (users) => {
    const state = get();

    // 1명 선택 + 기존 DM 방이 있으면 해당 방 ID 반환
    if (users.length === 1) {
      const existing = state.rooms.find(
        (r) => r.roomType === 'DM' && r.otherUser?.userId === users[0].userId
      );
      if (existing) return existing.roomId;
    }

    const newRoomId = state.nextRoomId;
    const isDM = users.length === 1;

    const now = new Date().toISOString();
    const newRoom: ChatRoom = {
      roomId: newRoomId,
      storeId: 1,
      roomType: 'DM',
      name: isDM ? null : users.map((u) => u.name).join(', '),
      createdAt: now,
      lastMessage: '',
      lastMessageTime: '방금',
      lastMessageAt: now,
      unreadCount: 0,
      otherUser: isDM ? users[0] : undefined,
    };

    set((s) => ({
      rooms: [...s.rooms, newRoom],
      nextRoomId: s.nextRoomId + 1,
    }));

    return newRoomId;
  },
}));

export { CURRENT_USER_ID };
