import { create } from 'zustand';
import * as chatApi from '@/api/chat';
import type { RoomSummary, MessageItem } from '@/api/chat';

interface ChatStore {
  // ─── 상태 ───
  rooms: RoomSummary[];
  messages: Record<number, MessageItem[]>;
  /** 방별 다음 페이지 커서 (null이면 더 불러올 메시지 없음) */
  nextCursors: Record<number, number | null>;
  loading: boolean;

  // ─── 액션 ───
  /** 매장의 채팅방 목록을 BE에서 가져옴 */
  fetchRooms: (storeId: number) => Promise<void>;
  /** 채팅방의 메시지 목록을 BE에서 가져옴 (최초 진입 시) */
  fetchMessages: (roomId: number) => Promise<void>;
  /** 이전 메시지 추가 로딩 (위로 스크롤 시) — nextCursor 기반 */
  fetchMoreMessages: (roomId: number) => Promise<void>;
  /** 메시지 전송 (BE API 호출 → store 업데이트) */
  sendMessage: (roomId: number, content: string) => Promise<void>;
  /** DM 방 생성/재사용 */
  createDirectRoom: (storeId: number, targetUserId: number) => Promise<number>;
  /** 그룹 방 생성 */
  createGroupRoom: (
    storeId: number,
    name: string,
    memberUserIds: number[]
  ) => Promise<number>;
  /** BOT 방 생성/재사용 */
  createBotRoom: (storeId: number) => Promise<number>;
  /** WebSocket으로 받은 메시지를 store에 추가 */
  receiveMessage: (roomId: number, message: MessageItem) => void;
  /** 채팅방 읽음 처리 — 마지막 메시지 기준으로 API 호출 후 unreadCount 0으로 갱신 */
  markAsRead: (roomId: number) => Promise<void>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  rooms: [],
  messages: {},
  nextCursors: {},
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
      nextCursors: {
        ...state.nextCursors,
        [roomId]: data.nextCursor,
      },
    }));
  },

  fetchMoreMessages: async (roomId) => {
    const cursor = get().nextCursors[roomId];
    if (cursor === null || cursor === undefined) return;

    const data = await chatApi.getMessages(roomId, cursor);
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...data.messages]
          .reverse()
          .concat(state.messages[roomId] ?? []),
      },
      nextCursors: {
        ...state.nextCursors,
        [roomId]: data.nextCursor,
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
    // 내가 보낸 메시지도 읽음 처리 (채팅 목록 unreadCount 배지 방지)
    chatApi
      .markAsRead(roomId, { lastReadMessageId: sent.messageId })
      .catch(() => {});
  },

  createGroupRoom: async (storeId, name, memberUserIds) => {
    const room = await chatApi.createGroupRoom(storeId, {
      name,
      memberUserIds,
    });
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

  markAsRead: async (roomId) => {
    const msgs = get().messages[roomId];
    if (!msgs || msgs.length === 0) return;
    const lastMessageId = msgs[msgs.length - 1].messageId;
    await chatApi.markAsRead(roomId, { lastReadMessageId: lastMessageId });
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.roomId === roomId ? { ...r, unreadCount: 0 } : r
      ),
    }));
  },
}));
