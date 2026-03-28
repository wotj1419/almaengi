import type { ApiResponse } from './auction.types';
import instance from './instance';

export type WageType = 'HOURLY' | 'DAILY' | 'MONTHLY';

// 백엔드 상태값
export type BackendContractStatus = 'DRAFT' | 'OWNER_SIGNED' | 'COMPLETED';

// UI 상태값 (프론트엔드 표시용)
export type UIContractStatus = 'REQUESTING' | 'PENDING_APPROVAL' | 'APPROVED';

// 백엔드 상태 → UI 상태 매핑
export const mapContractStatus = (status: string): UIContractStatus => {
  if (status === 'DRAFT') return 'REQUESTING';
  if (status === 'OWNER_SIGNED') return 'PENDING_APPROVAL';
  return 'APPROVED'; // COMPLETED
};

export interface ContractInfo {
  contractId: number;
  employeeId: number;
  employeeName: string;
  status: BackendContractStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractRequest {
  contractStartDate: string; // YYYY-MM-DD
  contractEndDate?: string | null;
  workplace?: string;
  jobDescription: string;
  workStartTime: string; // HH:MM
  workEndTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  workDaysPerWeek: number;
  weeklyHoliday: string;
  wageType: WageType;
  wageAmount: number;
  hasBonus: boolean;
  bonusAmount?: number | null;
  hasOtherAllowance: boolean;
  otherAllowanceDetails?: string | null;
  payDayDescription: string;
  employmentInsurance: boolean;
  industrialAccidentInsurance: boolean;
  nationalPension: boolean;
  healthInsurance: boolean;
  contractDate: string; // YYYY-MM-DD
  employeeAddress: string;
}

export async function createContract(
  storeId: number,
  employeeId: number,
  body: CreateContractRequest
) {
  const { data } = await instance.post<ApiResponse<ContractInfo>>(
    `/api/v1/stores/${storeId}/contracts/${employeeId}`,
    body
  );
  return data.data;
}

// 사장용: 매장의 근로계약서 목록 조회
export async function getContracts(storeId: number) {
  const { data } = await instance.get<ApiResponse<ContractInfo[]>>(
    `/api/v1/stores/${storeId}/contracts`
  );
  return data.data;
}

// 직원용: 내 근로계약서 목록 조회
export async function getMyContracts(storeId: number) {
  const { data } = await instance.get<ApiResponse<ContractInfo[]>>(
    `/api/v1/stores/${storeId}/contracts/me`
  );
  return data.data;
}
