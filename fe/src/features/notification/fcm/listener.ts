import toast from 'react-hot-toast';
import { onMessage, type Unsubscribe } from 'firebase/messaging';
import type { QueryClient } from '@tanstack/react-query';
import { getFirebaseMessaging } from './firebase';

// notifications 캐시 invalidate용 키
const NOTIFICATION_QUERY_KEY_PREFIX = ['notifications'] as const;

// 중복 등록 방지용 전역 변수
let unsubscribeForegroundListener: Unsubscribe | null = null;

/**
 * 앱이 foreground 상태일 때 FCM 메시지를 수신합니다.
 * - 토스트 표시
 * - notifications 관련 query invalidate
 */
export function startForegroundListener(queryClient: QueryClient) {
  // 이미 등록되어 있으면 중복 등록하지 않음
  if (unsubscribeForegroundListener) return;
  const messaging = getFirebaseMessaging();
  unsubscribeForegroundListener = onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? '새 알림';
    const body = payload.notification?.body ?? '알림이 도착했습니다.';
    // 인앱 토스트 표시
    toast.success(`${title}\n${body}`, { duration: 4000 });
    // 알림 목록/뱃지 갱신을 위해 캐시 무효화
    queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY_PREFIX });
  });
}

/**
 * 필요 시 foreground 리스너를 해제합니다.
 * (현재 구조에서는 필수는 아니지만 안전장치로 두는 것을 권장)
 */
export function stopForegroundListener() {
  if (!unsubscribeForegroundListener) return;
  unsubscribeForegroundListener();
  unsubscribeForegroundListener = null;
}