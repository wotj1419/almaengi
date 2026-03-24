import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore';
import { requestNotificationPermission } from '../fcm/permission';
import { registerFcmServiceWorker } from '../fcm/serviceWorker';
import { syncFcmToken } from '../fcm/token';
import { startForegroundListener } from '../fcm/listener';
/**
 * 앱 전역에서 FCM을 부팅하는 훅
 * - 로그인 상태(또는 accessToken 존재)일 때만 동작
 * - 권한 허용 시: SW 등록 -> 토큰 동기화 -> foreground 리스너 시작
 */
export function useFcmBootstrap() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  useEffect(() => {
    const hasAccessToken =
      typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'));
    // 로그인 상태도 아니고 토큰도 없으면 FCM 부팅하지 않음
    if (!isLoggedIn && !hasAccessToken) return;
    let isMounted = true;
    async function bootstrap() {
      try {
        // 1) 알림 권한 확인/요청
        const permission = await requestNotificationPermission();
        if (!isMounted) return;
        // 권한 거부 시 푸시만 스킵하고 앱은 계속 사용
        if (permission !== 'granted') {
          console.info('[FCM] 알림 권한이 없어 FCM 연동을 건너뜁니다.');
          return;
        }
        // 2) FCM 전용 SW 등록
        const registration = await registerFcmServiceWorker();
        if (!isMounted) return;
        // 3) 토큰 발급 + 서버 등록
        await syncFcmToken(registration);
        if (!isMounted) return;
        // 4) 포그라운드 수신 리스너 시작
        startForegroundListener(queryClient);
      } catch (error) {
        console.error('[FCM] bootstrap 실패:', error);
      }
    }
    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, queryClient]);
}