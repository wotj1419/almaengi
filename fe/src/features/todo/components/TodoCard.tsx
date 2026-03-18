import { useRef } from 'react';
import { Calendar, User, ChevronRight, Check } from 'lucide-react';
import type { Todo } from '@/stores/useTodoStore';

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

const CHECKBOX_STYLES: Record<
  string,
  { border: string; bg: string; check: string }
> = {
  진행중: {
    border: 'border-[var(--color-status-badge-green-text)]',
    bg: 'bg-[var(--color-badge-green-bg)]',
    check: 'var(--color-status-badge-green-text)',
  },
  완료: {
    border: 'border-[var(--color-badge-purple-text)]',
    bg: 'bg-[var(--color-badge-purple-bg)]',
    check: 'var(--color-badge-purple-text)',
  },
  미완료: {
    border: 'border-[var(--color-badge-orange-text)]',
    bg: 'bg-[var(--color-badge-orange-bg)]',
    check: 'var(--color-badge-orange-text)',
  },
};

type Props = {
  todo: Todo;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onTap?: () => void;
  onLongPress?: () => void;
};

export default function TodoCard({
  todo,
  isSelectionMode,
  isSelected,
  onTap,
  onLongPress,
}: Props) {
  const statusStyle = STATUS_STYLES[todo.status];
  const checkboxStyle = CHECKBOX_STYLES[todo.status];

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  const handlePressStart = () => {
    didLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      onLongPress?.();
    }, 500);
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (didLongPressRef.current) return;
    onTap?.();
  };

  return (
    <div
      className="flex items-center gap-[var(--space-4)]"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={handleClick}
    >
      {isSelectionMode && (
        <div
          className={`flex-shrink-0 w-[var(--size-checkbox)] h-[var(--size-checkbox)] rounded-full border flex items-center justify-center ${
            isSelected
              ? `${checkboxStyle.border} ${checkboxStyle.bg}`
              : 'border-[var(--color-text-sub)] bg-[var(--color-bg-white)]'
          }`}
        >
          {isSelected && (
            <Check size={9} strokeWidth={3} color={checkboxStyle.check} />
          )}
        </div>
      )}
      <div
        className={`flex justify-between items-start py-[var(--space-3)] px-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] flex-1 cursor-pointer transition-shadow ${
          isSelected
            ? 'shadow-[var(--shadow-card)] ring-1 ring-[var(--color-border-muted)]'
            : 'shadow-[var(--shadow-form-card)]'
        }`}
      >
        <div className="flex flex-col gap-[var(--space-2)] flex-1">
          <div
            className={`flex py-[var(--space-1)] px-[var(--space-4)] items-center rounded-[var(--radius-sm)] w-fit ${statusStyle.bg}`}
          >
            <span
              className={`text-[length:var(--text-xs)] font-bold leading-4 ${statusStyle.text}`}
            >
              {todo.status}
            </span>
          </div>
          <div className="flex items-start gap-[var(--space-3)]">
            {!isSelectionMode && todo.photos.length > 0 && (
              <img
                src={todo.photos[0]}
                alt="썸네일"
                className="w-[var(--size-photo-thumbnail)] h-[var(--size-photo-thumbnail)] rounded-[var(--radius-sm)] object-cover flex-shrink-0 mt-[var(--space-2)]"
              />
            )}
            <div className="flex flex-col gap-[var(--space-1)] flex-1">
              <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold leading-6">
                {todo.title}
              </span>
              {todo.deadline && (
                <div className="flex items-center gap-[var(--space-3)]">
                  <Calendar
                    size={15}
                    color="var(--color-text-sub)"
                    strokeWidth={1.5}
                  />
                  <span className="text-[length:var(--text-md)] text-[color:var(--color-text-sub)] font-medium leading-5">
                    기한: {todo.deadline}
                  </span>
                </div>
              )}
              {todo.employees.length > 0 && (
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
              )}
            </div>
          </div>
        </div>
        {!isSelectionMode && (
          <ChevronRight
            size={16}
            color="var(--color-text-light)"
            strokeWidth={2}
          />
        )}
      </div>
    </div>
  );
}
