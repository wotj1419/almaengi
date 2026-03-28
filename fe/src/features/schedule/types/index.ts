import type { Dayjs } from 'dayjs';

export type ScheduleStatus = 'BEFORE_SHIFT' | 'WORKING' | 'LATE' | 'ABSENT';

export interface ScheduleEmployee {
  id: number;
  employeeId: number;
  name: string;
  status: ScheduleStatus;
  startTime: string;
  endTime: string;
}

export interface ScheduleStoreEmployee {
  id: number;
  name: string;
  status: ScheduleStatus;
  defaultStartTime: string;
  defaultEndTime: string;
}

export interface ScheduleSummary {
  total: number;
  onDuty: number;
  late: number;
  absent: number;
}

export interface CalendarCell {
  date: Dayjs;
  inCurrentMonth: boolean;
}

export type ScheduleActionType = 'CHANGE_TIME' | 'CHANGE_EMPLOYEE' | 'DELETE';
