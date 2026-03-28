import type { EmployeeStatus } from '@/features/employee/data/mockEmployee';

// 직원 목록 탭 구분 키 - 현재 직원 / 퇴사 직원
export type StaffGroupKey = 'CURRENT' | 'RESIGNED';

// 백엔드에서 반환하는 직원 상태 (API 기반)
export type BackendEmployeeStatus = 'WORKING' | 'RESTING' | 'BEST' | 'RESIGNED';

// 직원 목록에서 사용하는 UI 상태 (초대 대기 포함)
export type UIEmployeeStatus = EmployeeStatus | BackendEmployeeStatus;

// 직원 목록에서 초대/재직/퇴사 직원을 통합하여 관리하는 레코드 타입
export type EmployeeRecord = {
  id: number;
  name: string;
  avatarSeed: string;
  status: UIEmployeeStatus;
  phone?: string;
  workSummary?: string;
  position?: string;
  hourlyWage?: number;
};

// '현재 직원' 탭에 포함되는 상태 그룹 (재직, 휴직, 우수직원)
export const WORKING_STATUS_GROUP: UIEmployeeStatus[] = [
  'WORKING',
  'ON_LEAVE',
  'RESTING',
  'BEST',
];
