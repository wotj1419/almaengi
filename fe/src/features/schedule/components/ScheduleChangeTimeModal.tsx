import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Dayjs } from 'dayjs';
import type { ScheduleEmployee } from '@/features/schedule/types';

interface ScheduleChangeTimeModalProps {
  isOpen: boolean;
  selectedDate: Dayjs;
  employee: ScheduleEmployee;
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string) => void;
}

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = (index % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
});

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
const MODAL_PRIMARY_BUTTON_CLASS =
  'h-11 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50';

// 근무시간 변경 모달 — 출퇴근 시간 드롭다운으로 변경, 퇴근 > 출근 유효성 검사
export default function ScheduleChangeTimeModal({
  isOpen,
  selectedDate,
  employee,
  onClose,
  onConfirm,
}: ScheduleChangeTimeModalProps) {
  const [startTime, setStartTime] = useState(employee.startTime); // 기존 출근 시간으로 초기화
  const [endTime, setEndTime] = useState(employee.endTime); // 기존 퇴근 시간으로 초기화

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

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-[var(--space-5)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-label="근무시간 변경 닫기"
        onClick={onClose}
      />

      <div className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            근무시간 변경
          </h2>
          <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
            {employee.name} · {selectedDate.format('MM/DD')} 일정
          </p>
        </div>

        <div className={MODAL_BODY_CLASS}>
          <div className="grid grid-cols-2 gap-[var(--space-2)]">
            <label className="flex flex-col gap-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-sub)]">
              출근 시간
              <div className="relative">
                <select
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="h-11 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] pr-[var(--space-8)] text-[length:var(--text-md)] font-semibold text-[var(--color-text-primary)] outline-none"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--color-text-placeholder)]"
                />
              </div>
            </label>

            <label className="flex flex-col gap-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-sub)]">
              퇴근 시간
              <div className="relative">
                <select
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="h-11 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] pr-[var(--space-8)] text-[length:var(--text-md)] font-semibold text-[var(--color-text-primary)] outline-none"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--color-text-placeholder)]"
                />
              </div>
            </label>
          </div>

          {/* 퇴근 시간 ≤ 출근 시간이면 경고 + 확인 버튼 비활성화 */}
          {startTime >= endTime && (
            <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-danger)]">
              퇴근 시간은 출근 시간보다 늦어야 합니다.
            </p>
          )}
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
            onClick={() => onConfirm(startTime, endTime)} // 변경된 시간을 부모에 전달
            disabled={startTime >= endTime} // 유효하지 않으면 비활성화
            className={MODAL_PRIMARY_BUTTON_CLASS}
          >
            변경하기
          </button>
        </div>
      </div>
    </div>
  );
}
