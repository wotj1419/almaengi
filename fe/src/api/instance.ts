import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 모든 요청에  JWT 토큰 자동 삽입
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 401 에러 시 자동 로그아웃
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // ─── 로그인 요청 예외 처리 ──────────────────────────────────────────────
    // [목적] 로그인 페이지에서 401 발생 시 (비밀번호 불일치 등)
    //        자동 리다이렉트하지 않고 필드 에러로 표시하기 위함
    // [처리] 로그인 요청 URL인지 확인 후 조건부 리다이렉트
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      // 로그인 요청 외의 일반 API 401 → 자동 로그아웃 및 리다이렉트
      // (토큰 만료, 권한 부족 등)
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
