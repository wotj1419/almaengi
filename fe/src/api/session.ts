import type { ApiResponse } from './auction.types';

type ReissueResponse = {
  accessToken?: string;
};

// ─── JWT 페이로드 디코딩 ────────────────────────────────────────────────────
// 서명 검증 없이 클레임만 읽기 위한 유틸 함수
// JWT 구조: header.payload.signature (base64url 인코딩)
// 중간 segment(payload)를 base64url → base64 → JSON으로 변환
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    // base64url → base64 표준 포맷으로 변환 (- → +, _ → /)
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── 세션 인증 결과 타입 ────────────────────────────────────────────────────
// 인증 성공 시 userId·role·accessToken을 함께 반환해
// 호출 측에서 Zustand store를 올바르게 업데이트할 수 있도록 함
// (이전: 'authenticated' | 'unauthenticated' → userId/role 정보 없음)
export type SessionAuthResult =
  | 'unauthenticated'
  | {
      status: 'authenticated';
      userId: number;
      role: 'OWNER' | 'EMPLOYEE';
      accessToken: string;
    };

// ─── 세션 재발급으로 인증 상태 확인 ─────────────────────────────────────────
// refreshToken(cookie)으로 accessToken 재발급 시도
// 성공 시: JWT payload에서 userId(sub)·role을 추출해 반환
// 실패 시: localStorage에서 accessToken 제거 후 'unauthenticated' 반환
export async function validateSessionByReissue(): Promise<SessionAuthResult> {
  const currentAccessToken = localStorage.getItem('accessToken');
  if (!currentAccessToken) {
    return 'unauthenticated';
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

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
      return 'unauthenticated';
    }

    const payload = (await response.json()) as ApiResponse<ReissueResponse>;
    const nextAccessToken = payload?.data?.accessToken;

    if (payload?.status === 'SUCCESS' && typeof nextAccessToken === 'string') {
      localStorage.setItem('accessToken', nextAccessToken);

      // JWT payload에서 userId와 role 추출
      // 백엔드 JwtProvider: sub=userId(Long→String), role='OWNER'|'EMPLOYEE'
      const jwtPayload = decodeJwtPayload(nextAccessToken);
      const userId = Number(jwtPayload?.sub);
      const role = jwtPayload?.role as 'OWNER' | 'EMPLOYEE' | undefined;

      // userId 또는 role 파싱 실패 시 인증 불가 처리
      if (!userId || (role !== 'OWNER' && role !== 'EMPLOYEE')) {
        localStorage.removeItem('accessToken');
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
    return 'unauthenticated';
  } catch {
    localStorage.removeItem('accessToken');
    return 'unauthenticated';
  }
}
