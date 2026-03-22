import dayjs, { type Dayjs } from 'dayjs';
import type {
  CalendarCell,
  ScheduleEmployee,
  ScheduleStoreEmployee,
  ScheduleStatus,
  ScheduleSummary,
} from '../types';

const scheduleByDate: Record<string, ScheduleEmployee[]> = {
  '2026-02-26': [
    {
      id: 101,
      name: '김도윤',
      status: 'WORKING',
      startTime: '09:00',
      endTime: '18:00',
    },
    {
      id: 102,
      name: '박서연',
      status: 'LATE',
      startTime: '10:00',
      endTime: '15:00',
    },
    {
      id: 103,
      name: '최지훈',
      status: 'BEFORE_SHIFT',
      startTime: '12:00',
      endTime: '18:00',
    },
  ],
  '2026-02-27': [
    {
      id: 201,
      name: '함지수',
      status: 'BEFORE_SHIFT',
      startTime: '09:00',
      endTime: '18:00',
    },
    {
      id: 202,
      name: '김도윤',
      status: 'WORKING',
      startTime: '09:00',
      endTime: '18:00',
    },
    {
      id: 203,
      name: '박서연',
      status: 'LATE',
      startTime: '09:15',
      endTime: '12:00',
    },
    {
      id: 204,
      name: '최지훈',
      status: 'BEFORE_SHIFT',
      startTime: '10:30',
      endTime: '13:00',
    },
    {
      id: 205,
      name: '이수현',
      status: 'ABSENT',
      startTime: '14:00',
      endTime: '22:00',
    },
  ],
  '2026-02-28': [
    {
      id: 301,
      name: '함지수',
      status: 'WORKING',
      startTime: '10:00',
      endTime: '16:00',
    },
    {
      id: 302,
      name: '이수현',
      status: 'WORKING',
      startTime: '14:00',
      endTime: '22:00',
    },
  ],
};

const STORE_EMPLOYEE_NAMES = Array.from(
  new Set(
    Object.values(scheduleByDate)
      .flat()
      .map((employee) => employee.name)
  )
);

const STORE_EMPLOYEES: ScheduleStoreEmployee[] = Array.from(
  Object.values(scheduleByDate)
    .flat()
    .reduce<Map<string, ScheduleStoreEmployee>>((map, employee) => {
      if (map.has(employee.name)) return map;

      map.set(employee.name, {
        id: employee.id,
        name: employee.name,
        status: employee.status,
        defaultStartTime: employee.startTime,
        defaultEndTime: employee.endTime,
      });
      return map;
    }, new Map())
    .values()
).sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));

export const DEFAULT_SELECTED_DATE = dayjs('2026-02-27');

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

export function getEmployeesByDate(date: Dayjs): ScheduleEmployee[] {
  return scheduleByDate[date.format('YYYY-MM-DD')] ?? [];
}

export function getStoreEmployeeNames(): string[] {
  return STORE_EMPLOYEE_NAMES;
}

export function getStoreEmployees(): ScheduleStoreEmployee[] {
  return STORE_EMPLOYEES;
}

export function hasScheduleOnDate(date: Dayjs): boolean {
  return getEmployeesByDate(date).length > 0;
}

export function hasAbsentOnDate(date: Dayjs): boolean {
  return getEmployeesByDate(date).some(
    (employee) => employee.status === 'ABSENT'
  );
}

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

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
