import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BottomSheet from '@/components/common/BottomSheet';

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onChange: (year: number, month: number) => void;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function MonthNavigator({
  year,
  month,
  onPrev,
  onNext,
  onChange,
}: Props) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const isNextDisabled = year === todayYear && month === todayMonth;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const handlePickerOpen = () => {
    setPickerYear(year);
    setPickerOpen(true);
  };

  const handleSelectMonth = (m: number) => {
    if (pickerYear > todayYear) return;
    if (pickerYear === todayYear && m > todayMonth) return;
    onChange(pickerYear, m);
    setPickerOpen(false);
  };

  const isMonthDisabled = (m: number) => {
    if (pickerYear > todayYear) return true;
    if (pickerYear === todayYear && m > todayMonth) return true;
    return false;
  };

  return (
    <>
      <div className="flex items-center w-full px-[var(--space-7)] py-[var(--space-4)]">
        <button onClick={onPrev} className="cursor-pointer pr-1 -ml-1">
          <ChevronLeft
            size={20}
            color="var(--color-text-primary)"
            strokeWidth={2.5}
          />
        </button>
        <button
          className="flex items-center gap-[var(--space-0-5)] cursor-pointer"
          onClick={handlePickerOpen}
        >
          <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]">
            {year}년 {month}월
          </span>
        </button>
        <button
          onClick={onNext}
          disabled={isNextDisabled}
          className={`p-1 ${isNextDisabled ? 'cursor-default opacity-30' : 'cursor-pointer'}`}
        >
          <ChevronRight
            size={20}
            color="var(--color-text-primary)"
            strokeWidth={2.5}
          />
        </button>
      </div>

      <BottomSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        header={
          <div className="flex items-center justify-between py-[var(--space-3)]">
            <button
              onClick={() => setPickerYear((y) => y - 1)}
              className="cursor-pointer p-1"
            >
              <ChevronLeft
                size={20}
                color="var(--color-text-primary)"
                strokeWidth={2.5}
              />
            </button>
            <span className="text-[length:var(--text-lg)] font-bold text-[color:var(--color-text-primary)]">
              {pickerYear}년
            </span>
            <button
              onClick={() => setPickerYear((y) => y + 1)}
              disabled={pickerYear >= todayYear}
              className={`p-1 ${pickerYear >= todayYear ? 'cursor-default opacity-30' : 'cursor-pointer'}`}
            >
              <ChevronRight
                size={20}
                color="var(--color-text-primary)"
                strokeWidth={2.5}
              />
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-[var(--space-3)] px-[var(--space-5)] py-[var(--space-4)]">
          {MONTHS.map((m) => {
            const disabled = isMonthDisabled(m);
            const isSelected = pickerYear === year && m === month;
            return (
              <button
                key={m}
                onClick={() => handleSelectMonth(m)}
                disabled={disabled}
                className={`
                  py-[var(--space-3)] rounded-[var(--radius-md)] text-[length:var(--text-md)] font-bold cursor-pointer
                  ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-[color:var(--color-text-primary)]'
                      : disabled
                        ? 'text-[color:var(--color-text-light)] cursor-default'
                        : 'text-[color:var(--color-text-primary)] hover:bg-[var(--color-bg-surface)]'
                  }
                `}
              >
                {m}월
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
