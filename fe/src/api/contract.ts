import type { ApiResponse } from './auction.types';
import instance from './instance';

export type WageType = 'HOURLY' | 'DAILY' | 'MONTHLY';
export type BackendContractStatus = 'DRAFT' | 'OWNER_SIGNED' | 'COMPLETED';
export type UIContractStatus = 'REQUESTING' | 'PENDING_APPROVAL' | 'APPROVED';

export const mapContractStatus = (status: string): UIContractStatus => {
  if (status === 'DRAFT') return 'REQUESTING';
  if (status === 'OWNER_SIGNED') return 'PENDING_APPROVAL';
  return 'APPROVED';
};

export interface ContractSummary {
  contractId: number;
  employeeName: string;
  status: BackendContractStatus;
  contractDate: string;
  contractStartDate: string;
  contractEndDate: string | null;
  createdAt: string;
}

export interface ContractDetail {
  contractId: number;
  storeEmployeeId: number;
  employerName: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  employeeName: string;
  employeePhone: string;
  employeeAddress: string;
  contractStartDate: string;
  contractEndDate: string | null;
  workplace: string;
  jobDescription: string;
  workStartTime: string;
  workEndTime: string;
  breakStartTime: string | null;
  breakEndTime: string | null;
  workDaysPerWeek: number;
  weeklyHoliday: string;
  wageType: WageType;
  wageAmount: number;
  hasBonus: boolean;
  bonusAmount: number | null;
  hasOtherAllowance: boolean;
  otherAllowanceDetails: string | null;
  payDayDescription: string;
  paymentMethod: string;
  employmentInsurance: boolean;
  industrialAccidentInsurance: boolean;
  nationalPension: boolean;
  healthInsurance: boolean;
  contractDate: string;
  status: BackendContractStatus;
  ownerSigned: boolean;
  ownerSignedAt: string | null;
  employeeSigned: boolean;
  employeeSignedAt: string | null;
  createdAt: string;
}

export interface CreateContractRequest {
  contractStartDate: string;
  contractEndDate?: string | null;
  workplace?: string;
  jobDescription: string;
  workStartTime: string;
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
  contractDate: string;
  employeeAddress: string;
}

export interface ContractSignRequest {
  signature: string;
}

export interface ContractPdfResult {
  blob: Blob;
  fileName: string;
}

function parseFileNameFromContentDisposition(
  contentDisposition: string | undefined,
  fallback: string
) {
  if (!contentDisposition) return fallback;

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) return plainMatch[1];

  return fallback;
}

export async function createContract(
  storeId: number,
  employeeId: number,
  body: CreateContractRequest
) {
  const { data } = await instance.post<ApiResponse<ContractDetail>>(
    `/api/v1/stores/${storeId}/contracts/${employeeId}`,
    body
  );
  return data.data;
}

export async function getContracts(storeId: number) {
  const { data } = await instance.get<ApiResponse<ContractSummary[]>>(
    `/api/v1/stores/${storeId}/contracts`
  );
  return data.data;
}

export async function getMyContracts(storeId: number) {
  const { data } = await instance.get<ApiResponse<ContractSummary[]>>(
    `/api/v1/stores/${storeId}/contracts/me`
  );
  return data.data;
}

export async function getContractDetail(storeId: number, contractId: number) {
  const { data } = await instance.get<ApiResponse<ContractDetail>>(
    `/api/v1/stores/${storeId}/contracts/${contractId}`
  );
  return data.data;
}

export async function signByOwner(
  storeId: number,
  contractId: number,
  body: ContractSignRequest
) {
  const { data } = await instance.patch<ApiResponse<ContractDetail>>(
    `/api/v1/stores/${storeId}/contracts/${contractId}/sign/owner`,
    body
  );
  return data.data;
}

export async function signByEmployee(
  storeId: number,
  contractId: number,
  body: ContractSignRequest
) {
  const { data } = await instance.patch<ApiResponse<ContractDetail>>(
    `/api/v1/stores/${storeId}/contracts/${contractId}/sign/employee`,
    body
  );
  return data.data;
}

export async function getContractPdfBlob(
  storeId: number,
  contractId: number,
  download = false
): Promise<ContractPdfResult> {
  const fallbackName = `contract-${contractId}.pdf`;
  const response = await instance.get<Blob>(
    `/api/v1/stores/${storeId}/contracts/${contractId}/pdf`,
    {
      params: { download },
      responseType: 'blob',
    }
  );

  const rawContentDisposition = response.headers['content-disposition'] as
    | string
    | undefined;
  const fileName = parseFileNameFromContentDisposition(
    rawContentDisposition,
    fallbackName
  );

  return { blob: response.data, fileName };
}
