import instance from './instance';
import type { ApiResponse } from './auction.types';

export interface ScheduleDto {
  scheduleId: number;
  employeeId: number;
  employeeName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export interface CreateScheduleRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
}

export interface UpdateScheduleRequest {
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
}

export async function getEmployeeSchedules(
  storeId: number,
  employeeId: number
): Promise<ScheduleDto[]> {
  const { data } = await instance.get<ApiResponse<ScheduleDto[]>>(
    `/api/v1/stores/${storeId}/employees/${employeeId}/schedules`
  );
  return data.data;
}

export async function getStoreSchedulesByDay(
  storeId: number,
  dayOfWeek: string
): Promise<ScheduleDto[]> {
  const { data } = await instance.get<ApiResponse<ScheduleDto[]>>(
    `/api/v1/stores/${storeId}/employees/schedules/${dayOfWeek}`
  );
  return data.data;
}

export async function getMySchedules(storeId: number): Promise<ScheduleDto[]> {
  const { data } = await instance.get<ApiResponse<ScheduleDto[]>>(
    `/api/v1/stores/${storeId}/employees/schedules/me`
  );
  return data.data;
}

export async function createSchedule(
  storeId: number,
  employeeId: number,
  body: CreateScheduleRequest
): Promise<ScheduleDto> {
  const { data } = await instance.post<ApiResponse<ScheduleDto>>(
    `/api/v1/stores/${storeId}/employees/${employeeId}/schedules`,
    body
  );
  return data.data;
}

export async function updateSchedule(
  storeId: number,
  employeeId: number,
  scheduleId: number,
  body: UpdateScheduleRequest
): Promise<ScheduleDto> {
  const { data } = await instance.patch<ApiResponse<ScheduleDto>>(
    `/api/v1/stores/${storeId}/employees/${employeeId}/schedules/${scheduleId}`,
    body
  );
  return data.data;
}

export async function deleteSchedule(
  storeId: number,
  employeeId: number,
  scheduleId: number
): Promise<void> {
  await instance.delete(
    `/api/v1/stores/${storeId}/employees/${employeeId}/schedules/${scheduleId}`
  );
}
