import { useState } from 'react';
import { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  selectedDate: Dayjs;
  onConfirm: (date: Dayjs) => void;
  onClose: () => void;
  minDate?: Dayjs;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function DatePickerModal({
  isOpen,
  selectedDate,
  onConfirm,
  onClose,
  minDate,
}: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [tempDate, setTempDate] = useState(selectedDate);

  if (!isOpen) return null;

  const minDay = minDate?.startOf('day');
  const canGoPrev =
    !minDay || currentMonth.startOf('month').isAfter(minDay.startOf('month'));

  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startDay = startOfMonth.day(); // 0=일요일
  const daysInMonth = endOfMonth.date();

  // 이전 달 날짜들
  const prevMonthEnd = startOfMonth.subtract(1, 'day');
  const prevDays: { day: number; current: boolean }[] = [];
  for (let i = startDay - 1; i >= 0; i--) {
    prevDays.push({ day: prevMonthEnd.date() - i, current: false });
  }

  // 현재 달 날짜들
  const currentDays: { day: number; current: boolean }[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentDays.push({ day: i, current: true });
  }

  // 다음 달 날짜들 (항상 6주 = 42셀 고정)
  const totalCells = prevDays.length + currentDays.length;
  const remainingCells = 42 - totalCells;
  const nextDays: { day: number; current: boolean }[] = [];
  for (let i = 1; i <= remainingCells; i++) {
    nextDays.push({ day: i, current: false });
  }

  const allDays = [...prevDays, ...currentDays, ...nextDays];
  const weeks: { day: number; current: boolean }[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const handleDateClick = (day: number, isCurrent: boolean) => {
    if (!isCurrent) return;
    const date = currentMonth.date(day);
    if (minDay && date.isBefore(minDay)) return;
    setTempDate(date);
  };

  const isSelected = (day: number, isCurrent: boolean) => {
    if (!isCurrent) return false;
    return (
      tempDate.year() === currentMonth.year() &&
      tempDate.month() === currentMonth.month() &&
      tempDate.date() === day
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-80 mx-4 bg-white rounded-[var(--radius-lg)] pt-3.5 overflow-hidden inline-flex flex-col justify-center items-center gap-3.5">
        {/* 헤더: 월 네비게이션 */}
        <div className="self-stretch px-7 inline-flex justify-between items-center">
          <button
            onClick={handlePrevMonth}
            className="p-1"
            disabled={!canGoPrev}
          >
            <ChevronLeft
              className={`w-6 h-6 ${canGoPrev ? 'text-gray-400' : 'text-gray-200'}`}
              strokeWidth={2}
            />
          </button>
          <span className="text-gray-900 text-lg font-bold leading-7">
            {currentMonth.year()}년 {currentMonth.month() + 1}월
          </span>
          <button onClick={handleNextMonth} className="p-1">
            <ChevronRight className="w-6 h-6 text-gray-400" strokeWidth={2} />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="self-stretch px-3.5 grid grid-cols-7 place-items-center">
          {WEEKDAYS.map((day, i) => (
            <span
              key={day}
              className={`text-center text-sm font-medium leading-5 ${
                i === 0 ? 'text-red-400' : 'text-gray-400'
              }`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="self-stretch px-3.5 grid grid-cols-7 place-items-center gap-y-1">
          {allDays.map((cell, idx) => {
            const selected = isSelected(cell.day, cell.current);
            const isSunday = idx % 7 === 0;
            const isPast =
              cell.current &&
              !!minDay &&
              currentMonth.date(cell.day).isBefore(minDay);
            const disabled = !cell.current || isPast;

            return (
              <button
                key={idx}
                onClick={() => handleDateClick(cell.day, cell.current)}
                className={`w-9 h-9 flex items-center justify-center rounded-full text-base leading-6 ${
                  selected
                    ? 'bg-[var(--color-action-todo)] text-black font-bold'
                    : disabled
                      ? 'text-gray-200 font-normal'
                      : isSunday
                        ? 'text-red-400 font-normal'
                        : 'text-gray-800 font-normal'
                }`}
                disabled={disabled}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="self-stretch px-4 py-3.5 bg-[var(--color-bg-base)] inline-flex justify-center items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-white rounded-[var(--radius-lg)] flex justify-center items-center"
          >
            <span className="text-slate-500 text-lg font-medium leading-5">
              취소
            </span>
          </button>
          <button
            onClick={() => onConfirm(tempDate)}
            className="flex-1 px-6 py-2.5 bg-[var(--color-action-todo)] rounded-[var(--radius-lg)] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)] flex justify-center items-center"
          >
            <span className="text-slate-900 text-lg font-bold leading-5">
              확인
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
