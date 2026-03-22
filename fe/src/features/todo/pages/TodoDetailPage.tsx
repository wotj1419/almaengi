import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { MoreVertical, X, Check } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import EmployeeRow from '../components/EmployeeRow';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';
import TodoActionBar from '../components/TodoActionBar';
import { useTodoStore } from '@/stores/useTodoStore';
import { EMPLOYEES } from '@/features/todo/data/mockTodo';

export default function TodoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const todos = useTodoStore((s) => s.todos);
  const updateTodosStatus = useTodoStore((s) => s.updateTodosStatus);
  const deleteTodos = useTodoStore((s) => s.deleteTodos);
  const todo = todos.find((t) => t.task_id === Number(id));
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'complete' | 'delete' | null>(
    null
  );

  const handleMarkComplete = () => {
    if (!id || !todo) return;
    const prevStatus = todo.status;
    updateTodosStatus([Number(id)], '완료');
    navigate(`${ROUTES.TODO}?tab=${prevStatus}`);
  };

  const handleDelete = () => {
    if (!id || !todo) return;
    const prevStatus = todo.status;
    deleteTodos([Number(id)]);
    navigate(`${ROUTES.TODO}?tab=${prevStatus}`);
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (!todo) {
    return null;
  }

  const assignees = EMPLOYEES.filter((e) =>
    todo.assignee_employee_ids.includes(e.id)
  );
  const completedCount = assignees.filter((e) =>
    todo.completed_employee_ids.includes(e.id)
  ).length;
  const totalCount = assignees.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const isActive = todo.status !== '완료';
  const primaryLabel = isActive
    ? allCompleted
      ? '승인'
      : `완료(${completedCount}/${totalCount})`
    : undefined;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title="할 일 상세"
        onBack={() => navigate(`${ROUTES.TODO}?tab=${todo.status}`)}
      />
      <main className="flex flex-col gap-[var(--space-7)] px-[var(--space-5)] py-[var(--space-5)] pb-[var(--bottom-safe)]">
        <div className="relative flex flex-col gap-[var(--space-7)] p-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] shadow-[var(--shadow-form-card)] w-full">
          {todo.status !== '완료' && (
            <button
              onClick={() =>
                navigate(ROUTES.TODO_EDIT.replace(':id', id ?? ''))
              }
              className="absolute top-[var(--space-4)] right-[var(--space-4)] cursor-pointer"
            >
              <MoreVertical
                size={20}
                color="var(--color-text-sub)"
                strokeWidth={2}
              />
            </button>
          )}
          <div className="flex flex-col gap-[var(--space-2)]">
            <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
              상태
            </span>
            <StatusBadge status={todo.status} />
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
              할 일 제목
            </span>
            <span className="text-[length:var(--text-ml)] text-[color:var(--color-text-secondary)] font-medium leading-5">
              {todo.title}
            </span>
          </div>
          {todo.description && (
            <div className="flex flex-col gap-[var(--space-2)] mt-[var(--space-3)]">
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
                상세 내용
              </span>
              <span className="text-[length:var(--text-ml)] text-[color:var(--color-text-secondary)] font-medium leading-5 whitespace-pre-wrap break-all">
                {todo.description}
              </span>
            </div>
          )}
          {todo.images.length > 0 && (
            <div className="flex flex-col gap-[var(--space-2)]">
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
                참고 사진
              </span>
              <div
                ref={scrollRef}
                className="overflow-x-scroll scrollbar-hide w-full cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <div
                  className="flex gap-[var(--space-3)]"
                  style={{ width: 'max-content' }}
                >
                  {todo.images.map((img) => (
                    <img
                      key={img.image_id}
                      src={img.image_url}
                      alt={img.origin_name}
                      className="w-[var(--size-photo-preview-w)] h-[var(--size-photo-preview-h)] rounded-[var(--radius-sm)] object-cover cursor-pointer"
                      onClick={() => setSelectedPhoto(img.image_url)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          {todo.due_at && (
            <div className="flex flex-col gap-[var(--space-2)] mt-[var(--space-5)]">
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
                완료 기한
              </span>
              <span className="text-[length:var(--text-ml)] text-[color:var(--color-text-secondary)] font-medium leading-5">
                {dayjs(todo.due_at).format('YYYY년 M월 D일 HH:mm까지')}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-[var(--space-2)]">
            <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
              담당 직원
            </span>
            <div className="flex flex-col gap-[var(--space-3)]">
              {assignees.map((e) => {
                const isDone = todo.completed_employee_ids.includes(e.id);
                return (
                  <div key={e.id} className="flex items-center justify-between">
                    <EmployeeRow name={e.name} />
                    {isDone ? (
                      <div className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[var(--color-badge-green-bg)] flex-shrink-0">
                        <Check
                          size={11}
                          strokeWidth={3}
                          color="var(--color-status-badge-green-text)"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[var(--color-employee-incomplete-bg)] flex-shrink-0">
                        <X
                          size={11}
                          strokeWidth={2.5}
                          color="var(--color-employee-incomplete-text)"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <TodoActionBar
          secondaryLabel="삭제"
          onSecondary={() => setConfirmType('delete')}
          {...(isActive && {
            primaryLabel,
            onPrimary: () => setConfirmType('complete'),
            primaryDisabled: !allCompleted,
          })}
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
        title="승인 처리할까요?"
        confirmText="승인"
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
