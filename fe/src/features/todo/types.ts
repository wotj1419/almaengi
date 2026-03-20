export type TodoStatus = '진행중' | '완료' | '미완료';

export type TaskImage = {
  image_id: number;
  task_id: number;
  image_url: string;
  origin_name: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Todo = {
  task_id: number;
  store_id: number;
  assignee_employee_ids: number[];
  completed_employee_ids: number[];
  creator_user_id: number;
  title: string;
  description: string;
  due_at: string;
  status: TodoStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  images: TaskImage[];
};
