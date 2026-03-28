import type { Dayjs } from 'dayjs';
import type {
  CalendarCell,
  ScheduleEmployee,
  ScheduleStatus,
  ScheduleSummary,
} from '../types';

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const STATUS_META: Record<
  ScheduleStatus,
  { label: string; textColor: string; barColor: string }
> = {
  BEFORE_SHIFT: {
    label: '출근전',
    textColor: 'var(--color-status-grey-dot)',
    barColor: 'var(--color-status-grey-dot)',
  },
  WORKING: {
    label: '근무중',
    textColor: 'var(--color-status-green-dot)',
    barColor: 'var(--color-status-green-dot)',
  },
  LATE: {
    label: '지각',
    textColor: 'var(--color-status-orange-dot)',
    barColor: 'var(--color-status-orange-dot)',
  },
  ABSENT: {
    label: '결근',
    textColor: 'var(--color-status-purple-dot)',
    barColor: 'var(--color-status-purple-dot)',
  },
};

export function buildWeekDates(selectedDate: Dayjs): Dayjs[] {
  const start = selectedDate.startOf('week');
  return Array.from({ length: 7 }, (_, index) => start.add(index, 'day'));
}

export function buildMonthCells(selectedDate: Dayjs): CalendarCell[] {
  const monthStart = selectedDate.startOf('month').startOf('week');
  const month = selectedDate.month();

  return Array.from({ length: 42 }, (_, index) => {
    const date = monthStart.add(index, 'day');
    return {
      date,
      inCurrentMonth: date.month() === month,
    };
  });
}

export function buildSummary(employees: ScheduleEmployee[]): ScheduleSummary {
  const late = employees.filter(
    (employee) => employee.status === 'LATE'
  ).length;
  const absent = employees.filter(
    (employee) => employee.status === 'ABSENT'
  ).length;
  const onDuty = employees.filter(
    (employee) => employee.status === 'WORKING' || employee.status === 'LATE'
  ).length;

  return {
    total: employees.length,
    onDuty,
    late,
    absent,
  };
}
