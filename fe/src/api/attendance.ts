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
