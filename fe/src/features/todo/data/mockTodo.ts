import type { Todo } from '@/features/todo/types';

export type Employee = {
  id: number;
  name: string;
};

export const EMPLOYEES: Employee[] = [
  { id: 1, name: '박직원' },
  { id: 2, name: '차직원' },
  { id: 3, name: '최직원' },
  { id: 4, name: '정직원' },
  { id: 5, name: '함직원' },
];

export function getEmployeeNames(ids: number[]): string {
  return ids
    .map((id) => EMPLOYEES.find((e) => e.id === id)?.name ?? '')
    .filter(Boolean)
    .join(', ');
}

export const mockTodos: Todo[] = [
  {
    task_id: 1,
    store_id: 1,
    assignee_employee_ids: [1, 2],
    completed_employee_ids: [1],
    creator_user_id: 1,
    title: '냉장고 식재료 정리',
    description: '유통기한 지난 식재료 폐기 및 식재료 목록 업데이트',
    due_at: '2026-03-30T18:00:00',
    status: '진행중',
    completed_at: null,
    created_at: '2026-03-15T09:00:00',
    updated_at: '2026-03-15T09:00:00',
    images: [],
  },
  {
    task_id: 2,
    store_id: 1,
    assignee_employee_ids: [3],
    completed_employee_ids: [3],
    creator_user_id: 1,
    title: '홀 청소 및 테이블 세팅',
    description: '영업 전 홀 전체 청소 후 테이블 세팅 완료',
    due_at: '2026-03-18T09:00:00',
    status: '완료',
    completed_at: '2026-03-18T08:30:00',
    created_at: '2026-03-15T09:00:00',
    updated_at: '2026-03-18T08:30:00',
    images: [],
  },
  {
    task_id: 3,
    store_id: 1,
    assignee_employee_ids: [4],
    completed_employee_ids: [4],
    creator_user_id: 1,
    title: '주방 기기 점검',
    description: '그릴, 튀김기, 오븐 작동 상태 점검 및 이상 유무 보고',
    due_at: '2026-03-20T10:00:00',
    status: '미완료',
    completed_at: null,
    created_at: '2026-03-15T09:00:00',
    updated_at: '2026-03-15T09:00:00',
    images: [],
  },
  {
    task_id: 4,
    store_id: 1,
    assignee_employee_ids: [2],
    completed_employee_ids: [],
    creator_user_id: 1,
    title: '재고 발주 요청',
    description: '이번 주 부족한 소모품 및 식재료 발주 요청서 작성',
    due_at: '2026-03-21T17:00:00',
    status: '진행중',
    completed_at: null,
    created_at: '2026-03-15T09:00:00',
    updated_at: '2026-03-15T09:00:00',
    images: [],
  },
  {
    task_id: 5,
    store_id: 1,
    assignee_employee_ids: [1],
    completed_employee_ids: [1],
    creator_user_id: 1,
    title: '직원 교육 자료 배포',
    description: '신규 메뉴 조리법 및 서비스 가이드 자료 공유',
    due_at: '2026-03-18T14:00:00',
    status: '완료',
    completed_at: '2026-03-18T13:50:00',
    created_at: '2026-03-15T09:00:00',
    updated_at: '2026-03-18T13:50:00',
    images: [],
  },
  {
    task_id: 6,
    store_id: 1,
    assignee_employee_ids: [4],
    completed_employee_ids: [],
    creator_user_id: 1,
    title: '화장실 청소 점검',
    description: '화장실 청소 상태 확인 및 소모품 보충',
    due_at: '2026-03-19T20:00:00',
    status: '진행중',
    completed_at: null,
    created_at: '2026-03-15T09:00:00',
    updated_at: '2026-03-15T09:00:00',
    images: [],
  },
];
