import instance from './instance';
import type { ApiResponse } from './auction.types';

export interface AttendanceRequest {
  qrToken: string;
  latitude: number;
  longitude: number;
  overtimeConfirm?: boolean;
}

export interface AttendanceResult {
  type: string; // CLOCK_IN | CLOCK_OUT | OVERTIME_CHECK
  attendanceId: number;
  clockIn: string | null;
  clockOut: string | null;
  status: string; // WORKING | LATE | ABSENT
  overtime: boolean;
  scheduledEndTime?: string | null;
  message: string;
}

export async function recordAttendance(body: AttendanceRequest) {
  const { data } = await instance.post<ApiResponse<AttendanceResult>>(
    '/api/v1/attendances',
    body
  );
  return data;
}

export interface DashboardSummary {
  working: number;
  late: number;
  absent: number;
}

export interface DashboardEmployee {
  employeeId: number;
  userName: string;
  phone: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
}

export interface DashboardDetail {
  status: string;
  employees: DashboardEmployee[];
}

export interface MyTodayAttendance {
  currentStatus: string | null; // WAITING | WORKING | LATE | ABSENT | null
  scheduledEndTime: string | null; // "HH:mm:ss"
}

export interface MyAttendanceLog {
  storeId: number;
  employeeId: number;
  employeeName: string;
  date: string; // YYYY-MM-DD
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  clockIn: string | null;
  clockOut: string | null;
  status: string | null; // WORKING | LATE | ABSENT | WAITING | null
  overtime: boolean | null;
  breakMinutes: number | null;
  workedMinutes: number | null;
  exists: boolean;
}

export async function getMyTodayAttendance(
  storeId: number
): Promise<MyTodayAttendance> {
  const { data } = await instance.get<ApiResponse<MyTodayAttendance>>(
    '/api/v1/attendances/me/today',
    { params: { storeId } }
  );
  return data.data;
}

// 직원 본인 특정 날짜 근태 조회(주간 집계용 원본)
// exists=false는 해당 날짜 기록 없음
export async function getMyAttendanceLog(
  storeId: number,
  date: string
): Promise<MyAttendanceLog> {
  const { data } = await instance.get<ApiResponse<MyAttendanceLog>>(
    '/api/v1/attendances/me/log',
    {
      params: { storeId, date },
    }
  );

  return data.data;
}

export async function getDashboardSummary(storeId: number) {
  const { data } = await instance.get<ApiResponse<DashboardSummary>>(
    `/api/v1/attendances/dashboard/${storeId}`
  );
  return data.data;
}

export async function getDashboardDetail(storeId: number, status: string) {
  const { data } = await instance.get<ApiResponse<DashboardDetail>>(
    `/api/v1/attendances/dashboard/${storeId}/${status}`
  );
  return data.data;
}

export interface MonthlyAttendanceEmployeeSummary {
  employeeId: number;
  employeeName: string;
  attendanceCount: number;
  lateCount: number;
  absentCount: number;
  totalWorkMinutes: number;
}

export interface MonthlyAttendanceEmployeeInfo {
  employeeId: number;
  employeeName: string;
}

export interface MonthlyAttendanceReport {
  targetMonth: string;
  employees: MonthlyAttendanceEmployeeSummary[];
  diligentEmployees: MonthlyAttendanceEmployeeInfo[];
  lateChampions: MonthlyAttendanceEmployeeInfo[];
}

export interface EmployeeMonthlyAttendanceSummaryView {
  employeeId: number;
  employeeName: string;
  periodLabel: string;
  workedDays: number;
  workedHours: number;
  normalAttendance: number;
  lateCount: number;
  absentCount: number;
  overtimeHours: '-';
}

export function mapEmployeeMonthlyAttendanceSummary(
  report: MonthlyAttendanceReport,
  employeeId: number,
  fallbackName = '-'
): EmployeeMonthlyAttendanceSummaryView {
  const employee = report.employees.find(
    (item) => item.employeeId === employeeId
  );
  const attendanceCount = employee?.attendanceCount ?? 0;
  const lateCount = employee?.lateCount ?? 0;
  const absentCount = employee?.absentCount ?? 0;
  const totalWorkMinutes = employee?.totalWorkMinutes ?? 0;

  return {
    employeeId,
    employeeName: employee?.employeeName ?? fallbackName,
    periodLabel: report.targetMonth,
    workedDays: attendanceCount,
    workedHours: Math.floor(totalWorkMinutes / 60),
    normalAttendance: Math.max(attendanceCount - lateCount, 0),
    lateCount,
    absentCount,
    overtimeHours: '-',
  };
}

export async function getMonthlyAttendanceReport(
  storeId: number,
  targetMonth: string
) {
  const { data } = await instance.get<ApiResponse<MonthlyAttendanceReport>>(
    `/api/v1/attendances/report/${storeId}`,
    {
      params: { targetMonth },
    }
  );

  return data.data;
}
