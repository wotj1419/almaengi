import { useEffect, useMemo, useState } from 'react';
import type { Dayjs } from 'dayjs';
import Avatar from 'boring-avatars';
import type {
  ScheduleEmployee,
  ScheduleStoreEmployee,
} from '@/features/schedule/types';

interface ScheduleChangeEmployeeModalProps {
  isOpen: boolean;
  selectedDate: Dayjs;
  employee: ScheduleEmployee;
  busyEmployeeNames: string[];
  storeEmployees: ScheduleStoreEmployee[];
  onClose: () => void;
  onConfirm: (candidate: ScheduleEmployee) => void;
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
const MODAL_PRIMARY_BUTTON_CLASS =
  'h-11 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50';

// 직원 교체 모달 — 해당 날짜에 근무가 없는 다른 직원으로 교체
export default function ScheduleChangeEmployeeModal({
  isOpen,
  selectedDate,
  employee,
  busyEmployeeNames,
  storeEmployees,
  onClose,
  onConfirm,
}: ScheduleChangeEmployeeModalProps) {
  // 이미 해당 날짜에 배치된 직원은 후보에서 제외한다.
  const candidates = useMemo(() => {
    const busySet = new Set(busyEmployeeNames);

    return storeEmployees
      .filter((storeEmployee) => !busySet.has(storeEmployee.name))
      .map((storeEmployee) => ({
        id: storeEmployee.id,
        employeeId: storeEmployee.id,
        name: storeEmployee.name,
        status: storeEmployee.status,
        startTime: storeEmployee.defaultStartTime,
        endTime: storeEmployee.defaultEndTime,
      }));
  }, [busyEmployeeNames, storeEmployees]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(
    candidates[0]?.id ?? null
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

  // 라디오 선택된 후보 직원 객체
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-[var(--space-5)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-label="직원 변경 닫기"
        onClick={onClose}
      />

      <div className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            다른 직원으로 변경
          </h2>
          <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
            {selectedDate.format('MM/DD')} 기준 대체 직원을 선택하세요
          </p>
        </div>

        <div className={MODAL_BODY_CLASS}>
          <div className="mb-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-base)] px-[var(--space-3)] py-[var(--space-3)]">
            <p className="text-[length:var(--text-xs)] font-medium text-[var(--color-text-sub)]">
              교체 대상
            </p>
            <p className="mt-[var(--space-0-5)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)]">
              {employee.name} · {employee.startTime} ~ {employee.endTime}
            </p>
          </div>

          {candidates.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-muted)] px-[var(--space-3)] py-[var(--space-4)] text-center text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
              해당 날짜에 근무가 없는 직원이 없습니다.
            </div>
          ) : (
            <div className="max-h-48 space-y-[var(--space-1)] overflow-y-auto pr-[var(--space-0-5)]">
              {candidates.map((candidate) => {
                const isSelected = selectedCandidateId === candidate.id;

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className={`flex h-10 w-full items-center justify-between rounded-[var(--radius-lg)] border px-[var(--space-3)] text-left ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-status-green-bg)]'
                        : 'border-[var(--color-input-border)] bg-[var(--color-bg-white)]'
                    }`}
                  >
                    <div className="min-w-0 inline-flex flex-1 items-center gap-[var(--space-2)]">
                      <Avatar size={22} name={candidate.name} variant="beam" />
                      <p className="truncate text-[length:var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
                        {candidate.name}
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
              if (!selectedCandidate) return;
              onConfirm(selectedCandidate);
            }}
            disabled={!selectedCandidate}
            className={MODAL_PRIMARY_BUTTON_CLASS}
          >
            변경하기
          </button>
        </div>
      </div>
    </div>
  );
}
