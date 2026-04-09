import instance from './instance';
import type { ApiResponse } from './auction.types';

// ─── 공통 타입 ───

export type ChatRoomType = 'DM' | 'GROUP' | 'BOT';
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
export type ChatMemberRole = 'OWNER' | 'MEMBER';

// ─── 응답 타입 ───

export interface RoomSummary {
  roomId: number;
  roomType: ChatRoomType;
  name: string;
  sortPriority: number;
  lastMessageId: number | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  memberCount: number;
}

export interface MemberInfo {
  userId: number;
  name: string;
  role: ChatMemberRole;
  joinedAt: string;
}

export interface RoomDetail {
  roomId: number;
  storeId: number;
  roomType: ChatRoomType;
  name: string;
  sortPriority: number;
  isArchived: boolean;
  lastMessageId: number | null;
  lastMessageAt: string | null;
  members: MemberInfo[];
}

export interface MessageItem {
  messageId: number;
  roomId: number;
  senderId: number | null;
  senderName: string | null;
  messageType: ChatMessageType;
  content: string | null;
  fileUrl: string | null;
  sentAt: string;
  isDeleted: boolean;
}

export interface MessagePage {
  messages: MessageItem[];
  nextCursor: number | null;
  size: number;
}

// ─── 요청 타입 ───

export interface CreateDirectRequest {
  targetUserId: number;
}

export interface CreateGroupRequest {
  name: string;
  memberUserIds: number[];
}

export interface CreateBotRequest {
  name: string;
}

export interface SendMessageRequest {
  messageType: ChatMessageType;
  content: string;
}

export interface MarkReadRequest {
  lastReadMessageId: number;
}

// ─── API 함수: 채팅방 ───

/** 매장 내 내 채팅방 목록 조회 */
export async function getRooms(storeId: number) {
  const { data } = await instance.get<ApiResponse<RoomSummary[]>>(
    `/api/v1/chat/stores/${storeId}/rooms`
  );
  return data.data;
}

/** DM 방 생성/재사용 */
export async function createOrGetDirectRoom(
  storeId: number,
  body: CreateDirectRequest
) {
  const { data } = await instance.post<ApiResponse<RoomDetail>>(
    `/api/v1/chat/stores/${storeId}/rooms/dm`,
    body
  );
  return data.data;
}

/** 그룹방 생성 */
export async function createGroupRoom(
  storeId: number,
  body: CreateGroupRequest
) {
  const { data } = await instance.post<ApiResponse<RoomDetail>>(
    `/api/v1/chat/stores/${storeId}/rooms/group`,
    body
  );
  return data.data;
}

/** 봇방 생성/재사용 */
export async function createOrGetBotRoom(
  storeId: number,
  body: CreateBotRequest
) {
  const { data } = await instance.post<ApiResponse<RoomDetail>>(
    `/api/v1/chat/stores/${storeId}/rooms/bot`,
    body
  );
  return data.data;
}

/** 방 상세 조회 */
export async function getRoom(roomId: number) {
  const { data } = await instance.get<ApiResponse<RoomDetail>>(
    `/api/v1/chat/rooms/${roomId}`
  );
  return data.data;
}

// ─── API 함수: 메시지 ───

/** 메시지 전송 (REST - DM/GROUP용) */
export async function sendMessage(roomId: number, body: SendMessageRequest) {
  const { data } = await instance.post<ApiResponse<MessageItem>>(
    `/api/v1/chat/rooms/${roomId}/messages`,
    body
  );
  return data.data;
}

/** 메시지 목록 조회 (커서 기반 페이징) */
export async function getMessages(
  roomId: number,
  cursor?: number,
  size: number = 30
) {
  const { data } = await instance.get<ApiResponse<MessagePage>>(
    `/api/v1/chat/rooms/${roomId}/messages`,
    { params: { cursor, size } }
  );
  return data.data;
}

/** 읽음 처리 */
export async function markAsRead(roomId: number, body: MarkReadRequest) {
  const { data } = await instance.post<ApiResponse<void>>(
    `/api/v1/chat/rooms/${roomId}/read`,
    body
  );
  return data;
}
