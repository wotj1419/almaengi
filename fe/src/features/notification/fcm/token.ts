import { deleteToken, getToken } from 'firebase/messaging';
import { registerFcmToken } from '@/api/notification';
import { getFirebaseMessaging } from './firebase';

// 마지막으로 서버에 동기화한 FCM 토큰 저장 키
const LAST_SYNCED_FCM_TOKEN_KEY = 'lastSyncedFcmToken';

// 최근 동기화 시각 저장 키
// WHY: 로그인 직후 + 앱 부팅 훅 등에서 짧은 시간에 getToken이 중복 호출되면
// Chrome Push 서비스에서 TOO_MANY_REGISTRATIONS가 발생할 수 있습니다.
const LAST_SYNCED_AT_KEY = 'lastSyncedFcmTokenAt';

// 탭 간 동시 토큰 발급을 막기 위한 락 키
const CROSS_TAB_LOCK_OWNER_KEY = 'fcmSyncLockOwner';
const CROSS_TAB_LOCK_EXPIRES_AT_KEY = 'fcmSyncLockExpiresAt';

// 과도한 재등록 방지를 위한 최소 간격(밀리초)
const TOKEN_SYNC_COOLDOWN_MS = 10_000;

// 탭 간 락 유지 시간(밀리초)
// WHY: getToken 실행 시간 동안 다른 탭의 진입을 막습니다.
const CROSS_TAB_LOCK_TTL_MS = 15_000;

// AbortError 재시도 백오프(1회)
const ABORT_RETRY_DELAY_MS = 1_500;

// 하드 실패(AbortError/등록 한도 의심) 쿨다운 키
const LAST_HARD_FAILURE_AT_KEY = 'lastFcmHardFailureAt';
const HARD_FAILURE_COOLDOWN_MS = 60_000;

// 모듈 스코프 in-flight 락
// WHY: 동시 호출이 들어와도 getToken을 1회만 실행해서 push registration race를 방지합니다.
let syncInFlight: Promise<string | null> | null = null;

