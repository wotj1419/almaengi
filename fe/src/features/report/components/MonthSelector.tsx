import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
}

export default function MonthSelector({
  year,
  month,
  onPrev,
  onNext,
  disableNext = false,
}: MonthSelectorProps) {
  const formattedMonth = String(month).padStart(2, '0');

  return (
    <div className="flex justify-center pt-[var(--space-3)] pb-[var(--space-7)] bg-[var(--color-bg-white)]">
      <div className="flex items-center gap-[var(--gap-month-selector)] rounded-full bg-[var(--color-text-black)] py-[var(--space-1-5)] px-[var(--space-4)]">
        <button
          onClick={onPrev}
          aria-label="이전 달"
          className="flex items-center cursor-pointer"
        >
          <ChevronLeft
            size={16}
            color="var(--color-bg-white)"
            strokeWidth={2.5}
          />
        </button>

        <span className="text-[color:var(--color-bg-white)] text-[length:var(--text-md)] font-normal leading-5">
          {year}.{formattedMonth}
        </span>

        <button
          onClick={onNext}
          aria-label="다음 달"
          disabled={disableNext}
          className={`flex items-center ${disableNext ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ChevronRight
            size={16}
            color="var(--color-bg-white)"
            strokeWidth={2.5}
          />
        </button>
      </div>
    </div>
  );
}
