import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// 동시 요청 중복 재발급 방지: reissue 진행 중이면 나머지 요청은 대기열에서 대기
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

function clearClientAuthState() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('auth-storage');
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 로그인 요청의 401은 비밀번호 불일치 등이므로 재발급하지 않음
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isReissueRequest = error.config?.url?.includes('/auth/reissue');

    // accessToken이 없으면 로그인 전 상태이므로 reissue 시도하지 않음
    const hasToken = !!localStorage.getItem('accessToken');

    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      !isReissueRequest &&
      hasToken
    ) {
      const originalRequest = error.config as InternalAxiosRequestConfig;

      // 재시도했는데도 401이면 무한 루프 방지를 위해 로그아웃
      if (originalRequest._retry) {
        clearClientAuthState();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // 이미 재발급 진행 중이면 대기열에서 대기
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        // instance 대신 axios 직접 사용 — 이 인터셉터의 재귀 호출 방지
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/auth/reissue`,
          null,
          { withCredentials: true }
        );

        const newAccessToken: string = data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearClientAuthState();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
