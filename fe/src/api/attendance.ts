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
