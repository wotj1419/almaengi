import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSchedule,
  deleteSchedule,
  getMySchedules as getMySchedulesApi,
  getStoreSchedulesByDay,
  updateSchedule,
  type CreateScheduleRequest,
  type UpdateScheduleRequest,
} from '@/api/schedule';

const SCHEDULE_KEYS = {
  all: ['schedules'] as const,
  byDay: (storeId: number | null, dayOfWeek: string) =>
    [...SCHEDULE_KEYS.all, storeId, dayOfWeek] as const,
  my: (storeId: number | null, userId: number | null) =>
    [...SCHEDULE_KEYS.all, 'me', storeId, userId] as const,
};

export function useSchedulesByDay(
  storeId: number | null,
  dayOfWeek: string,
  enabled = true
) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.byDay(storeId, dayOfWeek),
    queryFn: () => getStoreSchedulesByDay(storeId as number, dayOfWeek),
    enabled: typeof storeId === 'number' && enabled,
  });
}

export function useMySchedules(
  storeId: number | null,
  userId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.my(storeId, userId),
    queryFn: () => getMySchedulesApi(storeId as number),
    enabled:
      typeof storeId === 'number' && typeof userId === 'number' && enabled,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      employeeId,
      body,
    }: {
      storeId: number;
      employeeId: number;
      body: CreateScheduleRequest;
    }) => createSchedule(storeId, employeeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      employeeId,
      scheduleId,
      body,
    }: {
      storeId: number;
      employeeId: number;
      scheduleId: number;
      body: UpdateScheduleRequest;
    }) => updateSchedule(storeId, employeeId, scheduleId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      employeeId,
      scheduleId,
    }: {
      storeId: number;
      employeeId: number;
      scheduleId: number;
    }) => deleteSchedule(storeId, employeeId, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
    },
  });
}
