import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Pencil, User, X } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';
import TodoActionBar from '../components/TodoActionBar';
import { useTodoStore } from '@/stores/useTodoStore';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  진행중: {
    bg: 'bg-[var(--color-badge-green-bg)]',
    text: 'text-[color:var(--color-status-badge-green-text)]',
  },
  완료: {
    bg: 'bg-[var(--color-badge-purple-bg)]',
    text: 'text-[color:var(--color-badge-purple-text)]',
  },
  미완료: {
    bg: 'bg-[var(--color-badge-orange-bg)]',
    text: 'text-[color:var(--color-badge-orange-text)]',
  },
};

export default function TodoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const todos = useTodoStore((s) => s.todos);
  const updateTodosStatus = useTodoStore((s) => s.updateTodosStatus);
  const deleteTodos = useTodoStore((s) => s.deleteTodos);
  const todo = todos.find((t) => t.id === id);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'complete' | 'delete' | null>(
    null
  );

  const handleMarkComplete = () => {
    if (!id) return;
    updateTodosStatus([id], '완료');
    navigate(ROUTES.TODO);
  };

  const handleDelete = () => {
    if (!id) return;
    deleteTodos([id]);
    navigate(ROUTES.TODO);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft += e.deltaY;
  };

  if (!todo) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader title="할 일 상세" onBack={() => navigate(ROUTES.TODO)} />
      <main className="flex flex-col gap-[var(--space-7)] px-[var(--space-5)] py-[var(--space-5)] pb-[var(--bottom-safe)]">
        <div className="relative flex flex-col gap-[var(--space-7)] p-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] shadow-[var(--shadow-form-card)] w-full">
          <button
            onClick={() => navigate(ROUTES.TODO_EDIT.replace(':id', id ?? ''))}
            className="absolute top-[var(--space-4)] right-[var(--space-4)] cursor-pointer"
          >
            <Pencil size={16} color="var(--color-text-sub)" strokeWidth={2} />
          </button>
          <div className="flex flex-col gap-[var(--space-2)]">
            <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
              상태
            </span>
            <div
              className={`flex py-[var(--space-1)] px-[var(--space-4)] items-center rounded-[var(--radius-sm)] w-fit ${STATUS_STYLES[todo.status].bg}`}
            >
              <span
                className={`text-[length:var(--text-xs)] font-bold leading-4 ${STATUS_STYLES[todo.status].text}`}
              >
                {todo.status}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
              할 일 제목
            </span>
            <span className="text-[length:var(--text-md)] text-[color:var(--color-text-secondary)] font-medium leading-5">
              {todo.title}
            </span>
          </div>
          {todo.deadline && (
            <div className="flex flex-col gap-[var(--space-2)]">
              <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
                완료 기한
              </span>
              <div className="flex items-center gap-[var(--space-3)]">
                <Calendar
                  size={15}
                  color="var(--color-text-sub)"
                  strokeWidth={1.5}
                />
                <span className="text-[length:var(--text-md)] text-[color:var(--color-text-sub)] font-medium leading-5">
                  {todo.deadline}
                </span>
              </div>
            </div>
          )}
          {todo.employees.length > 0 && (
            <div className="flex flex-col gap-[var(--space-2)]">
              <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
                담당 직원
              </span>
              <div className="flex items-center gap-[var(--space-3)]">
                <User
                  size={15}
                  color="var(--color-text-sub)"
                  strokeWidth={1.5}
                />
                <span className="text-[length:var(--text-md)] text-[color:var(--color-text-sub)] font-medium leading-5">
                  {todo.employees.join(', ')}
                </span>
              </div>
            </div>
          )}
          {todo.detail && (
            <div className="flex flex-col gap-[var(--space-2)]">
              <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
                상세 내용
              </span>
              <span className="text-[length:var(--text-md)] text-[color:var(--color-text-secondary)] font-medium leading-5 whitespace-pre-wrap break-all">
                {todo.detail}
              </span>
            </div>
          )}
          {todo.photos.length > 0 && (
            <div className="flex flex-col gap-[var(--space-2)]">
              <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
                참고 사진
              </span>
              <div
                ref={scrollRef}
                className="overflow-x-scroll w-full cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onWheel={handleWheel}
              >
                <div
                  className="flex gap-[var(--space-3)]"
                  style={{ width: 'max-content' }}
                >
                  {todo.photos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`첨부 사진 ${i + 1}`}
                      className="w-[var(--size-photo-preview-w)] h-[var(--size-photo-preview-h)] rounded-[var(--radius-sm)] object-cover cursor-pointer"
                      onClick={() => setSelectedPhoto(src)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <TodoActionBar
          secondaryLabel="삭제"
          primaryLabel="완료 처리"
          onSecondary={() => setConfirmType('delete')}
          onPrimary={() => setConfirmType('complete')}
          fixed={false}
        />
      </main>
      <BottomNav />

      <ConfirmModal
        isOpen={confirmType === 'delete'}
        title="할 일을 삭제할까요?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDelete}
        onClose={() => setConfirmType(null)}
      />
      <ConfirmModal
        isOpen={confirmType === 'complete'}
        title="완료 처리할까요?"
        confirmText="완료"
        cancelText="취소"
        onConfirm={handleMarkComplete}
        onClose={() => setConfirmType(null)}
      />

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay-dark)] flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-[var(--space-5)] right-[var(--space-5)] cursor-pointer"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={28} color="white" strokeWidth={2} />
          </button>
          <img
            src={selectedPhoto}
            alt="원본 사진"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
