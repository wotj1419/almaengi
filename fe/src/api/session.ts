import type { ApiResponse } from './auction.types';

type ReissueResponse = {
  accessToken?: string;
};

export type SessionAuthStatus = 'authenticated' | 'unauthenticated';

export async function validateSessionByReissue(): Promise<SessionAuthStatus> {
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
      return 'authenticated';
    }

    localStorage.removeItem('accessToken');
    return 'unauthenticated';
  } catch {
    localStorage.removeItem('accessToken');
    return 'unauthenticated';
  }
}
