// FCM 전용 SW 파일 경로
const FCM_SW_PATH = '/firebase-messaging-sw.js';
// FCM 전용 scope
// PWA 기본 SW와 역할 충돌을 줄이기 위해 별도 scope를 사용합니다.
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope';
// FCM용 service worker를 등록하고 registration을 반환합니다.
// - 성공: ServiceWorkerRegistration 반환
// - 실패/미지원: null 반환
export async function registerFcmServiceWorker() {
  // 브라우저/환경 보호 코드
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(FCM_SW_PATH, {
      scope: FCM_SW_SCOPE,
    });

    // 디버깅 시 SW scope 확인용 로그
    console.info(`[FCM] Service Worker 등록 성공. scope=${registration.scope}`);
    return registration;
  } catch (error) {
    const normalizedError = error as { name?: string; message?: string };
    console.error(
      `[FCM] Service Worker 등록 실패: ${normalizedError?.name ?? 'UnknownError'} - ${normalizedError?.message ?? ''}`,
      error
    );
    return null;
  }
}
