import { create } from 'zustand';
import { mockTodos } from '@/features/todo/data/mockTodo';
import type { Todo, TodoStatus, TaskImage } from '@/features/todo/types';

type TodoStore = {
  todos: Todo[];
  addTodo: (
    todo: Omit<
      Todo,
      | 'task_id'
      | 'status'
      | 'completed_at'
      | 'created_at'
      | 'updated_at'
      | 'completed_employee_ids'
    >
  ) => void;
  updateTodo: (
    task_id: number,
    todo: Pick<
      Todo,
      'title' | 'description' | 'due_at' | 'assignee_employee_ids' | 'images'
    >
  ) => void;
  updateTodosStatus: (ids: number[], status: TodoStatus) => void;
  deleteTodos: (ids: number[]) => void;
};

export const useTodoStore = create<TodoStore>()((set) => ({
  todos: mockTodos,
  addTodo: (todo) =>
    set((state) => ({
      todos: [
        ...state.todos,
        {
          ...todo,
          task_id: Date.now(),
          status: '진행중',
          completed_at: null,
          completed_employee_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    })),
  updateTodo: (task_id, todo) =>
    set((state) => ({
      todos: state.todos.map((t) => {
        if (t.task_id !== task_id) return t;
        const status: TodoStatus =
          new Date(todo.due_at) > new Date() ? '진행중' : '미완료';
        return { ...t, ...todo, status, updated_at: new Date().toISOString() };
      }),
    })),
  updateTodosStatus: (ids, status) =>
    set((state) => ({
      todos: state.todos.map((t) =>
        ids.includes(t.task_id)
          ? {
              ...t,
              status,
              completed_at:
                status === '완료' ? new Date().toISOString() : t.completed_at,
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    })),
  deleteTodos: (ids) =>
    set((state) => ({
      todos: state.todos.filter((t) => !ids.includes(t.task_id)),
    })),
}));

export type { TaskImage };
