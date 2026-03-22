import { useMemo, useRef, useState } from 'react';
import {
  AlarmClock,
  ChevronRight,
  CircleCheckBig,
  LogOut,
  Plus,
  Users,
} from 'lucide-react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import type { Dayjs } from 'dayjs';
import BottomNav from '@/components/layout/BottomNav';
import {
  buildSummary,
  DEFAULT_SELECTED_DATE,
  getEmployeesByDate,
  getStoreEmployees,
  STATUS_META,
  WEEKDAY_LABELS,
} from '@/features/schedule/data/mockSchedule';
import ScheduleAddWorkModal from '@/features/schedule/components/ScheduleAddWorkModal';
import ScheduleChangeEmployeeModal from '@/features/schedule/components/ScheduleChangeEmployeeModal';
import ScheduleChangeTimeModal from '@/features/schedule/components/ScheduleChangeTimeModal';
import ScheduleDeleteConfirmModal from '@/features/schedule/components/ScheduleDeleteConfirmModal';
import ScheduleEmployeeActionSheet from '@/features/schedule/components/ScheduleEmployeeActionSheet';
import ScheduleTopBar from '@/features/schedule/components/ScheduleTopBar';
import type {
  ScheduleActionType,
  ScheduleEmployee,
  ScheduleStoreEmployee,
  ScheduleSummary,
} from '@/features/schedule/types';

// --- 드래그 관련 상수 ---
const DRAG_THRESHOLD = 40; // 드래그 거리가 이 값(px) 이상이면 주간↔월간 전환 확정
const CLICK_GUARD_MS = 220; // 드래그 직후 의도치 않은 클릭을 무시하는 유예 시간(ms)
const WEEK_PANEL_HEIGHT = 72; // 주간 달력 패널 높이(px)
const MONTH_PANEL_HEIGHT = 320; // 월간 달력 패널 높이(px)
const CALENDAR_DRAG_RANGE = MONTH_PANEL_HEIGHT - WEEK_PANEL_HEIGHT; // 드래그 가능한 최대 범위

// 로컬 수정 이력(source)에 해당 날짜 데이터가 있으면 그것을, 없으면 mock 기본값을 반환
function resolveEmployeesByDate(
  date: Dayjs,
  dateKey: string,
  source: Record<string, ScheduleEmployee[]>
) {
  return source[dateKey] ?? getEmployeesByDate(date);
}

interface ScheduleSummaryCardsProps {
  summary: ScheduleSummary;
}

interface SummaryCardItem {
  key: keyof ScheduleSummary;
  label: string;
  icon: ReactNode;
  iconBoxClassName: string;
  valueColor?: string;
}

// --- 요약 카드에 사용하는 상태별 색상 ---
const HOME_WORKING_COLOR = 'var(--color-status-green-dot)'; // 근무/출근
const HOME_LATE_COLOR = 'var(--color-status-orange-dot)'; // 지각
const HOME_ABSENT_COLOR = 'var(--color-status-purple-dot)'; // 결근

const SUMMARY_CARD_ITEMS: SummaryCardItem[] = [
  {
    key: 'total',
    label: '총 인원',
    icon: (
      <Users size={15} color="var(--color-text-secondary)" strokeWidth={2.2} />
    ),
    iconBoxClassName: 'bg-[var(--color-bg-surface)]',
  },
  {
    key: 'onDuty',
    label: '근무/출근',
    icon: (
      <CircleCheckBig size={15} color={HOME_WORKING_COLOR} strokeWidth={2.2} />
    ),
    iconBoxClassName: 'bg-[var(--color-status-green-bg)]',
    valueColor: HOME_WORKING_COLOR,
  },
  {
    key: 'late',
    label: '지각',
    icon: <AlarmClock size={15} color={HOME_LATE_COLOR} strokeWidth={2.2} />,
    iconBoxClassName: 'bg-[var(--color-status-orange-bg)]',
    valueColor: HOME_LATE_COLOR,
  },
  {
    key: 'absent',
    label: '결근',
    icon: <LogOut size={15} color={HOME_ABSENT_COLOR} strokeWidth={2.2} />,
    iconBoxClassName: 'bg-[var(--color-status-purple-bg)]',
    valueColor: HOME_ABSENT_COLOR,
  },
];

