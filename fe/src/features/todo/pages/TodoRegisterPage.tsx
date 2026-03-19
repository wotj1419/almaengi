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

export default function TodoRegisterPage() {
  const navigate = useNavigate();
  const addTodo = useTodoStore((s) => s.addTodo);

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<{
    hour: number;
    minute: number;
  } | null>(null);

  const handleSubmit = () => {
    const deadline = (() => {
      if (!selectedDate) return '';
      const datePart = selectedDate.format('M월 D일');
      if (!selectedTime) return datePart;
      const timePart = `${String(selectedTime.hour).padStart(2, '0')}:${String(selectedTime.minute).padStart(2, '0')}`;
      return `${datePart} ${timePart}까지`;
    })();

    addTodo({ title, detail, deadline, employees: selectedEmployees, photos });
    navigate(ROUTES.TODO);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader title="할 일 등록" onBack={() => navigate(ROUTES.TODO)} />
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
        <PrimaryButton label="등록하기" onClick={handleSubmit} />
      </main>
      <BottomNav />
    </div>
  );
}
