import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore';
import { requestNotificationPermission } from '../fcm/permission';
import { registerFcmServiceWorker } from '../fcm/serviceWorker';
import { syncFcmToken } from '../fcm/token';
import { startForegroundListener } from '../fcm/listener';

// WHY: StrictMode/dev 재마운트 또는 상태 변화로 effect가 짧은 시간에 중복 실행될 수 있습니다.
// 전역 in-flight 락으로 bootstrap 동시 실행을 1회로 제한합니다.
let bootstrapInFlight: Promise<void> | null = null;

// 디버깅용 시도 카운터
let bootstrapAttemptSeq = 0;
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
      typeof window !== 'undefined' &&
      Boolean(localStorage.getItem('accessToken'));
    // 로그인 상태도 아니고 토큰도 없으면 FCM 부팅하지 않음
    if (!isLoggedIn && !hasAccessToken) return;

    let isMounted = true;

    async function bootstrap() {
      // 이미 bootstrap이 진행 중이면 중복 실행하지 않습니다.
      if (bootstrapInFlight) {
        return;
      }

      const attemptId = ++bootstrapAttemptSeq;
      bootstrapInFlight = (async () => {
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

          // WHY: SW 등록 실패 상태에서 getToken을 진행하면 브라우저 상태 의존 실패가 증가할 수 있습니다.
          // 등록이 없으면 이번 bootstrap은 중단하고 다음 기회에 재시도합니다.
          if (!registration) {
            console.warn(
              `[FCM][bootstrap#${attemptId}] SW 등록이 없어 토큰 동기화를 건너뜁니다.`
            );
            return;
          }

          // 3) 토큰 발급 + 서버 등록
          await syncFcmToken(registration);
          if (!isMounted) return;

          // 4) 포그라운드 수신 리스너 시작
          startForegroundListener(queryClient);
        } catch (error) {
          console.error(`[FCM][bootstrap#${attemptId}] bootstrap 실패:`, error);
        } finally {
          bootstrapInFlight = null;
        }
      })();

      await bootstrapInFlight;
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, queryClient]);
}
