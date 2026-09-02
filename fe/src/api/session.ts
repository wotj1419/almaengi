import type { ApiResponse } from './auction.types';
import { isDemoMode } from '@/demo/config';

type ReissueResponse = {
  accessToken?: string;
};

// JWT payload를 서명 검증 없이 디코딩 (클레임 읽기용)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type SessionAuthResult =
  | 'unauthenticated'
  | {
      status: 'authenticated';
      userId: number;
      role: 'OWNER' | 'EMPLOYEE';
      accessToken: string;
    };

// StrictMode 재마운트/동시 호출 시 중복 reissue 요청을 방지합니다.
let validateSessionInFlight: Promise<SessionAuthResult> | null = null;

// 최근 unauthenticated 판정 직후의 짧은 구간에서는 네트워크 재시도를 건너뜁니다.
let lastUnauthenticatedAt = 0;
const UNAUTHENTICATED_COOLDOWN_MS = 5000;

// RT(cookie)로 AT 재발급을 시도하여 세션 유효성 확인
export async function validateSessionByReissue(): Promise<SessionAuthResult> {
  if (isDemoMode()) {
    return 'unauthenticated';
  }

  if (validateSessionInFlight) {
    return validateSessionInFlight;
  }

  const now = Date.now();
  if (now - lastUnauthenticatedAt < UNAUTHENTICATED_COOLDOWN_MS) {
    return 'unauthenticated';
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  validateSessionInFlight = (async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/reissue`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        localStorage.removeItem('accessToken');
        lastUnauthenticatedAt = Date.now();
        return 'unauthenticated';
      }

      const payload = (await response.json()) as ApiResponse<ReissueResponse>;
      const nextAccessToken = payload?.data?.accessToken;

      if (
        payload?.status === 'SUCCESS' &&
        typeof nextAccessToken === 'string'
      ) {
        localStorage.setItem('accessToken', nextAccessToken);

        const jwtPayload = decodeJwtPayload(nextAccessToken);
        const userId = Number(jwtPayload?.sub);
        const role = jwtPayload?.role as 'OWNER' | 'EMPLOYEE' | undefined;

        if (!userId || (role !== 'OWNER' && role !== 'EMPLOYEE')) {
          localStorage.removeItem('accessToken');
          lastUnauthenticatedAt = Date.now();
          return 'unauthenticated';
        }

        return {
          status: 'authenticated',
          userId,
          role,
          accessToken: nextAccessToken,
        };
      }

      localStorage.removeItem('accessToken');
      lastUnauthenticatedAt = Date.now();
      return 'unauthenticated';
    } catch {
      localStorage.removeItem('accessToken');
      lastUnauthenticatedAt = Date.now();
      return 'unauthenticated';
    }
  })();

  try {
    return await validateSessionInFlight;
  } finally {
    validateSessionInFlight = null;
  }
}
