import { useEffect } from 'react';
import type { Dayjs } from 'dayjs';
import { WEEKDAY_LABELS } from '@/features/schedule/data/mockSchedule';
import type { ScheduleEmployee } from '@/features/schedule/types';

interface ScheduleDeleteConfirmModalProps {
  isOpen: boolean;
  selectedDate: Dayjs;
  employee: ScheduleEmployee | null;
  onClose: () => void;
  onConfirm: () => void;
}

const MODAL_PANEL_CLASS =
  'relative w-full max-w-80 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-white)] shadow-[var(--shadow-alert)]';
const MODAL_HEADER_CLASS =
  'px-[var(--space-7)] pt-[18px] pb-[var(--space-4)] text-center';
const MODAL_BODY_CLASS =
  'bg-[var(--color-bg-white)] px-[var(--space-4)] pb-[var(--space-4)]';
const MODAL_FOOTER_CLASS =
  'flex gap-[var(--space-2)] bg-[var(--color-bg-base)] px-[var(--space-4)] py-[var(--space-4)]';
const MODAL_SECONDARY_BUTTON_CLASS =
  'h-11 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] text-[length:var(--text-md)] font-bold text-[var(--color-text-muted)]';

// 근무 삭제 확인 모달 — 삭제 대상 직원 정보를 보여주고 "삭제하기" 클릭 시 onConfirm 호출
export default function ScheduleDeleteConfirmModal({
  isOpen,
  selectedDate,
  employee,
  onClose,
  onConfirm,
}: ScheduleDeleteConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null; // 모달이 닫혀 있거나 대상 직원이 없으면 렌더링 X

  const weekdayLabel = WEEKDAY_LABELS[selectedDate.day()]; // 요일 라벨

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-[var(--space-5)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-label="삭제 확인 닫기"
        onClick={onClose}
      />

      <div className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            근무 일정 삭제
          </h2>
          <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
            아래 근무를 삭제하시겠어요?
          </p>
        </div>

        <div className={MODAL_BODY_CLASS}>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-base)] px-[var(--space-4)] py-[var(--space-4)]">
            <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
              {employee.name}
            </p>
            <p className="mt-[var(--space-1)] text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)]">
              {selectedDate.format('MM/DD')}({weekdayLabel}){' '}
              {employee.startTime} ~{employee.endTime}
            </p>
          </div>
        </div>

        <div className={MODAL_FOOTER_CLASS}>
          <button
            type="button"
            onClick={onClose}
            className={MODAL_SECONDARY_BUTTON_CLASS}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm} // 삭제 확정 → 부모(SchedulePage)에서 해당 근무 제거
            className="h-11 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-danger)] text-[length:var(--text-md)] font-bold text-[var(--color-bg-white)]"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
