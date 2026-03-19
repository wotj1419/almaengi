/** chat_rooms 테이블 기반 */
export interface ChatRoom {
  roomId: number;
  storeId: number;
  roomType: 'DM' | 'CHATBOT';
  name: string | null;
  createdAt: string;
  /** FE 전용: 목록 표시용 가공 필드 */
  lastMessage: string;
  lastMessageTime: string;
  /** 정렬용: 마지막 메시지의 sent_at (ISO string) */
  lastMessageAt: string;
  unreadCount: number;
  /** 상대방 정보 (DM인 경우) */
  otherUser?: {
    userId: number;
    name: string;
    position: string;
  };
}

/** chat_messages 테이블 기반 */
export interface ChatMessage {
  messageId: number;
  roomId: number;
  senderId: number | null;
  senderName: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  content: string | null;
  fileUrl: string | null;
  sentAt: string;
  readCount: number;
  isMine: boolean;
}

/** store_employees + users 조인 결과 */
export interface StoreEmployee {
  employeeId: number;
  userId: number;
  name: string;
  position: string;
  status: 'INVITED' | 'ACTIVE' | 'RESIGNED';
}
