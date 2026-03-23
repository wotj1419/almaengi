// 직원 관리 feature에서 사용하는 UI 텍스트 상수 - 하드코딩 방지 및 일괄 수정 용이
import type { StaffGroupKey } from '@/features/employee/types/employeeRecord';

// 직원 관리 메인 페이지에서 사용하는 라벨/메시지 모음
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

// 탭 UI에 표시할 그룹 라벨
export const STAFF_GROUP_LABEL: Record<StaffGroupKey, string> = {
  CURRENT: '현재 직원',
  RESIGNED: '퇴사 직원',
};

// 해당 그룹에 직원이 없을 때 표시할 빈 상태 메시지
export const STAFF_GROUP_EMPTY_MESSAGE: Record<StaffGroupKey, string> = {
  CURRENT: '현재 직원이 없습니다.',
  RESIGNED: '퇴사 직원이 없습니다.',
};
