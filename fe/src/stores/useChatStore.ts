import { create } from 'zustand';
import * as chatApi from '@/api/chat';
import type { RoomSummary, MessageItem } from '@/api/chat';

interface ChatStore {
  // ─── 상태 ───
  rooms: RoomSummary[];
  messages: Record<number, MessageItem[]>;
  loading: boolean;

  // ─── 액션 ───
  /** 매장의 채팅방 목록을 BE에서 가져옴 */
  fetchRooms: (storeId: number) => Promise<void>;
  /** 채팅방의 메시지 목록을 BE에서 가져옴 */
  fetchMessages: (roomId: number) => Promise<void>;
  /** 메시지 전송 (BE API 호출 → store 업데이트) */
  sendMessage: (roomId: number, content: string) => Promise<void>;
  /** DM 방 생성/재사용 */
  createDirectRoom: (storeId: number, targetUserId: number) => Promise<number>;
  /** BOT 방 생성/재사용 */
  createBotRoom: (storeId: number) => Promise<number>;
  /** WebSocket으로 받은 메시지를 store에 추가 (추후 사용) */
  receiveMessage: (roomId: number, message: MessageItem) => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  rooms: [],
  messages: {},
  loading: false,

  fetchRooms: async (storeId) => {
    set({ loading: true });
    try {
      const rooms = await chatApi.getRooms(storeId);
      set({ rooms });
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (roomId) => {
    const data = await chatApi.getMessages(roomId);
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...data.messages].reverse(),
      },
    }));
  },

  sendMessage: async (roomId, content) => {
    const sent = await chatApi.sendMessage(roomId, {
      messageType: 'TEXT',
      content,
    });
    // BE 응답(저장된 메시지)을 store에 추가
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] ?? []), sent],
      },
    }));
  },

  createDirectRoom: async (storeId, targetUserId) => {
    const room = await chatApi.createOrGetDirectRoom(storeId, { targetUserId });
    // 방 목록에 없으면 추가
    set((state) => {
      const exists = state.rooms.some((r) => r.roomId === room.roomId);
      if (exists) return state;
      return {
        rooms: [
          ...state.rooms,
          {
            roomId: room.roomId,
            roomType: room.roomType,
            name: room.name,
            sortPriority: room.sortPriority,
            lastMessageId: room.lastMessageId,
            lastMessagePreview: null,
            lastMessageAt: room.lastMessageAt,
            unreadCount: 0,
            memberCount: room.members.length,
          },
        ],
      };
    });
    return room.roomId;
  },

  createBotRoom: async (storeId) => {
    const room = await chatApi.createOrGetBotRoom(storeId, { name: '알맹이' });
    set((state) => {
      const exists = state.rooms.some((r) => r.roomId === room.roomId);
      if (exists) return state;
      return {
        rooms: [
          ...state.rooms,
          {
            roomId: room.roomId,
            roomType: room.roomType,
            name: room.name,
            sortPriority: room.sortPriority,
            lastMessageId: room.lastMessageId,
            lastMessagePreview: null,
            lastMessageAt: room.lastMessageAt,
            unreadCount: 0,
            memberCount: room.members.length,
          },
        ],
      };
    });
    return room.roomId;
  },

  receiveMessage: (roomId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] ?? []), message],
      },
    }));
  },
}));