// 총 인원 / 근무·출근 / 지각 / 결근 — 4개의 요약 통계 카드
function ScheduleSummaryCards({ summary }: ScheduleSummaryCardsProps) {
  return (
    <section className="grid grid-cols-4 gap-[var(--space-2)]">
      {SUMMARY_CARD_ITEMS.map((item) => (
        <article
          key={item.key}
          className="rounded-2xl bg-[var(--color-bg-white)] px-[var(--space-3)] py-[var(--space-4)] shadow-[0px_2px_10px_-4px_rgba(0,0,0,0.05)]"
        >
          <div className="mb-[var(--space-2)]">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] ${item.iconBoxClassName}`}
            >
              {item.icon}
            </span>
          </div>
          <p className="text-[length:var(--text-xs)] font-semibold text-[var(--color-text-placeholder)]">
            {item.label}
          </p>
          <p
            className="mt-[var(--space-1)] text-[length:var(--text-md2)] font-bold"
            style={{ color: item.valueColor ?? 'var(--color-text-primary)' }}
          >
            {summary[item.key]}명
          </p>
        </article>
      ))}
    </section>
  );
}

interface ScheduleDayHeaderProps {
  selectedDate: Dayjs;
  scheduleCount: number;
  onAddSchedule: () => void;
}

// 선택된 날짜 정보(날짜·요일·일정 수)와 "근무 추가" 버튼을 보여주는 헤더
function ScheduleDayHeader({
  selectedDate,
  scheduleCount,
  onAddSchedule,
}: ScheduleDayHeaderProps) {
  const weekdayLabel = WEEKDAY_LABELS[selectedDate.day()];

  return (
    <section className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-[var(--space-5)]">
      <div className="space-y-[var(--space-0-5)]">
        <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
          {selectedDate.format('M월 D일')} {weekdayLabel}요일
        </h2>
        <p className="text-[length:var(--text-xs)] font-medium text-[var(--color-text-placeholder)]">
          총 {scheduleCount}건의 일정이 있습니다
        </p>
      </div>
      <button
        type="button"
        onClick={onAddSchedule}
        className="inline-flex h-9 items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] border border-[var(--color-border-muted)] bg-[var(--color-bg-white)] px-[var(--space-3)] text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
      >
        근무 추가
        <Plus size={14} />
      </button>
    </section>
  );
}

interface ScheduleEmployeeListProps {
  employees: ScheduleEmployee[];
  onSelectEmployee: (employee: ScheduleEmployee) => void;
}

// 직원 한 명의 이름·상태(근무/지각/결근 등)·근무시간을 표시하는 카드 행
function EmployeeRow({
  employee,
  onClick,
}: {
  employee: ScheduleEmployee;
  onClick: () => void;
}) {
  const statusMeta = STATUS_META[employee.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-[var(--space-4)] rounded-2xl bg-[var(--color-bg-white)] p-[var(--space-4)] text-left shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]"
    >
      <span
        className="h-10 w-1.5 rounded-full"
        style={{ backgroundColor: statusMeta.barColor }}
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-[var(--space-3)]">
        <div className="flex min-w-0 items-center gap-[var(--space-2)]">
          <p className="truncate text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
            {employee.name}
          </p>
          <ChevronRight size={14} color="var(--color-text-placeholder)" />
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <p
            className="text-[length:var(--text-xs)] font-bold"
            style={{ color: statusMeta.textColor }}
          >
            {statusMeta.label}
          </p>
          <span className="text-[length:var(--text-xs)] text-[var(--color-border-muted)]">
            |
          </span>
          <p className="text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)]">
            {employee.startTime} ~ {employee.endTime}
          </p>
        </div>
      </div>
    </button>
  );
}

// 선택 날짜의 직원 근무 목록. 일정이 없으면 빈 상태 메시지를 표시
function ScheduleEmployeeList({
  employees,
  onSelectEmployee,
}: ScheduleEmployeeListProps) {
  if (employees.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[var(--color-border-muted)] bg-[var(--color-bg-white)] px-[var(--space-7)] py-[var(--space-8)] text-center">
        <p className="text-[length:var(--text-base)] font-medium text-[var(--color-text-placeholder)]">
          선택한 날짜에 등록된 일정이 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-[var(--space-3)]">
      {employees.map((employee) => (
        <EmployeeRow
          key={employee.id}
          employee={employee}
          onClick={() => onSelectEmployee(employee)}
        />
      ))}
    </section>
  );
}

// 스케줄 관리 메인 페이지
// 흐름: 달력에서 날짜 선택 → 직원 목록 → 직원 클릭 → 액션시트 → 모달(시간변경/직원변경/삭제) → state 갱신
export default function SchedulePage() {
  // --- 날짜·달력 상태 ---
  const [selectedDate, setSelectedDate] = useState(DEFAULT_SELECTED_DATE);
  const [isMonthExpanded, setIsMonthExpanded] = useState(false); // 달력이 월간으로 확장되어 있는지

  // --- 모달 제어용 상태 (각 모달의 대상 직원을 저장, null이면 닫힘) ---
  const [selectedEmployee, setSelectedEmployee] =
    useState<ScheduleEmployee | null>(null); // 액션시트 대상
  const [changeTimeTarget, setChangeTimeTarget] =
    useState<ScheduleEmployee | null>(null); // 시간변경 모달 대상
  const [changeEmployeeTarget, setChangeEmployeeTarget] =
    useState<ScheduleEmployee | null>(null); // 직원교체 모달 대상
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEmployee | null>(
    null
  ); // 삭제확인 모달 대상
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false); // 근무추가 모달
  const [addWorkError, setAddWorkError] = useState<string | null>(null); // 근무추가 시 유효성 에러
  // 서버 연동 전까지, 날짜별 수정 결과를 로컬에서 단일 소스로 유지한다.
  const [employeesByDate, setEmployeesByDate] = useState<
    Record<string, ScheduleEmployee[]>
  >({});

  // 달력 드래그 제스처 메타 정보 (시작 좌표, 수직 이동 거리, 드래그 확정 여부 등)
  const dragMetaRef = useRef<{
    startX: number;
    startY: number;
    deltaY: number;
    moved: boolean;
    draggedVertical: boolean;
    baseExpanded: boolean;
  } | null>(null);

  const [calendarDragOffsetY, setCalendarDragOffsetY] = useState(0);
  const [isCalendarDragging, setIsCalendarDragging] = useState(false);
  const clickGuardUntilRef = useRef(0);

  const selectedDateKey = selectedDate.format('YYYY-MM-DD');

  // add/change/delete가 모두 같은 경로로 업데이트되도록 통일한다.
  const updateSelectedDateEmployees = (
    updater: (current: ScheduleEmployee[]) => ScheduleEmployee[]
  ) => {
    setEmployeesByDate((prev) => {
      const current = resolveEmployeesByDate(
        selectedDate,
        selectedDateKey,
        prev
      );
      return {
        ...prev,
        [selectedDateKey]: updater(current),
      };
    });
  };

  // --- 파생 데이터 (선택 날짜가 바뀔 때 재계산) ---
  const employees = useMemo(
    () =>
      resolveEmployeesByDate(selectedDate, selectedDateKey, employeesByDate),
    [employeesByDate, selectedDate, selectedDateKey]
  );
  // 이미 해당 날짜에 배치된 직원 이름 집합 (중복 배치 방지에 사용)
  const employeeNames = useMemo(
    () => new Set(employees.map((employee) => employee.name)),
    [employees]
  );
  const busyEmployeeNames = useMemo(
    () => Array.from(employeeNames),
    [employeeNames]
  );

  // 매장 전체 직원 목록 (근무 추가 시 후보 목록의 원본)
  const storeEmployees = useMemo(() => getStoreEmployees(), []);
  // 해당 날짜에 아직 배치되지 않은 직원만 필터링 → 근무 추가 모달의 후보
  const addableEmployees = useMemo(
    () =>
      storeEmployees.filter((candidate) => !employeeNames.has(candidate.name)),
    [employeeNames, storeEmployees]
  );

  // 총 인원 / 근무 / 지각 / 결근 통계 요약
  const summary = useMemo(() => buildSummary(employees), [employees]);

  // 달력 드래그 직후의 잔여 클릭 이벤트가 날짜/직원 클릭으로 번지는 것을 방지한다.
  const startClickGuard = () => {
    clickGuardUntilRef.current = Date.now() + CLICK_GUARD_MS;
  };

  const isClickGuarded = () => Date.now() < clickGuardUntilRef.current;

  const handleSelectDate = (date: typeof selectedDate) => {
    if (isClickGuarded()) return;
    setSelectedDate(date);
  };

  const handleSelectEmployee = (employee: ScheduleEmployee) => {
    if (isClickGuarded()) return;
    setSelectedEmployee(employee);
  };

  const handleOpenAddSchedule = () => {
    if (isClickGuarded()) return;
    setAddWorkError(null);
    setIsAddWorkOpen(true);
  };
  const handleCloseAddSchedule = () => {
    setIsAddWorkOpen(false);
    setAddWorkError(null);
  };

  // 근무 추가 확인 — 시간 유효성·중복 검사 후 새 직원을 목록에 추가
  const handleAddWorkConfirm = (
    candidate: ScheduleStoreEmployee,
    startTime: string,
    endTime: string
  ) => {
    if (startTime >= endTime) {
      return;
    }

    if (employeeNames.has(candidate.name)) {
      setAddWorkError('해당 날짜에 이미 근무가 있는 직원입니다.');
      return;
    }

    setAddWorkError(null);

    const newEmployee: ScheduleEmployee = {
      id: Date.now(),
      name: candidate.name,
      status: 'BEFORE_SHIFT',
      startTime,
      endTime,
    };

    updateSelectedDateEmployees((current) => [...current, newEmployee]);

    handleCloseAddSchedule();
  };

  // 액션시트에서 선택한 액션에 따라 해당 모달을 열어주는 분기 핸들러
  const handleScheduleAction = (action: ScheduleActionType) => {
    if (!selectedEmployee) return;

    if (action === 'CHANGE_TIME') {
      setChangeTimeTarget(selectedEmployee);
      setSelectedEmployee(null);
      return;
    }

    if (action === 'CHANGE_EMPLOYEE') {
      setChangeEmployeeTarget(selectedEmployee);
      setSelectedEmployee(null);
      return;
    }

    setDeleteTarget(selectedEmployee);
    setSelectedEmployee(null);
  };

  const handleChangeTimeConfirm = (startTime: string, endTime: string) => {
    if (!changeTimeTarget) return;
    if (startTime >= endTime) return;

    updateSelectedDateEmployees((current) =>
      current.map((employee) =>
        employee.id === changeTimeTarget.id
          ? { ...employee, startTime, endTime }
          : employee
      )
    );

    setChangeTimeTarget(null);
  };

  const handleChangeEmployeeConfirm = (candidate: ScheduleEmployee) => {
    if (!changeEmployeeTarget) return;

    updateSelectedDateEmployees((current) =>
      current.map((employee) =>
        employee.id === changeEmployeeTarget.id
          ? {
              ...employee,
              name: candidate.name,
              status: candidate.status,
            }
          : employee
      )
    );

    setChangeEmployeeTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    updateSelectedDateEmployees((current) =>
      current.filter((employee) => employee.id !== deleteTarget.id)
    );

    setDeleteTarget(null);
  };

  // =============================================
  // 달력 패널 드래그 제스처 핸들러 (주간 ↔ 월간 전환)
  // PointerEvent 기반으로 터치·마우스 모두 지원
  // =============================================
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startClickGuard();

    dragMetaRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      deltaY: 0,
      moved: false,
      draggedVertical: false,
      baseExpanded: isMonthExpanded,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!dragMetaRef.current) return;

    const deltaX = event.clientX - dragMetaRef.current.startX;
    const deltaY = event.clientY - dragMetaRef.current.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > 6 || absDeltaY > 6) {
      dragMetaRef.current.moved = true;
    }

    // 수평 흔들림은 무시하고, 수직 드래그일 때만 달력 높이 미리보기를 갱신한다.
    if (absDeltaY > 6 && absDeltaY >= absDeltaX) {
      const constrainedDeltaY = dragMetaRef.current.baseExpanded
        ? Math.max(-CALENDAR_DRAG_RANGE, Math.min(0, deltaY))
        : Math.min(CALENDAR_DRAG_RANGE, Math.max(0, deltaY));

      dragMetaRef.current.deltaY = constrainedDeltaY;
      dragMetaRef.current.draggedVertical = true;
      setCalendarDragOffsetY(constrainedDeltaY);
      setIsCalendarDragging(true);
    }
  };

  // 드래그 종료 — 이동 거리가 DRAG_THRESHOLD를 넘으면 확장/축소 확정
  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!dragMetaRef.current) return;

    const { deltaY, draggedVertical, baseExpanded } = dragMetaRef.current;
    if (draggedVertical) {
      // 아래로 충분히 드래그 → 월간 확장 / 위로 충분히 드래그 → 주간 축소
      if (!baseExpanded && deltaY >= DRAG_THRESHOLD) {
        setIsMonthExpanded(true);
      } else if (baseExpanded && deltaY <= -DRAG_THRESHOLD) {
        setIsMonthExpanded(false);
      }
    }

    setCalendarDragOffsetY(0);
    setIsCalendarDragging(false);
    startClickGuard();
    dragMetaRef.current = null;
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setCalendarDragOffsetY(0);
    setIsCalendarDragging(false);
    startClickGuard();
    dragMetaRef.current = null;
  };

  const handleHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setIsMonthExpanded((prev) => !prev);
  };

  // =============================================
  // 렌더링
  // 구조: TopBar(달력) → main(요약카드 + 헤더 + 직원목록) → BottomNav → 모달들
  // =============================================
  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        {/* 달력 상단 바: 주간/월간 달력 + 드래그 핸들 */}
        <ScheduleTopBar
          selectedDate={selectedDate}
          isMonthExpanded={isMonthExpanded}
          calendarDragOffsetY={calendarDragOffsetY}
          isCalendarDragging={isCalendarDragging}
          onSelectDate={handleSelectDate}
          onHandlePointerDown={handlePointerDown}
          onHandlePointerMove={handlePointerMove}
          onHandlePointerUp={handlePointerUp}
          onHandlePointerCancel={handlePointerCancel}
          onHandleKeyDown={handleHandleKeyDown}
        />

        <main
          className={`flex flex-1 flex-col px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-9)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)] ${
            isMonthExpanded ? 'gap-[var(--space-4)]' : 'gap-[var(--space-6)]'
          }`}
        >
          {/* 주간 모드일 때만 요약 카드(총인원/근무/지각/결근) 표시 */}
          {!isMonthExpanded && <ScheduleSummaryCards summary={summary} />}

          {/* 선택 날짜 헤더 + 근무 추가 버튼 */}
          <ScheduleDayHeader
            selectedDate={selectedDate}
            scheduleCount={employees.length}
            onAddSchedule={handleOpenAddSchedule}
          />

          <ScheduleEmployeeList
            employees={employees}
            onSelectEmployee={handleSelectEmployee}
          />

          {isMonthExpanded && (
            <button
              type="button"
              onClick={handleOpenAddSchedule}
              className="mt-[var(--space-3)] inline-flex h-16 w-full items-center justify-center rounded-[24px] bg-[var(--color-status-green-bg)] text-[length:var(--text-md2)] font-bold text-[var(--color-status-green-dot)] shadow-[0px_8px_24px_0px_rgba(220,252,231,0.5)]"
            >
              근무 추가
            </button>
          )}
        </main>
      </div>

      <BottomNav activeTab="schedule" />

      {/* 직원 클릭 시 액션 시트 (시간변경 / 직원변경 / 삭제) */}
      <ScheduleEmployeeActionSheet
        isOpen={selectedEmployee !== null}
        selectedDate={selectedDate}
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onAction={handleScheduleAction}
      />

      {/* 근무 추가 모달 */}
      {isAddWorkOpen && (
        <ScheduleAddWorkModal
          isOpen={true}
          selectedDate={selectedDate}
          candidateEmployees={addableEmployees}
          submissionError={addWorkError}
          onClearSubmissionError={() => setAddWorkError(null)}
          onClose={handleCloseAddSchedule}
          onConfirm={handleAddWorkConfirm}
        />
      )}

      {/* 근무시간 변경 모달 */}
      {changeTimeTarget && (
        <ScheduleChangeTimeModal
          isOpen={true}
          selectedDate={selectedDate}
          employee={changeTimeTarget}
          onClose={() => setChangeTimeTarget(null)}
          onConfirm={handleChangeTimeConfirm}
        />
      )}

      {/* 직원 교체 모달 */}
      {changeEmployeeTarget && (
        <ScheduleChangeEmployeeModal
          isOpen={true}
          selectedDate={selectedDate}
          employee={changeEmployeeTarget}
          busyEmployeeNames={busyEmployeeNames}
          onClose={() => setChangeEmployeeTarget(null)}
          onConfirm={handleChangeEmployeeConfirm}
        />
      )}

      {/* 근무 삭제 확인 모달 */}
      <ScheduleDeleteConfirmModal
        isOpen={deleteTarget !== null}
        selectedDate={selectedDate}
        employee={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
