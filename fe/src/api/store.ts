import instance from './instance';
import type { ApiResponse } from './auction.types';

export interface StoreInfo {
  storeId: number;
  storeName: string;
  address: string;
  phone: string | null;
  qrCode: string;
  isOver5Employees: boolean;
}

export interface CreateStoreRequest {
  storeName: string;
  address: string;
  phone?: string | null;
  isOver5Employees?: boolean;
}

export async function getMyStores() {
  const { data } =
    await instance.get<ApiResponse<StoreInfo[]>>('/api/v1/stores');
  return data.data;
}

export async function getMyEmployeeStores() {
  const { data } = await instance.get<ApiResponse<StoreInfo[]>>(
    '/api/v1/stores/employees/my'
  );
  return data.data;
}

export async function getMyStoresWithToken(accessToken: string) {
  const { data } = await instance.get<ApiResponse<StoreInfo[]>>(
    '/api/v1/stores',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return data.data;
}

export async function getStore(storeId: number) {
  const { data } = await instance.get<ApiResponse<StoreInfo>>(
    `/api/v1/stores/${storeId}`
  );
  return data.data;
}

export async function createStore(body: CreateStoreRequest) {
  const { data } = await instance.post<ApiResponse<StoreInfo>>(
    '/api/v1/stores',
    body
  );
  return data.data;
}

export interface UpdateStoreRequest {
  storeName: string;
  address: string;
  phone?: string | null;
  isOver5Employees?: boolean;
}

export async function updateStore(storeId: number, body: UpdateStoreRequest) {
  const { data } = await instance.put<ApiResponse<StoreInfo>>(
    `/api/v1/stores/${storeId}`,
    body
  );
  return data.data;
}

export interface InviteCodeInfo {
  inviteCode: string;
  expiredAt: string;
}

export async function generateInviteCode(storeId: number) {
  const { data } = await instance.post<ApiResponse<InviteCodeInfo>>(
    `/api/v1/stores/${storeId}/invite-code`
  );
  return data.data;
}

export interface Employee {
  employeeId: number;
  userId: number;
  name: string;
  phone?: string | null;
  position: string;
  hourlyWage: number;
  taxType: string;
  includeHolidayPay: boolean;
  hireDate: string;
  status: string;
}

export async function getEmployees(storeId: number) {
  const { data } = await instance.get<ApiResponse<Employee[]>>(
    `/api/v1/stores/${storeId}/employees`
  );
  return data.data;
}

export type StoreEmployeeStatus =
  | 'INVITED'
  | 'WAITING'
  | 'WORKING'
  | 'RESTING'
  | 'BEST'
  | 'RESIGNED'
  | 'ON_LEAVE';

export async function getEmployeesByStatus(
  storeId: number,
  status: StoreEmployeeStatus
) {
  const { data } = await instance.get<ApiResponse<Employee[]>>(
    `/api/v1/stores/${storeId}/employees/status`,
    { params: { status } }
  );
  return data.data;
}

export async function approveEmployee(storeId: number, employeeId: number) {
  const { data } = await instance.patch<ApiResponse<Employee>>(
    `/api/v1/stores/${storeId}/employees/${employeeId}/approve`
  );
  return data.data;
}

// ─── 직원 합류 ───────────────────────────────────────────────────────────────

export interface EmployeeInfo {
  employeeId: number;
  userId: number;
  name: string;
  position: string | null;
  hourlyWage: number;
  taxType: string;
  includeHolidayPay: boolean;
  hireDate: string;
  status: string;
}

// 로그인 시점(토큰 미설정)에 직원 매장 목록 조회용 — getMyStoresWithToken과 동일 패턴
export async function getMyEmployeeStoresWithToken(accessToken: string) {
  const { data } = await instance.get<ApiResponse<StoreInfo[]>>(
    '/api/v1/stores/employees/my',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return data.data;
}

export async function joinStore(inviteCode: string) {
  const { data } = await instance.post<ApiResponse<EmployeeInfo>>(
    '/api/v1/stores/employees/join',
    { inviteCode }
  );
  return data.data;
}