// 탭 식별자(세션 동안 고정)
const TAB_OWNER_ID = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function parseFiniteNumber(raw: string | null): number {
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

function acquireCrossTabLock(): boolean {
  try {
    const now = Date.now();
    const owner = localStorage.getItem(CROSS_TAB_LOCK_OWNER_KEY);
    const expiresAt = parseFiniteNumber(
      localStorage.getItem(CROSS_TAB_LOCK_EXPIRES_AT_KEY)
    );

    // 만료된 락은 정리 후 현재 탭이 점유합니다.
    if (!owner || expiresAt <= now || owner === TAB_OWNER_ID) {
      localStorage.setItem(CROSS_TAB_LOCK_OWNER_KEY, TAB_OWNER_ID);
      localStorage.setItem(
        CROSS_TAB_LOCK_EXPIRES_AT_KEY,
        String(now + CROSS_TAB_LOCK_TTL_MS)
      );
      return true;
    }

    return false;
  } catch {
    // localStorage 접근 실패(사파리 프라이빗 등) 환경에서는 락 없이 진행
    return true;
  }
}

function releaseCrossTabLock() {
  try {
    const owner = localStorage.getItem(CROSS_TAB_LOCK_OWNER_KEY);
    if (owner !== TAB_OWNER_ID) return;

    localStorage.removeItem(CROSS_TAB_LOCK_OWNER_KEY);
    localStorage.removeItem(CROSS_TAB_LOCK_EXPIRES_AT_KEY);
  } catch {
    // no-op
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name?: string }).name === 'AbortError';
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldSkipByHardFailureCooldown() {
  const lastRaw = localStorage.getItem(LAST_HARD_FAILURE_AT_KEY);
  const last = parseFiniteNumber(lastRaw);
  if (!last) return false;

  const remainMs = HARD_FAILURE_COOLDOWN_MS - (Date.now() - last);
  if (remainMs <= 0) return false;

  console.warn(
    `[FCM] 직전 하드 실패로 쿨다운 중입니다. ${Math.ceil(remainMs / 1000)}초 후 재시도합니다.`
  );
  return true;
}

function markHardFailure() {
  localStorage.setItem(LAST_HARD_FAILURE_AT_KEY, String(Date.now()));
}

function clearHardFailure() {
  localStorage.removeItem(LAST_HARD_FAILURE_AT_KEY);
}

async function recoverAfterAbortError(
  registration: ServiceWorkerRegistration | null
): Promise<void> {
  // WHY: 브라우저 프로필에 누적된 오래된 PushSubscription 때문에
  // TOO_MANY_REGISTRATIONS가 발생할 수 있어, 현재 구독/토큰을 정리한 뒤 재시도합니다.
  try {
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.info('[FCM] 기존 PushSubscription을 해제했습니다.');
    }
  } catch (error) {
    console.warn(
      '[FCM] PushSubscription 해제 중 오류가 발생했지만 재시도를 계속합니다.',
      error
    );
  }

  try {
    const messaging = getFirebaseMessaging();
    await deleteToken(messaging);
    console.info('[FCM] 기존 Firebase 토큰을 삭제했습니다.');
  } catch (error) {
    console.warn(
      '[FCM] Firebase 토큰 삭제 중 오류가 발생했지만 재시도를 계속합니다.',
      error
    );
  }
}

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
      console.warn(
        '[FCM] VITE_FIREBASE_VAPID_KEY가 없어 토큰 발급을 건너뜁니다.'
      );
      return null;
    }

    // 최근 동기화가 아주 짧은 시간 내에 발생했다면 재시도하지 않습니다.
    // WHY: 사용자가 로그인/새로고침을 연속 수행하면 getToken 연타가 발생할 수 있음.
    const lastSyncedAtRaw = localStorage.getItem(LAST_SYNCED_AT_KEY);
    const lastSyncedAt = lastSyncedAtRaw ? Number(lastSyncedAtRaw) : 0;
    const now = Date.now();
    if (
      Number.isFinite(lastSyncedAt) &&
      now - lastSyncedAt < TOKEN_SYNC_COOLDOWN_MS
    ) {
      return localStorage.getItem(LAST_SYNCED_FCM_TOKEN_KEY);
    }

    // 하드 실패 직후에는 재시도를 잠시 멈춰 브라우저 Push 서비스 안정화를 기다립니다.
    if (shouldSkipByHardFailureCooldown()) {
      return localStorage.getItem(LAST_SYNCED_FCM_TOKEN_KEY);
    }

    // 탭 간 경쟁 방지 락 획득
    // WHY: 같은 시점에 여러 탭이 getToken을 호출하면 push registration race가 발생할 수 있습니다.
    const hasCrossTabLock = acquireCrossTabLock();
    if (!hasCrossTabLock) {
      console.info(
        '[FCM] 다른 탭에서 토큰 동기화 진행 중이라 이번 시도는 건너뜁니다.'
      );
      return localStorage.getItem(LAST_SYNCED_FCM_TOKEN_KEY);
    }

    try {
      const messaging = getFirebaseMessaging();

      // FCM 토큰 발급
      // registration을 넘겨서 "이 SW를 사용해 푸시 처리"를 명시합니다.
      // AbortError는 브라우저 Push 내부 상태 이슈로 간헐 발생 가능하여 1회 재시도합니다.
      let token: string;
      try {
        token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration ?? undefined,
        });
      } catch (error) {
        if (!isAbortError(error)) throw error;

        console.warn(
          `[FCM] AbortError 발생, ${ABORT_RETRY_DELAY_MS}ms 후 1회 재시도합니다.`
        );

        await recoverAfterAbortError(registration);
        await sleep(ABORT_RETRY_DELAY_MS);

        try {
          token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration ?? undefined,
          });
        } catch (retryError) {
          // 재시도까지 실패하면 하드 실패로 판단하고 일정 시간 쿨다운합니다.
          markHardFailure();
          throw retryError;
        }
      }

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
      clearHardFailure();
      return token;
    } finally {
      releaseCrossTabLock();
    }
  })();

  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}
