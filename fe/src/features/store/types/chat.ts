import type { ChatRoomType, ChatMessageType } from '@/api/chat';

// 공통 타입은 api/chat.ts에서 가져옴
export type { ChatRoomType, ChatMessageType };

/** chat_rooms 테이블 기반 + FE 표시용 필드 */
export interface ChatRoom {
  roomId: number;
  storeId: number;
  roomType: ChatRoomType; // 'DM' | 'GROUP' | 'BOT' (BE 기준)
  name: string | null;
  createdAt: string;
  /** FE 전용: 목록 표시용 가공 필드 (Mock용, 추후 제거) */
  lastMessage: string;
  lastMessageTime: string;
  /** 정렬용: 마지막 메시지의 sent_at (ISO string) */
  lastMessageAt: string;
  unreadCount: number;
  /** 상대방 정보 (DM인 경우, Mock용) */
  otherUser?: {
    userId: number;
    name: string;
    position: string;
  };
}

/** chat_messages 테이블 기반 + FE 전용 필드 */
export interface ChatMessage {
  messageId: number;
  roomId: number;
  senderId: number | null;
  senderName: string;
  messageType: ChatMessageType; // 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  content: string | null;
  fileUrl: string | null;
  sentAt: string;
  readCount: number; // Mock용, 추후 제거
  isMine: boolean; // Mock용, 추후 제거
}

/** store_employees + users 조인 결과 */
export interface StoreEmployee {
  employeeId: number;
  userId: number;
  name: string;
  position: string;
  status: 'INVITED' | 'ACTIVE' | 'RESIGNED';
}
