import type { EmployeeStatus } from '@/features/employee/data/mockEmployee';

// 직원 목록 탭 구분 키 - 현재 직원 / 퇴사 직원
export type StaffGroupKey = 'CURRENT' | 'RESIGNED';

// 직원 목록에서 초대/재직/퇴사 직원을 통합하여 관리하는 레코드 타입
export type EmployeeRecord = {
  id: number;
  name: string;
  avatarSeed: string;
  status: EmployeeStatus;
  phone?: string;
  workSummary?: string;
};

// '현재 직원' 탭에 포함되는 상태 그룹 (재직, 휴직, 우수직원)
export const WORKING_STATUS_GROUP: EmployeeStatus[] = [
  'WORKING',
  'ON_LEAVE',
  'BEST',
];
