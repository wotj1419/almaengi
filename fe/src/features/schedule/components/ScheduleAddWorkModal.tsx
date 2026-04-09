import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Dayjs } from 'dayjs';
import Avatar from 'boring-avatars';
import type { ScheduleStoreEmployee } from '@/features/schedule/types';

interface ScheduleAddWorkModalProps {
  isOpen: boolean;
  selectedDate: Dayjs;
  candidateEmployees: ScheduleStoreEmployee[];
  submissionError: string | null;
  onClearSubmissionError: () => void;
  onClose: () => void;
  onConfirm: (
    employee: ScheduleStoreEmployee,
    startTime: string,
    endTime: string
  ) => void;
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

// 근무 추가 모달 — 후보 직원 선택 + 출퇴근 시간 지정 후 추가
export default function ScheduleAddWorkModal({
  isOpen,
  selectedDate,
  candidateEmployees,
  submissionError,
  onClearSubmissionError,
  onClose,
  onConfirm,
}: ScheduleAddWorkModalProps) {
  // 첫 번째 후보 직원을 기본 선택, 해당 직원의 기본 출퇴근 시간을 초기값으로 사용
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    candidateEmployees[0]?.id ?? null
  );
  const [startTime, setStartTime] = useState(
    candidateEmployees[0]?.defaultStartTime ?? '09:00'
  );
  const [endTime, setEndTime] = useState(
    candidateEmployees[0]?.defaultEndTime ?? '18:00'
  );

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

  // 선택된 ID에 해당하는 직원 객체를 찾아서 반환
  const selectedEmployee = useMemo(
    () =>
      candidateEmployees.find(
        (employee) => employee.id === selectedEmployeeId
      ) ?? null,
    [candidateEmployees, selectedEmployeeId]
  );

  // 직원이 선택되어 있고, 퇴근 시간이 출근 시간보다 늦을 때만 제출 가능
  const canSubmit = !!selectedEmployee && startTime < endTime;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-[var(--space-5)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-label="근무 추가 닫기"
        onClick={onClose}
      />

      <div className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            근무 추가
          </h2>
          <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
            {selectedDate.format('MM/DD')} 일정에 직원을 추가하세요
          </p>
        </div>

        <div className={MODAL_BODY_CLASS}>
          {candidateEmployees.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-muted)] px-[var(--space-3)] py-[var(--space-4)] text-center text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
              추가 가능한 직원이 없습니다.
            </div>
          ) : (
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-xs)] font-medium text-[var(--color-text-sub)]">
                직원 선택
              </p>

              <div className="max-h-44 space-y-[var(--space-1)] overflow-y-auto pr-[var(--space-0-5)]">
                {candidateEmployees.map((employee) => {
                  const isSelected = employee.id === selectedEmployeeId;

                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => {
                        onClearSubmissionError(); // 이전 에러 초기화
                        setSelectedEmployeeId(employee.id); // 직원 선택
                        setStartTime(employee.defaultStartTime); // 해당 직원의 기본 출근 시간으로 세팅
                        setEndTime(employee.defaultEndTime); // 해당 직원의 기본 퇴근 시간으로 세팅
                      }}
                      className={`flex h-10 w-full items-center justify-between rounded-[var(--radius-lg)] border px-[var(--space-3)] text-left ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-status-green-bg)]'
                          : 'border-[var(--color-input-border)] bg-[var(--color-bg-white)]'
                      }`}
                    >
                      <div className="min-w-0 inline-flex flex-1 items-center gap-[var(--space-2)]">
                        <Avatar size={22} name={employee.name} variant="beam" />
                        <p className="truncate text-[length:var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
                          {employee.name}
                        </p>
                      </div>
                      <span
                        className={`h-5 w-5 rounded-full border ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                            : 'border-[var(--color-border-muted)] bg-[var(--color-bg-white)]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* 부모에서 전달된 유효성 에러 (예: 이미 배치된 직원 중복 시도) */}
              {submissionError && (
                <p className="text-[length:var(--text-xs)] text-[var(--color-danger)]">
                  {submissionError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-[var(--space-2)]">
                <label className="flex flex-col gap-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-sub)]">
                  출근 시간
                  <div className="relative">
                    <select
                      value={startTime}
                      onChange={(event) => {
                        onClearSubmissionError();
                        setStartTime(event.target.value);
                      }}
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
                      onChange={(event) => {
                        onClearSubmissionError();
                        setEndTime(event.target.value);
                      }}
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

              {/* 퇴근 시간 ≤ 출근 시간이면 경고 표시 */}
              {startTime >= endTime && (
                <p className="text-[length:var(--text-xs)] text-[var(--color-danger)]">
                  퇴근 시간은 출근 시간보다 늦어야 합니다.
                </p>
              )}
            </div>
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
            onClick={() => {
              if (!selectedEmployee) return;
              onConfirm(selectedEmployee, startTime, endTime);
            }}
            disabled={!canSubmit}
            className={MODAL_PRIMARY_BUTTON_CLASS}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
