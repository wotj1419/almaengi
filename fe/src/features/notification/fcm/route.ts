import { ROUTES } from '@/constants/routes';
import type { NotificationType } from '@/api/notification.types';
/**
 * 알림 타입 + targetId를 받아 이동할 경로를 반환합니다.
 * - targetId가 없거나 타입이 예상 외면 알림함으로 fallback
 */
export function resolveNotificationRoute(
  type: NotificationType,
  targetId: number | null
) {
  switch (type) {
    case 'AUCTION':
      return typeof targetId === 'number'
        ? `/auction/${targetId}`
        : ROUTES.NOTIFICATION;
    case 'LATE':
      return ROUTES.ATTENDANCE;
    case 'SCHEDULE':
      return ROUTES.SCHEDULE;
    case 'SALARY':
      return ROUTES.PAYROLL;
    case 'CHAT':
      return typeof targetId === 'number'
        ? `/chat/rooms/${targetId}`
        : ROUTES.NOTIFICATION;
    default:
      return ROUTES.NOTIFICATION;
  }
}
