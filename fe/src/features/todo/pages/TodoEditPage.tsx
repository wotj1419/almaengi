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

function parseDeadline(deadline: string): {
  date: Dayjs | null;
  time: { hour: number; minute: number } | null;
} {
  const match = deadline.match(/(\d+)월\s*(\d+)일(?:\s*(\d+):(\d+)까지)?/);
  if (!match) return { date: null, time: null };

  const month = parseInt(match[1]);
  const day = parseInt(match[2]);
  const date = dayjs()
    .month(month - 1)
    .date(day);

  if (!match[3]) return { date, time: null };

  return {
    date,
    time: { hour: parseInt(match[3]), minute: parseInt(match[4]) },
  };
}

export default function TodoEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const todos = useTodoStore((s) => s.todos);
  const updateTodo = useTodoStore((s) => s.updateTodo);
  const todo = todos.find((t) => t.id === id);

  const parsed = todo
    ? parseDeadline(todo.deadline)
    : { date: null, time: null };

  const [title, setTitle] = useState(todo?.title ?? '');
  const [detail, setDetail] = useState(todo?.detail ?? '');
  const [photos, setPhotos] = useState<string[]>(todo?.photos ?? []);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(
    todo?.employees ?? []
  );
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(parsed.date);
  const [selectedTime, setSelectedTime] = useState<{
    hour: number;
    minute: number;
  } | null>(parsed.time);

  if (!todo || !id) return null;

  const handleSubmit = () => {
    const deadline = (() => {
      if (!selectedDate) return '';
      const datePart = selectedDate.format('M월 D일');
      if (!selectedTime) return datePart;
      const timePart = `${String(selectedTime.hour).padStart(2, '0')}:${String(selectedTime.minute).padStart(2, '0')}`;
      return `${datePart} ${timePart}까지`;
    })();

    updateTodo(id, {
      title,
      detail,
      deadline,
      employees: selectedEmployees,
      photos,
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
            onTitleChange={setTitle}
            selectedEmployees={selectedEmployees}
            onEmployeesChange={setSelectedEmployees}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
          />
          <TodoDetailSection detail={detail} onDetailChange={setDetail} />
          <TodoPhotoSection photos={photos} onPhotosChange={setPhotos} />
        </div>
        <PrimaryButton label="수정하기" onClick={handleSubmit} />
      </main>
      <BottomNav />
    </div>
  );
}
