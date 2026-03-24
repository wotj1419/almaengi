import { ChevronDown } from 'lucide-react';
import { useEffect } from 'react';

interface YearPickerModalProps {
  isOpen: boolean;
  draftYear: number;
  yearOptions: number[];
  onChangeDraftYear: (year: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function YearPickerModal({
  isOpen,
  draftYear,
  yearOptions,
  onChangeDraftYear,
  onClose,
  onConfirm,
}: YearPickerModalProps) {
  useEffect(() => {
    if (!isOpen) return;

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-[var(--space-5)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-label="연도 선택 닫기"
        onClick={onClose}
      />

      <div className="relative w-full max-w-80 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-white)] shadow-[var(--shadow-alert)]">
        <div className="px-[var(--space-7)] pb-[var(--space-4)] pt-[18px] text-center">
          <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            연도 선택
          </h2>
          <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
            급여명세서를 확인할 연도를 선택해주세요.
          </p>
        </div>

        <div className="bg-[var(--color-bg-white)] px-[var(--space-4)] py-[var(--space-4)]">
          <label className="flex flex-col gap-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-sub)]">
            연도
            <div className="relative">
              <select
                value={draftYear}
                onChange={(event) =>
                  onChangeDraftYear(Number(event.target.value))
                }
                className="h-11 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] pr-[var(--space-8)] text-[length:var(--text-md)] font-medium text-[var(--color-text-primary)] outline-none"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-[var(--space-4)] top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
            </div>
          </label>
        </div>

        <div className="flex gap-[var(--space-2)] bg-[var(--color-bg-base)] px-[var(--space-4)] py-[var(--space-4)]">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] text-[length:var(--text-md)] font-bold text-[var(--color-text-muted)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
