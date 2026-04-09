import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
  variant?: 'default' | 'darkCard';
}

export default function MonthSelector({
  year,
  month,
  onPrev,
  onNext,
  disableNext = false,
  variant = 'default',
}: MonthSelectorProps) {
  const formattedMonth = String(month).padStart(2, '0');
  const isDarkCard = variant === 'darkCard';

  const containerClassName = isDarkCard
    ? 'mb-[var(--space-5)] flex justify-center'
    : 'flex justify-center bg-[var(--color-bg-white)] pb-[var(--space-7)] pt-[var(--space-3)]';

  const monthControlClassName = isDarkCard
    ? 'mx-auto flex w-fit items-center gap-[var(--gap-month-selector)] rounded-full bg-white/10 px-[var(--space-4)] py-[var(--space-1-5)]'
    : 'flex items-center gap-[var(--gap-month-selector)] rounded-full bg-[var(--color-text-black)] px-[var(--space-4)] py-[var(--space-1-5)]';

  const buttonBaseClassName = isDarkCard
    ? 'flex items-center'
    : 'flex items-center';

  const iconClassName = isDarkCard
    ? 'text-[var(--color-text-light)]'
    : 'text-[var(--color-bg-white)]';

  const rightButtonClassName = `${buttonBaseClassName} ${
    disableNext ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
  }`;

  const monthTextClassName = isDarkCard
    ? 'text-[length:var(--text-md)] font-semibold leading-5 text-white'
    : 'text-[length:var(--text-md)] font-normal leading-5 text-[color:var(--color-bg-white)]';

  return (
    <div className={containerClassName}>
      <div className={monthControlClassName}>
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className={`${buttonBaseClassName} cursor-pointer`}
        >
          <ChevronLeft size={16} strokeWidth={2.5} className={iconClassName} />
        </button>

        <span className={monthTextClassName}>
          {year}.{formattedMonth}
        </span>

        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          disabled={disableNext}
          className={rightButtonClassName}
        >
          <ChevronRight size={16} strokeWidth={2.5} className={iconClassName} />
        </button>
      </div>
    </div>
  );
}
