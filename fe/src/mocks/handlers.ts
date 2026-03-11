import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const handlers = [
  // 예시: 로그인 API mock
  http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json({
      accessToken: 'mock-jwt-token',
      user: { id: 1, name: '홍길동', role: 'OWNER' },
    });
  }),
];
