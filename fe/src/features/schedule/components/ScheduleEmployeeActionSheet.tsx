import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { Dayjs } from 'dayjs';
import { Calendar, RefreshCw, Trash2, X } from 'lucide-react';
import {
  STATUS_META,
  WEEKDAY_LABELS,
} from '@/features/schedule/data/mockSchedule';
import type {
  ScheduleActionType,
  ScheduleEmployee,
} from '@/features/schedule/types';

interface ScheduleEmployeeActionSheetProps {
  isOpen: boolean;
  selectedDate: Dayjs;
  employee: ScheduleEmployee | null;
  onClose: () => void;
  onAction: (action: ScheduleActionType) => void;
}

interface ActionItem {
  type: ScheduleActionType;
  label: string;
  icon: ReactNode;
  iconBgClassName: string;
}

const ACTION_ITEMS: ActionItem[] = [
  {
    type: 'CHANGE_TIME',
    label: '근무시간 변경',
    icon: <Calendar size={20} color="var(--color-action-schedule)" />,
    iconBgClassName: 'bg-[var(--color-action-schedule-text)]',
  },
  {
    type: 'CHANGE_EMPLOYEE',
    label: '다른 직원으로 변경',
    icon: <RefreshCw size={20} color="var(--color-status-orange-dot)" />,
    iconBgClassName: 'bg-[var(--color-status-orange-bg)]',
  },
  {
    type: 'DELETE',
    label: '근무 일정 삭제',
    icon: <Trash2 size={20} color="var(--color-employee-incomplete-text)" />,
    iconBgClassName: 'bg-[var(--color-employee-incomplete-bg)]',
  },
];

const DRAG_CLOSE_THRESHOLD = 80;
const RETURN_ANIMATION_MS = 220;

export default function ScheduleEmployeeActionSheet({
  isOpen,
  selectedDate,
  employee,
  onClose,
  onAction,
}: ScheduleEmployeeActionSheetProps) {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const dragStartYRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const returnTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscClose);

    return () => {
      window.removeEventListener('keydown', handleEscClose);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (returnTimerRef.current) {
        window.clearTimeout(returnTimerRef.current);
      }
    };
  }, []);

  const resetDragState = () => {
    setDragOffsetY(0);
    setIsDragging(false);
    setIsReturning(false);
    dragStartYRef.current = null;
    activePointerIdRef.current = null;

    if (returnTimerRef.current) {
      window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
  };

  const requestClose = () => {
    resetDragState();
    onClose();
  };

  const beginReturnAnimation = () => {
    setIsDragging(false);
    setIsReturning(true);
    setDragOffsetY(0);
    dragStartYRef.current = null;
    activePointerIdRef.current = null;

    if (returnTimerRef.current) {
      window.clearTimeout(returnTimerRef.current);
    }

    returnTimerRef.current = window.setTimeout(() => {
      setIsReturning(false);
      returnTimerRef.current = null;
    }, RETURN_ANIMATION_MS);
  };

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    activePointerIdRef.current = event.pointerId;
    setIsReturning(false);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (activePointerIdRef.current !== event.pointerId) return;
    if (dragStartYRef.current === null) return;

    const deltaY = event.clientY - dragStartYRef.current;
    setDragOffsetY(Math.max(0, deltaY));
  };

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (dragOffsetY >= DRAG_CLOSE_THRESHOLD) {
      requestClose();
      return;
    }

    beginReturnAnimation();
  };

  const shouldApplyDragTransform = isDragging || dragOffsetY > 0 || isReturning;

  if (!isOpen || !employee) return null;

  const weekdayLabel = WEEKDAY_LABELS[selectedDate.day()];
  const statusMeta = STATUS_META[employee.status];

  return (
    <div className="fixed inset-0 z-[var(--z-bottom-sheet)]">
      <div className="absolute inset-0 bg-black/40" onClick={requestClose} />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[50vh] w-full max-w-[600px] flex-col rounded-t-[var(--radius-xl)] bg-white animate-slide-up"
        style={
          shouldApplyDragTransform
            ? {
                transform: `translateY(${dragOffsetY}px)`,
                transition: isDragging ? 'none' : 'transform 220ms ease-out',
              }
            : undefined
        }
      >
        <div
          className="shrink-0 cursor-grab touch-none pb-[var(--space-2)] pt-[var(--space-4)] active:cursor-grabbing"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <div className="mx-auto h-[4px] w-[40px] rounded-full bg-[var(--color-border-muted)]" />
        </div>

        <div className="shrink-0 px-[var(--space-7)]">
          <div className="mb-[var(--space-5)] flex items-start justify-between">
            <div className="inline-flex min-w-0 items-center gap-[var(--space-3)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg-surface)]">
                <span
                  className="text-[length:var(--text-md2)] font-bold"
                  style={{ color: statusMeta.barColor }}
                >
                  {employee.name[0]}
                </span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
                  {employee.name}
                </p>
                <p className="mt-[var(--space-0-5)] text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)]">
                  {selectedDate.format('MM/DD')}({weekdayLabel}){' '}
                  {employee.startTime}~{employee.endTime}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={requestClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full"
              aria-label="닫기"
            >
              <X size={18} color="var(--color-text-secondary)" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
          <div className="px-[var(--space-7)] pb-[calc(var(--space-7)+env(safe-area-inset-bottom,0px))]">
            <div className="space-y-[var(--space-3)]">
              {ACTION_ITEMS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onAction(item.type)}
                  className="flex w-full items-center gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] px-[var(--space-5)] py-[var(--space-5)] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]"
                >
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] ${item.iconBgClassName}`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-secondary)]">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
