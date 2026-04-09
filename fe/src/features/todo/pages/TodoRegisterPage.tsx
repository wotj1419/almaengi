import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Dayjs } from 'dayjs';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import PrimaryButton from '@/components/common/PrimaryButton';
import TodoInfoSection from '../components/TodoInfoSection';
import TodoDetailSection from '../components/TodoDetailSection';
import TodoPhotoSection from '../components/TodoPhotoSection';
import { useTodoStore } from '@/stores/useTodoStore';
import type { TaskImage } from '@/features/todo/types';

export default function TodoRegisterPage() {
  const navigate = useNavigate();
  const addTodo = useTodoStore((s) => s.addTodo);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<TaskImage[]>([]);
  const [assigneeEmployeeIds, setAssigneeEmployeeIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<{
    hour: number;
    minute: number;
  } | null>(null);
  const [errors, setErrors] = useState<{
    title?: string;
    assignee?: string;
    date?: string;
    description?: string;
  }>({});

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

    addTodo({
      store_id: 1,
      assignee_employee_ids: assigneeEmployeeIds,
      creator_user_id: 1,
      title,
      description,
      due_at,
      images,
    });
    navigate(ROUTES.TODO);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader title="할 일 등록" onBack={() => navigate(ROUTES.TODO)} />
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
        <PrimaryButton label="등록하기" onClick={handleSubmit} />
      </main>
      <BottomNav />
    </div>
  );
}
