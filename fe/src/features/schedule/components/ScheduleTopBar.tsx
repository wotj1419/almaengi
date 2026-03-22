import { ChevronDown } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import {
  buildMonthCells,
  buildWeekDates,
  hasAbsentOnDate,
  WEEKDAY_LABELS,
} from '@/features/schedule/data/mockSchedule';

// --- 레이아웃·드래그 상수 ---
const WEEK_PANEL_HEIGHT = 72; // 주간 달력 높이(px)
const MONTH_PANEL_HEIGHT = 320; // 월간 달력 높이(px)
const PANEL_DRAG_RANGE = MONTH_PANEL_HEIGHT - WEEK_PANEL_HEIGHT; // 드래그 가동 범위
const CALENDAR_HORIZONTAL_PADDING_CLASS = 'px-[var(--space-5)]';
const YEAR_PICKER_RANGE = 3; // 현재 연도 ± 3년까지 선택 가능
const MONTH_PICKER_MODAL_PANEL_CLASS =
  'relative w-full max-w-80 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-white)] shadow-[var(--shadow-alert)]';
const MONTH_PICKER_MODAL_HEADER_CLASS =
  'px-[var(--space-7)] pt-[18px] pb-[var(--space-4)] text-center';
const MONTH_PICKER_MODAL_BODY_CLASS =
  'bg-[var(--color-bg-white)] px-[var(--space-4)] py-[var(--space-4)]';
const MONTH_PICKER_MODAL_FOOTER_CLASS =
  'flex gap-[var(--space-2)] bg-[var(--color-bg-base)] px-[var(--space-4)] py-[var(--space-4)]';
const MONTH_PICKER_MODAL_SECONDARY_BUTTON_CLASS =
  'flex-1 h-11 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] text-[length:var(--text-md)] font-bold text-[var(--color-text-muted)]';
const MONTH_PICKER_MODAL_PRIMARY_BUTTON_CLASS =
  'flex-1 h-11 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)]';

