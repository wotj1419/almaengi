import type { ChatRoom, ChatMessage, StoreEmployee } from '../types/chat';

/** 현재 로그인 유저 (사장님) */
export const CURRENT_USER_ID = 1;

export const mockChatRooms: ChatRoom[] = [
  {
    roomId: 0,
    storeId: 1,
    roomType: 'BOT',
    name: '알맹이',
    createdAt: '2026-03-01T00:00:00',
    lastMessage:
      '안녕하세요!? 우리 매장 알바 매니저, 알맹이입니다. 급여 계산, 노동법 등 매장 운영 관련 궁금한 점을 언제든지 물어보세요 😊',
    lastMessageTime: '오후 2:30',
    lastMessageAt: '2026-03-18T14:30:00',
    unreadCount: 1,
  },
  {
    roomId: 1,
    storeId: 1,
    roomType: 'DM',
    name: null,
    createdAt: '2026-03-10T09:00:00',
    lastMessage: '네 알겠습니다.',
    lastMessageTime: '오전 10:30',
    lastMessageAt: '2026-03-18T10:30:00',
    unreadCount: 2,
    otherUser: {
      userId: 2,
      name: '박알바',
      position: '직원',
    },
  },
  {
    roomId: 2,
    storeId: 1,
    roomType: 'DM',
    name: null,
    createdAt: '2026-03-08T11:00:00',
    lastMessage: '확인했습니다. 다음 주 스케줄 곧 올릴게요!',
    lastMessageTime: '3월 12일',
    lastMessageAt: '2026-03-12T14:05:00',
    unreadCount: 0,
    otherUser: {
      userId: 3,
      name: '최알바',
      position: '직원',
    },
  },
];

export const mockMessages: Record<number, ChatMessage[]> = {
  0: [
    {
      messageId: 100,
      roomId: 0,
      senderId: null,
      senderName: '알맹이',
      messageType: 'TEXT',
      content:
        '안녕하세요!? 우리 매장 알바 매니저, 알맹이입니다. 급여 계산, 노동법 등 매장 운영 관련 궁금한 점을 언제든지 물어보세요 😊',
      fileUrl: null,
      sentAt: '2026-03-18T14:30:00',
      readCount: 0,
      isMine: false,
    },
  ],
  1: [
    {
      messageId: 1,
      roomId: 1,
      senderId: CURRENT_USER_ID,
      senderName: '사장님',
      messageType: 'TEXT',
      content: '박알바님, 내일 오전 시프트 가능하신가요?',
      fileUrl: null,
      sentAt: '2026-03-18T09:00:00',
      readCount: 1,
      isMine: true,
    },
    {
      messageId: 2,
      roomId: 1,
      senderId: 2,
      senderName: '박알바',
      messageType: 'TEXT',
      content: '확인해 보겠습니다.',
      fileUrl: null,
      sentAt: '2026-03-18T10:28:00',
      readCount: 0,
      isMine: false,
    },
    {
      messageId: 5,
      roomId: 1,
      senderId: 2,
      senderName: '박알바',
      messageType: 'TEXT',
      content: '네 알겠습니다.',
      fileUrl: null,
      sentAt: '2026-03-18T10:30:00',
      readCount: 0,
      isMine: false,
    },
  ],
  2: [
    {
      messageId: 3,
      roomId: 2,
      senderId: 3,
      senderName: '최알바',
      messageType: 'TEXT',
      content: '스케줄 확인 부탁드려요.',
      fileUrl: null,
      sentAt: '2026-03-12T14:00:00',
      readCount: 1,
      isMine: false,
    },
    {
      messageId: 4,
      roomId: 2,
      senderId: CURRENT_USER_ID,
      senderName: '사장님',
      messageType: 'TEXT',
      content: '확인했습니다. 다음 주 스케줄 곧 올릴게요!',
      fileUrl: null,
      sentAt: '2026-03-12T14:05:00',
      readCount: 1,
      isMine: true,
    },
  ],
};

export const mockEmployees: StoreEmployee[] = [
  {
    employeeId: 1,
    userId: 2,
    name: '박알바',
    position: '직원',
    status: 'ACTIVE',
  },
  {
    employeeId: 2,
    userId: 3,
    name: '최알바',
    position: '직원',
    status: 'ACTIVE',
  },
  {
    employeeId: 3,
    userId: 4,
    name: '김알바',
    position: '매니저',
    status: 'ACTIVE',
  },
  {
    employeeId: 4,
    userId: 5,
    name: '이알바',
    position: '직원',
    status: 'ACTIVE',
  },
];
