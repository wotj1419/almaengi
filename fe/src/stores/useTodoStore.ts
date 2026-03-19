import { create } from 'zustand';

export const EMPLOYEES = ['박직원', '차직원', '최직원', '정직원', '함직원'];

export type TodoStatus = '진행중' | '완료' | '미완료';

export type Todo = {
  id: string;
  title: string;
  detail: string;
  deadline: string;
  employees: string[];
  photos: string[];
  status: TodoStatus;
};

type TodoStore = {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id' | 'status'>) => void;
  updateTodo: (id: string, todo: Omit<Todo, 'id' | 'status'>) => void;
  updateTodosStatus: (ids: string[], status: TodoStatus) => void;
  deleteTodos: (ids: string[]) => void;
};

const mockTodos: Todo[] = [
  {
    id: 'mock-1',
    title: '냉장고 식재료 정리',
    detail: '유통기한 지난 식재료 폐기 및 식재료 목록 업데이트',
    deadline: '3월 20일 18:00까지',
    employees: ['박직원', '차직원'],
    photos: [],
    status: '미완료',
  },
  {
    id: 'mock-2',
    title: '홀 청소 및 테이블 세팅',
    detail: '영업 전 홀 전체 청소 후 테이블 세팅 완료',
    deadline: '3월 18일 09:00까지',
    employees: ['최직원'],
    photos: [],
    status: '완료',
  },
  {
    id: 'mock-3',
    title: '주방 기기 점검',
    detail: '그릴, 튀김기, 오븐 작동 상태 점검 및 이상 유무 보고',
    deadline: '3월 19일 10:00까지',
    employees: ['정직원', '함직원'],
    photos: [],
    status: '진행중',
  },
  {
    id: 'mock-4',
    title: '재고 발주 요청',
    detail: '이번 주 부족한 소모품 및 식재료 발주 요청서 작성',
    deadline: '3월 21일 17:00까지',
    employees: ['차직원'],
    photos: [],
    status: '미완료',
  },
  {
    id: 'mock-5',
    title: '직원 교육 자료 배포',
    detail: '신규 메뉴 조리법 및 서비스 가이드 자료 공유',
    deadline: '3월 18일 14:00까지',
    employees: ['박직원', '최직원', '함직원'],
    photos: [],
    status: '완료',
  },
  {
    id: 'mock-6',
    title: '화장실 청소 점검',
    detail: '화장실 청소 상태 확인 및 소모품 보충',
    deadline: '3월 19일 20:00까지',
    employees: ['정직원'],
    photos: [],
    status: '진행중',
  },
];

export const useTodoStore = create<TodoStore>()((set) => ({
  todos: mockTodos,
  addTodo: (todo) =>
    set((state) => ({
      todos: [
        ...state.todos,
        { ...todo, id: crypto.randomUUID(), status: '진행중' },
      ],
    })),
  updateTodo: (id, todo) =>
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...todo } : t)),
    })),
  updateTodosStatus: (ids, status) =>
    set((state) => ({
      todos: state.todos.map((t) =>
        ids.includes(t.id) ? { ...t, status } : t
      ),
    })),
  deleteTodos: (ids) =>
    set((state) => ({
      todos: state.todos.filter((t) => !ids.includes(t.id)),
    })),
}));
