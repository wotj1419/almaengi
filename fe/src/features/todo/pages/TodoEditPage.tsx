import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import PrimaryButton from '@/components/common/PrimaryButton';
import TodoInfoSection from '../components/TodoInfoSection';
import TodoDetailSection from '../components/TodoDetailSection';
import TodoPhotoSection from '../components/TodoPhotoSection';
import { useTodoStore } from '@/stores/useTodoStore';
import type { TaskImage } from '@/features/todo/types';

export default function TodoEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const todos = useTodoStore((s) => s.todos);
  const updateTodo = useTodoStore((s) => s.updateTodo);
  const todo = todos.find((t) => t.task_id === Number(id));

  const parsedDate = todo ? dayjs(todo.due_at) : null;
  const parsedTime = todo
    ? { hour: dayjs(todo.due_at).hour(), minute: dayjs(todo.due_at).minute() }
    : null;

  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [images, setImages] = useState<TaskImage[]>(todo?.images ?? []);
  const [assigneeEmployeeIds, setAssigneeEmployeeIds] = useState<number[]>(
    todo?.assignee_employee_ids ?? []
  );
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(parsedDate);
  const [selectedTime, setSelectedTime] = useState<{
    hour: number;
    minute: number;
  } | null>(parsedTime);
  const [errors, setErrors] = useState<{
    title?: string;
    assignee?: string;
    date?: string;
    description?: string;
  }>({});

  if (!todo || !id) return null;

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = '제목을 입력해 주세요.';
    if (assigneeEmployeeIds.length === 0)
      newErrors.assignee = '담당 직원을 선택해 주세요.';
    if (!selectedDate || !selectedTime)
      newErrors.date = '완료 기한의 날짜와 시간을 모두 선택해 주세요.';
    if (!description.trim())
      newErrors.description = '상세 내용을 입력해 주세요.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const due_at = (() => {
      if (!selectedDate) return '';
      const base = selectedDate.startOf('day');
      if (!selectedTime) return base.toISOString();
      return base
        .hour(selectedTime.hour)
        .minute(selectedTime.minute)
        .second(0)
        .toISOString();
    })();

    updateTodo(Number(id), {
      title,
      description,
      due_at,
      assignee_employee_ids: assigneeEmployeeIds,
      images,
    });
    navigate(ROUTES.TODO_DETAIL.replace(':id', id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title="할 일 수정"
        onBack={() => navigate(ROUTES.TODO_DETAIL.replace(':id', id))}
      />
      <main className="flex flex-col gap-[var(--space-7)] px-[var(--space-5)] py-[var(--space-5)] pb-[var(--bottom-safe)]">
        <div className="flex flex-col gap-[var(--space-7)] p-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] shadow-[var(--shadow-form-card)] w-full">
          <TodoInfoSection
            title={title}
            onTitleChange={(v) => {
              setTitle(v);
              setErrors((e) => ({ ...e, title: undefined }));
            }}
            assigneeEmployeeIds={assigneeEmployeeIds}
            onAssigneeChange={(ids) => {
              setAssigneeEmployeeIds(ids);
              setErrors((e) => ({ ...e, assignee: undefined }));
            }}
            selectedDate={selectedDate}
            onDateChange={(v) => {
              setSelectedDate(v);
              setErrors((e) => ({ ...e, date: undefined }));
            }}
            selectedTime={selectedTime}
            onTimeChange={(v) => {
              setSelectedTime(v);
              setErrors((e) => ({ ...e, date: undefined }));
            }}
            titleError={errors.title}
            assigneeError={errors.assignee}
            dateError={errors.date}
          />
          <TodoDetailSection
            detail={description}
            onDetailChange={(v) => {
              setDescription(v);
              setErrors((e) => ({ ...e, description: undefined }));
            }}
            error={errors.description}
          />
          <TodoPhotoSection images={images} onImagesChange={setImages} />
        </div>
        <PrimaryButton label="수정하기" onClick={handleSubmit} />
      </main>
      <BottomNav />
    </div>
  );
}
