import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  BadgeCheck,
} from 'lucide-react';
import type { Todo } from '@/features/todo/types';
import { EMPLOYEES } from '@/features/todo/data/mockTodo';
import StatusBadge from './StatusBadge';
import EmployeeRow from './EmployeeRow';

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
  const checkboxStyle = CHECKBOX_STYLES[todo.status];
  const thumbnail = todo.images[0]?.image_url;

  const [isAssigneeExpanded, setIsAssigneeExpanded] = useState(true);

  const assignees = EMPLOYEES.filter((e) =>
    todo.assignee_employee_ids.includes(e.id)
  );
  const firstAssignee = assignees[0];
  const extraCount = assignees.length - 1;

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
        className={`flex flex-col py-[var(--space-3)] px-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] flex-1 cursor-pointer transition-shadow ${
          isSelected
            ? 'shadow-[var(--shadow-card)] ring-1 ring-[var(--color-border-muted)]'
            : 'shadow-[var(--shadow-form-card)]'
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-[var(--space-2)] flex-1">
            <div className="flex items-center gap-[var(--space-2)] flex-wrap">
              <StatusBadge status={todo.status} />
              {(todo.status === '진행중' || todo.status === '미완료') &&
                todo.assignee_employee_ids.length > 0 &&
                todo.assignee_employee_ids.every((id) =>
                  todo.completed_employee_ids.includes(id)
                ) && (
                  <span className="flex items-center gap-[var(--space-1)] px-[var(--space-3)] py-[var(--space-1)] rounded-full w-fit bg-[var(--color-badge-approvable-bg)]">
                    <BadgeCheck
                      size={12}
                      className="text-[color:var(--color-badge-approvable-text)]"
                    />
                    <span className="text-[length:var(--text-xs)] font-bold text-[color:var(--color-badge-approvable-text)]">
                      승인 가능
                    </span>
                  </span>
                )}
            </div>
            <div className="flex items-start gap-[var(--space-3)]">
              {!isSelectionMode && thumbnail && (
                <img
                  src={thumbnail}
                  alt="썸네일"
                  className="w-[var(--size-photo-thumbnail)] h-[var(--size-photo-thumbnail)] rounded-[var(--radius-sm)] object-cover flex-shrink-0 mt-[var(--space-2)]"
                />
              )}
              <div className="flex flex-col gap-[var(--space-1)] flex-1">
                <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
                  {todo.title}
                </span>
                {todo.due_at && (
                  <div className="flex items-center gap-[var(--space-3)]">
                    <span className="text-[length:var(--text-ml)] text-[color:var(--color-text-secondary)] font-medium leading-5">
                      {dayjs(todo.due_at).format('M월 D일 HH:mm까지')}
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
        {firstAssignee && (
          <div
            className="w-full rounded-[var(--radius-sm)] bg-[var(--color-bg-card)] py-[var(--space-4)] px-[var(--space-4)] flex flex-col gap-[var(--space-3)] mt-[var(--space-6)]"
            onClick={(e) => {
              e.stopPropagation();
              if (extraCount > 0) {
                setIsAssigneeExpanded((prev) => !prev);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[var(--space-2)]">
                <EmployeeRow name={firstAssignee.name} />
              </div>
              {extraCount > 0 && (
                <div className="flex items-center gap-[var(--space-1)]">
                  <span className="text-[length:var(--text-md)] text-[color:var(--color-text-sub)] font-medium leading-5">
                    외 {extraCount}명
                  </span>
                  <span className="text-[color:var(--color-text-sub)]">
                    {isAssigneeExpanded ? (
                      <ChevronUp size={15} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={15} strokeWidth={2} />
                    )}
                  </span>
                </div>
              )}
            </div>
            {isAssigneeExpanded && extraCount > 0 && (
              <div className="flex flex-col gap-[var(--space-3)]">
                {assignees.slice(1).map((e) => (
                  <EmployeeRow key={e.id} name={e.name} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
