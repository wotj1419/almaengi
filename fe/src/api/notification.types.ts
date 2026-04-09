// 백엔드 NotificationType(enum)과 동일하게 맞춥니다.
// 타입 문자열이 다르면 라우팅/분기에서 오류가 납니다.
export type NotificationType =
  | 'AUCTION'
  | 'SCHEDULE'
  | 'SALARY'
  | 'LATE'
  | 'CHAT';
// 백엔드 알림 목록 조회 응답의 개별 아이템 형태입니다.
export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: NotificationType;
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}
// FCM 토큰 등록 API 요청 바디
export interface RegisterFcmTokenRequest {
  deviceToken: string;
}
// 다건 읽음 처리 API 요청 바디
export interface MarkNotificationsReadRequest {
  notificationIds: number[];
}
