import instance from './instance';

export type WageType = 'HOURLY' | 'DAILY' | 'MONTHLY';

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

export function createContract(
  storeId: number,
  employeeId: number,
  body: CreateContractRequest
) {
  return instance.post(
    `/api/v1/stores/${storeId}/contracts/${employeeId}`,
    body
  );
}
