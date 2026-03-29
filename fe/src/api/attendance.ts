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
  status: string; // WORKING | LATE | ABSENT 등
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

export async function getMyTodayAttendance(
  storeId: number
): Promise<MyTodayAttendance> {
  const { data } = await instance.get<ApiResponse<MyTodayAttendance>>(
    '/api/v1/attendances/me/today',
    { params: { storeId } }
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
