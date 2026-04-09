import instance from './instance';
import type { ApiResponse } from './auction.types';
import type {
  MarkNotificationsReadRequest,
  NotificationItem,
  RegisterFcmTokenRequest,
} from './notification.types';

// FCM 토큰 등록/갱신
// POST /api/v1/notifications/token
export async function registerFcmToken(body: RegisterFcmTokenRequest) {
  const { data } = await instance.post<ApiResponse<string>>(
    '/api/v1/notifications/token',
    body
  );
  return data.data;
}

// 내 알림 목록 조회
// GET /api/v1/notifications
export async function fetchNotifications() {
  const { data } = await instance.get<ApiResponse<NotificationItem[]>>(
    '/api/v1/notifications'
  );
  return data.data;
}

// 알림 단건 읽음 처리
// PATCH /api/v1/notifications/{notificationId}/read
export async function markNotificationAsRead(notificationId: number) {
  const { data } = await instance.patch<ApiResponse<string>>(
    `/api/v1/notifications/${notificationId}/read`
  );
  return data.data;
}

// 알림 다건 읽음 처리
// PATCH /api/v1/notifications/reads
export async function markNotificationsAsRead(
  body: MarkNotificationsReadRequest
) {
  const { data } = await instance.patch<ApiResponse<string>>(
    '/api/v1/notifications/reads',
    body
  );
  return data.data;
}