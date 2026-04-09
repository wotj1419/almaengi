import instance from './instance';
import type { ApiResponse } from './auction.types';

// ─── 요청 타입 ───

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'OWNER' | 'EMPLOYEE';
}

export interface WithdrawRequest {
  password?: string;
}

// ─── 응답 타입 ───

export interface LoginResponse {
  userId: number;
  email: string;
  name: string;
  role: 'OWNER' | 'EMPLOYEE';
  accessToken: string;
}

export interface SignupResponse {
  userId: number;
  email: string;
  name: string;
  role: 'OWNER' | 'EMPLOYEE';
}

export interface EmailCheckResponse {
  exists: boolean;
}

export interface TokenResponse {
  accessToken: string;
}

// ─── API 함수 ───

// 로그인 (POST /api/v1/auth/login)
export async function login(body: LoginRequest) {
  const { data } = await instance.post<ApiResponse<LoginResponse>>(
    '/api/v1/auth/login',
    body
  );
  return data;
}

// 회원가입 (POST /api/v1/auth/signup)
export async function signup(body: SignupRequest) {
  const { data } = await instance.post<ApiResponse<SignupResponse>>(
    '/api/v1/auth/signup',
    body
  );
  return data;
}

// 이메일 중복 확인 (GET /api/v1/auth/check-email?email=)
export async function checkEmail(email: string) {
  const { data } = await instance.get<ApiResponse<EmailCheckResponse>>(
    '/api/v1/auth/check-email',
    { params: { email } }
  );
  return data;
}

// 토큰 재발급 (POST /api/v1/auth/reissue)
export async function reissueToken() {
  const { data } = await instance.post<ApiResponse<TokenResponse>>(
    '/api/v1/auth/reissue'
  );
  return data;
}

// 로그아웃 (POST /api/v1/auth/logout)
export async function logout() {
  const { data } = await instance.post<ApiResponse<null>>(
    '/api/v1/auth/logout'
  );
  return data;
}

// 회원 탈퇴 (DELETE /api/v1/auth/withdraw)
export async function withdraw(body: WithdrawRequest) {
  const { data } = await instance.delete<ApiResponse<null>>(
    '/api/v1/auth/withdraw',
    { data: body }
  );
  return data;
}
