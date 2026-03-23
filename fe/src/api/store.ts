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

export async function getMyStores() {
  const { data } =
    await instance.get<ApiResponse<StoreInfo[]>>('/api/v1/stores');
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