interface ScheduleTopBarProps {
  selectedDate: Dayjs;
  isMonthExpanded: boolean;
  calendarDragOffsetY: number;
  isCalendarDragging: boolean;
  onSelectDate: (date: Dayjs) => void;
  onHandlePointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

interface MonthYearPickerModalProps {
  baseDate: Dayjs;
  onClose: () => void;
  onConfirm: (date: Dayjs) => void;
}

// 연/월 선택 모달 — 연도·월 드롭다운으로 원하는 연월을 선택하고 콜백으로 전달
function MonthYearPickerModal({
  baseDate,
  onClose,
  onConfirm,
}: MonthYearPickerModalProps) {
  const currentYear = dayjs().year();
  const minYear = currentYear - YEAR_PICKER_RANGE;
  const maxYear = currentYear + YEAR_PICKER_RANGE;

  const [tempYear, setTempYear] = useState(() =>
    Math.min(maxYear, Math.max(minYear, baseDate.year()))
  );
  const [tempMonth, setTempMonth] = useState(baseDate.month() + 1);

  const years = useMemo(
    () =>
      Array.from(
        { length: YEAR_PICKER_RANGE * 2 + 1 },
        (_, index) => minYear + index
      ),
    [minYear]
  );

  useEffect(() => {
    const handleEsc = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // 확인 — 선택 연월에 기존 일(day)을 맞추되, 해당 월의 마지막 일을 초과하지 않도록 보정
  const handleConfirm = () => {
    const nextMonthDate = baseDate.year(tempYear).month(tempMonth - 1);
    const safeDay = Math.min(baseDate.date(), nextMonthDate.daysInMonth());
    onConfirm(nextMonthDate.date(safeDay));
  };

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-[var(--space-5)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-label="Close month selector"
        onClick={onClose}
      />

      <div className={MONTH_PICKER_MODAL_PANEL_CLASS}>
        <div className={MONTH_PICKER_MODAL_HEADER_CLASS}>
          <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            연/월 변경
          </h2>
          <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
            원하는 연도와 월을 선택하세요
          </p>
        </div>

        <div className={MONTH_PICKER_MODAL_BODY_CLASS}>
          <div className="grid grid-cols-2 gap-[var(--space-2)]">
            <label className="flex flex-col gap-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-sub)]">
              연도
              <div className="relative">
                <select
                  value={tempYear}
                  onChange={(event) => setTempYear(Number(event.target.value))}
                  className="h-11 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] pr-[var(--space-8)] text-[length:var(--text-md)] font-medium text-[var(--color-text-primary)] outline-none"
                >
                  {years.map((year) => (
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

            <label className="flex flex-col gap-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-sub)]">
              월
              <div className="relative">
                <select
                  value={tempMonth}
                  onChange={(event) => setTempMonth(Number(event.target.value))}
                  className="h-11 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] pr-[var(--space-8)] text-[length:var(--text-md)] font-medium text-[var(--color-text-primary)] outline-none"
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (month) => (
                      <option key={month} value={month}>
                        {month}월
                      </option>
                    )
                  )}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-[var(--space-4)] top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
              </div>
            </label>
          </div>
        </div>

        <div className={MONTH_PICKER_MODAL_FOOTER_CLASS}>
          <button
            type="button"
            onClick={onClose}
            className={MONTH_PICKER_MODAL_SECONDARY_BUTTON_CLASS}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={MONTH_PICKER_MODAL_PRIMARY_BUTTON_CLASS}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// 달력의 개별 날짜 버튼 (선택: 원형 배경 / 결근: 빨간 점 / 일요일: 빨강, 토요일: 파랑)
function DateButton({
  date,
  selectedDate,
  inCurrentMonth,
  isDisabled,
  onSelectDate,
}: {
  date: Dayjs;
  selectedDate: Dayjs;
  inCurrentMonth: boolean;
  isDisabled: boolean;
  onSelectDate: (date: Dayjs) => void;
}) {
  const isSelected = date.isSame(selectedDate, 'day');
  const hasAbsent = hasAbsentOnDate(date);
  const isSunday = date.day() === 0;
  const isSaturday = date.day() === 6;

  let textClassName = 'text-[var(--color-text-primary)]';
  if (!inCurrentMonth) textClassName = 'text-[var(--color-border-muted)]';
  else if (isSunday) textClassName = 'text-[var(--color-danger)]';
  else if (isSaturday) textClassName = 'text-[var(--color-action-schedule)]';

  return (
    <button
      type="button"
      onClick={() => onSelectDate(date)}
      disabled={isDisabled}
      className="relative flex h-10 w-full items-center justify-center transition-colors duration-200 disabled:cursor-default disabled:opacity-100"
      aria-label={`${date.format('YYYY-MM-DD')} select date`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[length:var(--text-md2)] leading-6 ${
          isSelected
            ? 'bg-[var(--color-action-todo)] font-bold text-[var(--color-text-black)]'
            : `font-normal ${textClassName}`
        }`}
      >
        {date.date()}
      </span>
      {hasAbsent && !isSelected && inCurrentMonth && (
        <span className="absolute bottom-[var(--space-0-5)] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--color-danger)]" />
      )}
    </button>
  );
}

// 스케줄 상단 바 — 주간/월간 달력 레이어를 expansionProgress(0~1)로 교차 페이드
export default function ScheduleTopBar({
  selectedDate,
  isMonthExpanded,
  calendarDragOffsetY,
  isCalendarDragging,
  onSelectDate,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandlePointerCancel,
  onHandleKeyDown,
}: ScheduleTopBarProps) {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const weekDates = buildWeekDates(selectedDate);
  const monthCells = buildMonthCells(selectedDate);
  // 현재 패널 높이: 기본 높이 + 드래그 오프셋 (최소 주간, 최대 월간으로 클램프)
  const basePanelHeight = isMonthExpanded
    ? MONTH_PANEL_HEIGHT
    : WEEK_PANEL_HEIGHT;
  const currentPanelHeight = Math.max(
    WEEK_PANEL_HEIGHT,
    Math.min(MONTH_PANEL_HEIGHT, basePanelHeight + calendarDragOffsetY)
  );
  // 드래그 진행률 (0~1): 레이어 교차 페이드에 사용
  const dragProgress = Math.min(
    1,
    Math.abs(calendarDragOffsetY) / PANEL_DRAG_RANGE
  );
  // 드래그 중에는 손가락 위치를 우선하고, 정지 상태에서는 모드 상태를 그대로 사용한다.
  const expansionProgress = isCalendarDragging
    ? isMonthExpanded
      ? 1 - dragProgress
      : dragProgress
    : isMonthExpanded
      ? 1
      : 0;

  return (
    <>
      <section className="relative overflow-hidden rounded-b-[32px] bg-[var(--color-bg-white)] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.04)]">
        <div
          className="flex items-center justify-start pb-[var(--space-7)] px-[var(--space-5)]"
          style={{ paddingTop: 'calc(40px + env(safe-area-inset-top, 0px))' }}
        >
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(true)}
            className="inline-flex items-center gap-[var(--space-2)] rounded-full px-[var(--space-1)] py-[var(--space-1)]"
            aria-label="Select month"
          >
            <span className="font-['Noto_Sans_KR:Bold',sans-serif] text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)]">
              {selectedDate.format('YYYY년 M월')}
            </span>
            <ChevronDown size={18} color="var(--color-text-primary)" />
          </button>
        </div>

        {/* 요일 헤더 (일~토) — 일요일: 빨강, 토요일: 파랑, 나머지: 회색 */}
        <div
          className={`mt-[var(--space-2)] ${CALENDAR_HORIZONTAL_PADDING_CLASS}`}
        >
          <div className="grid grid-cols-7">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={label}
                className="flex h-10 w-full items-center justify-center"
              >
                <span
                  className={`text-center text-[length:var(--text-xs)] font-bold leading-5 ${
                    index === 0
                      ? 'text-[var(--color-danger)]'
                      : index === 6
                        ? 'text-[var(--color-action-schedule)]'
                        : 'text-[var(--color-text-placeholder)]'
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 주간/월간 달력 컨테이너 — 높이가 드래그에 따라 변함 */}
        <div
          className={`relative overflow-hidden transition-[height] ${
            isCalendarDragging ? '' : 'duration-300 ease-out'
          }`}
          style={{ height: `${currentPanelHeight}px` }}
        >
          <div
            // 주간 레이어는 월간 확장 시 포인터 이벤트를 완전히 차단해 오동작을 막는다.
            className={`absolute inset-0 transition-[opacity,transform] ${
              isCalendarDragging ? '' : 'duration-300 ease-out'
            } ${isMonthExpanded ? 'pointer-events-none' : 'pointer-events-auto'}`}
            style={{
              opacity: 1 - expansionProgress,
              transform: `translateY(${-8 * expansionProgress}px) scale(${
                1 - expansionProgress * 0.02
              })`,
            }}
            aria-hidden={expansionProgress > 0.5}
          >
            <div
              className={`mt-[var(--space-2)] ${CALENDAR_HORIZONTAL_PADDING_CLASS}`}
            >
              <div className="grid grid-cols-7 pb-[var(--space-2)]">
                {weekDates.map((date) => (
                  <DateButton
                    key={date.format('YYYY-MM-DD')}
                    date={date}
                    selectedDate={selectedDate}
                    inCurrentMonth={true}
                    isDisabled={isMonthExpanded}
                    onSelectDate={onSelectDate}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            // 월간 레이어 역시 같은 규칙으로 분리해 클릭 타깃이 섞이지 않게 유지한다.
            className={`absolute inset-0 transition-[opacity,transform] ${
              isCalendarDragging ? '' : 'duration-300 ease-out'
            } ${isMonthExpanded ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{
              opacity: expansionProgress,
              transform: `translateY(${8 * (1 - expansionProgress)}px) scale(${
                0.98 + expansionProgress * 0.02
              })`,
            }}
            aria-hidden={expansionProgress < 0.5}
          >
            <div
              className={`mt-[var(--space-2)] ${CALENDAR_HORIZONTAL_PADDING_CLASS}`}
            >
              <div className="grid grid-cols-7 gap-y-[var(--space-2)] pb-[var(--space-2)]">
                {monthCells.map((cell) => (
                  <DateButton
                    key={cell.date.format('YYYY-MM-DD')}
                    date={cell.date}
                    selectedDate={selectedDate}
                    inCurrentMonth={cell.inCurrentMonth}
                    isDisabled={!isMonthExpanded}
                    onSelectDate={onSelectDate}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 드래그 핸들 바 — 위아래로 드래그하여 주간↔월간 전환 */}
        <div className="flex justify-center pb-[var(--space-3)]">
          <button
            type="button"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerCancel}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onKeyDown={onHandleKeyDown}
            className="inline-flex h-6 w-16 items-center justify-center rounded-full touch-none cursor-grab active:cursor-grabbing"
            aria-label={isMonthExpanded ? 'Collapse month' : 'Expand month'}
          >
            <span className="h-1.5 w-10 rounded-full bg-[var(--color-border-muted)]" />
          </button>
        </div>
      </section>

      {/* 연/월 선택 모달 (타이틀 클릭 시 열림) */}
      {isMonthPickerOpen && (
        <MonthYearPickerModal
          baseDate={selectedDate}
          onClose={() => setIsMonthPickerOpen(false)}
          onConfirm={(date) => {
            onSelectDate(date);
            setIsMonthPickerOpen(false);
          }}
        />
      )}
    </>
  );
}
