import { getToken } from 'firebase/messaging';
import { registerFcmToken } from '@/api/notification';
import { getFirebaseMessaging } from './firebase';

// 마지막으로 서버에 동기화한 FCM 토큰 저장 키
const LAST_SYNCED_FCM_TOKEN_KEY = 'lastSyncedFcmToken';

// 최근 동기화 시각 저장 키
// WHY: 로그인 직후 + 앱 부팅 훅 등에서 짧은 시간에 getToken이 중복 호출되면
// Chrome Push 서비스에서 TOO_MANY_REGISTRATIONS가 발생할 수 있습니다.
const LAST_SYNCED_AT_KEY = 'lastSyncedFcmTokenAt';

// 과도한 재등록 방지를 위한 최소 간격(밀리초)
const TOKEN_SYNC_COOLDOWN_MS = 10_000;

// 모듈 스코프 in-flight 락
// WHY: 동시 호출이 들어와도 getToken을 1회만 실행해서 push registration race를 방지합니다.
let syncInFlight: Promise<string | null> | null = null;

/**
 * FCM 토큰을 발급받아 백엔드에 등록합니다.
 * - registration: Step7에서 등록한 FCM 전용 Service Worker registration
 * - 반환값: 발급된 토큰(string) 또는 실패 시 null
 */
export async function syncFcmToken(
  registration: ServiceWorkerRegistration | null
): Promise<string | null> {
  // 이미 동기화 중이면 같은 Promise를 재사용합니다.
  // WHY: 동시 실행으로 인한 push registration 실패(AbortError) 예방.
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  // VAPID 키가 없으면 토큰 발급이 불가능하므로 중단
    if (!vapidKey) {
      console.warn('[FCM] VITE_FIREBASE_VAPID_KEY가 없어 토큰 발급을 건너뜁니다.');
      return null;
    }

  // 최근 동기화가 아주 짧은 시간 내에 발생했다면 재시도하지 않습니다.
  // WHY: 사용자가 로그인/새로고침을 연속 수행하면 getToken 연타가 발생할 수 있음.
    const lastSyncedAtRaw = localStorage.getItem(LAST_SYNCED_AT_KEY);
    const lastSyncedAt = lastSyncedAtRaw ? Number(lastSyncedAtRaw) : 0;
    const now = Date.now();
    if (Number.isFinite(lastSyncedAt) && now - lastSyncedAt < TOKEN_SYNC_COOLDOWN_MS) {
      return localStorage.getItem(LAST_SYNCED_FCM_TOKEN_KEY);
    }

    const messaging = getFirebaseMessaging();

  // FCM 토큰 발급
  // registration을 넘겨서 "이 SW를 사용해 푸시 처리"를 명시합니다.
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration ?? undefined,
    });

  // 토큰이 비어있으면 실패 처리
    if (!token) {
      console.warn('[FCM] 토큰 발급 실패(빈 토큰).');
      return null;
    }

  // 이미 서버와 동기화한 동일 토큰이면 API 재호출 생략
    const lastSyncedToken = localStorage.getItem(LAST_SYNCED_FCM_TOKEN_KEY);
    if (lastSyncedToken === token) {
      localStorage.setItem(LAST_SYNCED_AT_KEY, String(Date.now()));
      return token;
    }

  // 백엔드 토큰 등록
    await registerFcmToken({ deviceToken: token });
    // 성공 시 로컬에 저장 (다음부터 중복 등록 방지)
    localStorage.setItem(LAST_SYNCED_FCM_TOKEN_KEY, token);
    localStorage.setItem(LAST_SYNCED_AT_KEY, String(Date.now()));
    return token;
  })();

  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}
