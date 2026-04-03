import type { StaffGroupKey } from '@/features/employee/types/employeeRecord';

export const EMPLOYEE_PAGE_TEXT = {
  pageTitle: '직원 관리',
  inviteAction: '신규직원 초대',
  contractAction: '근로계약서 작성',
  invitedSectionTitle: '초대 직원',
  staffSectionTitle: '직원 목록',
  inviteWaitingSummary: '초대 대기 중',
  defaultWorkSummary: '근무 일정 미정',
  invitedEmptyMessage: '초대된 직원이 없습니다.',
} as const;

export const STAFF_GROUP_LABEL: Record<StaffGroupKey, string> = {
  CURRENT: '현재 직원',
  RESIGNED: '퇴사 직원',
};

export const STAFF_GROUP_EMPTY_MESSAGE: Record<StaffGroupKey, string> = {
  CURRENT: '현재 직원이 없습니다.',
  RESIGNED: '퇴사 직원이 없습니다.',
};
