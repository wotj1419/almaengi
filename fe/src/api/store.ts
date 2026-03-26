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
