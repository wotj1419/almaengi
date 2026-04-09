import { useMemo, useState } from 'react';
import { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeeRangeDateModalProps {
  isOpen: boolean;
  startDate: Dayjs;
  endDate: Dayjs;
  onConfirm: (startDate: Dayjs, endDate: Dayjs) => void;
  onClose: () => void;
  minDate?: Dayjs;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 날짜 범위 선택 모달 - 캘린더 UI에서 시작일/종료일을 선택하여 근태 통계 기간을 지정
export default function EmployeeRangeDateModal({
  isOpen,
  startDate,
  endDate,
  onConfirm,
  onClose,
  minDate,
}: EmployeeRangeDateModalProps) {
  // 현재 표시 중인 월 (이전/다음 월 이동용)
  const [currentMonth, setCurrentMonth] = useState(startDate.startOf('month'));
  // 사용자가 선택한 시작일/종료일 (첫 클릭=시작, 두 번째 클릭=종료)
  const [rangeStart, setRangeStart] = useState<Dayjs | null>(
    startDate.startOf('day')
  );
  const [rangeEnd, setRangeEnd] = useState<Dayjs | null>(
    endDate.startOf('day')
  );

  const minDay = minDate?.startOf('day');

  // minDate 이전 월로 이동 불가
  const canGoPrev = useMemo(() => {
    if (!minDay) return true;
    return currentMonth.startOf('month').isAfter(minDay.startOf('month'));
  }, [currentMonth, minDay]);

  // 5주(35칸) 그리드용 날짜 배열 생성 - 해당 월 시작 요일에 맞춰 이전 달 날짜도 포함
  const allDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const firstGridDate = startOfMonth.subtract(startOfMonth.day(), 'day');

    return Array.from({ length: 35 }, (_, index) => {
      const date = firstGridDate.add(index, 'day').startOf('day');
      return {
        date,
        day: date.date(),
        isCurrentMonth: date.month() === currentMonth.month(),
      };
    });
  }, [currentMonth]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  };

  // 날짜 클릭 핸들러: 시작일 미선택 또는 범위 완성 후 클릭 → 새 시작일 / 시작일보다 이전 클릭 → 시작일 교체 / 이후 클릭 → 종료일 설정
  const handleDateClick = (clickedDate: Dayjs, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    if (minDay && clickedDate.isBefore(minDay, 'day')) return;

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clickedDate);
      setRangeEnd(null);
      return;
    }

    if (clickedDate.isBefore(rangeStart, 'day')) {
      setRangeStart(clickedDate);
      return;
    }

    setRangeEnd(clickedDate);
  };

  const isRangeReady = !!rangeStart && !!rangeEnd;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative mx-4 inline-flex w-full max-w-80 flex-col items-center gap-3.5 overflow-hidden rounded-[var(--radius-lg)] bg-white pt-3.5">
        <div className="self-stretch px-7 inline-flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-1"
            disabled={!canGoPrev}
          >
            <ChevronLeft
              className={`h-6 w-6 ${canGoPrev ? 'text-gray-400' : 'text-gray-200'}`}
              strokeWidth={2}
            />
          </button>
          <span className="text-lg font-bold leading-7 text-gray-900">
            {currentMonth.year()}년 {currentMonth.month() + 1}월
          </span>
          <button onClick={handleNextMonth} className="p-1">
            <ChevronRight className="h-6 w-6 text-gray-400" strokeWidth={2} />
          </button>
        </div>

        <div className="self-stretch px-4 text-center text-[length:var(--text-xs)] font-medium text-[var(--color-text-muted)]">
          {rangeStart
            ? rangeEnd
              ? `${rangeStart.format('YYYY.MM.DD')} ~ ${rangeEnd.format('YYYY.MM.DD')}`
              : `${rangeStart.format('YYYY.MM.DD')} 시작일 선택됨`
            : '시작일을 선택하세요'}
        </div>

        <div className="self-stretch grid grid-cols-7 place-items-center px-3.5">
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

        <div className="self-stretch grid grid-cols-7 place-items-center gap-y-1 px-3.5">
          {allDays.map((cell, idx) => {
            const isPast =
              cell.isCurrentMonth &&
              !!minDay &&
              cell.date.isBefore(minDay, 'day');
            const disabled = !cell.isCurrentMonth || isPast;
            const isSunday = idx % 7 === 0;
            const isWeekStart = idx % 7 === 0;
            const isWeekEnd = idx % 7 === 6;
            const isStart =
              cell.isCurrentMonth &&
              !!rangeStart &&
              cell.date.isSame(rangeStart, 'day');
            const isEnd =
              cell.isCurrentMonth &&
              !!rangeEnd &&
              cell.date.isSame(rangeEnd, 'day');
            const isInRange =
              cell.isCurrentMonth &&
              !!rangeStart &&
              !!rangeEnd &&
              cell.date.isAfter(rangeStart, 'day') &&
              cell.date.isBefore(rangeEnd, 'day');

            const showLeftTrack =
              !isWeekStart &&
              !!rangeStart &&
              !!rangeEnd &&
              cell.isCurrentMonth &&
              isEnd &&
              !isStart;
            const showRightTrack =
              !isWeekEnd &&
              !!rangeStart &&
              !!rangeEnd &&
              cell.isCurrentMonth &&
              isStart &&
              !isEnd;
            const showFullTrack =
              !!rangeStart && !!rangeEnd && cell.isCurrentMonth && isInRange;

            return (
              <div
                key={cell.date.format('YYYY-MM-DD')}
                className="relative flex h-9 w-full items-center justify-center"
              >
                {(showFullTrack || showLeftTrack || showRightTrack) && (
                  <>
                    {showFullTrack && (
                      <span className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 bg-[var(--color-badge-green-bg)]" />
                    )}
                    {showLeftTrack && (
                      <span className="absolute left-0 top-1/2 h-8 w-1/2 -translate-y-1/2 bg-[var(--color-badge-green-bg)]" />
                    )}
                    {showRightTrack && (
                      <span className="absolute right-0 top-1/2 h-8 w-1/2 -translate-y-1/2 bg-[var(--color-badge-green-bg)]" />
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleDateClick(cell.date, cell.isCurrentMonth)
                  }
                  disabled={disabled}
                  className={`relative z-10 h-9 w-9 text-base leading-6 ${
                    isInRange ? 'rounded-none' : 'rounded-full'
                  } ${
                    isStart || isEnd
                      ? 'bg-[var(--color-action-todo)] font-bold text-black'
                      : isInRange
                        ? 'bg-transparent font-medium text-[var(--color-text-primary)]'
                        : disabled
                          ? 'font-normal text-gray-200'
                          : isSunday
                            ? 'font-normal text-red-400'
                            : 'font-normal text-gray-800'
                  }`}
                >
                  {cell.day}
                </button>
              </div>
            );
          })}
        </div>

        <div className="self-stretch inline-flex items-center justify-center gap-2 bg-[var(--color-bg-base)] px-4 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[var(--radius-lg)] bg-white px-5 py-2.5 text-lg font-medium leading-5 text-slate-500"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() =>
              rangeStart &&
              rangeEnd &&
              onConfirm(rangeStart.startOf('day'), rangeEnd.startOf('day'))
            }
            disabled={!isRangeReady}
            className={`flex-1 rounded-[var(--radius-lg)] px-6 py-2.5 text-lg font-bold leading-5 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)] ${
              isRangeReady
                ? 'bg-[var(--color-action-todo)] text-slate-900'
                : 'bg-[var(--color-bg-surface)] text-[var(--color-text-placeholder)]'
            }`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
