export interface AttendanceRequest {
  attendance_id: number;
  employee_id: number;
  employeeName: string;
  target_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  clock_in: string;
  clock_out: string;
  status: '대기' | '승인' | '거절';
  overtime: boolean;
  break_minutes: number;
  message: string;
  created_at: string;
  updated_at: string;
}

export const attendanceMockData: AttendanceRequest[] = [
  {
    attendance_id: 1,
    employee_id: 101,
    employeeName: '차직원',
    target_date: '2026-03-01',
    scheduled_start_time: '09:00',
    scheduled_end_time: '15:00',
    clock_in: '2026-03-01T09:00:00',
    clock_out: '2026-03-01T17:00:00',
    status: '대기',
    overtime: true,
    break_minutes: 60,
    message: '당일 갑작스러운 개인 사정으로 실제 근무 시간이 달랐습니다.',
    created_at: '2026-03-02T08:32:00',
    updated_at: '2026-03-02T08:32:00',
  },
  {
    attendance_id: 2,
    employee_id: 102,
    employeeName: '박직원',
    target_date: '2026-02-25',
    scheduled_start_time: '09:15',
    scheduled_end_time: '15:00',
    clock_in: '2026-02-25T09:00:00',
    clock_out: '2026-02-25T15:00:00',
    status: '승인',
    overtime: false,
    break_minutes: 30,
    message: '당일 병원 방문으로 실제 출근 시간이 변경되어 수정 요청드립니다.',
    created_at: '2026-02-26T17:10:00',
    updated_at: '2026-02-26T18:00:00',
  },
  {
    attendance_id: 3,
    employee_id: 102,
    employeeName: '박직원',
    target_date: '2026-03-03',
    scheduled_start_time: '13:00',
    scheduled_end_time: '19:00',
    clock_in: '2026-03-03T13:00:00',
    clock_out: '2026-03-03T17:00:00',
    status: '거절',
    overtime: false,
    break_minutes: 0,
    message:
      '가족 행사로 인해 일찍 퇴근하여 실제 근무 시간 기록 수정 요청드립니다.',
    created_at: '2026-03-04T21:45:00',
    updated_at: '2026-03-04T22:30:00',
  },
  {
    attendance_id: 4,
    employee_id: 103,
    employeeName: '최직원',
    target_date: '2026-03-05',
    scheduled_start_time: '10:00',
    scheduled_end_time: '18:00',
    clock_in: '2026-03-05T11:00:00',
    clock_out: '2026-03-05T18:00:00',
    status: '대기',
    overtime: false,
    break_minutes: 60,
    message:
      '당일 수업으로 인해 늦게 출근하였으며 실제 근무 시간 반영 요청드립니다.',
    created_at: '2026-03-06T09:05:00',
    updated_at: '2026-03-06T09:05:00',
  },
  {
    attendance_id: 5,
    employee_id: 104,
    employeeName: '정직원',
    target_date: '2026-03-02',
    scheduled_start_time: '08:00',
    scheduled_end_time: '16:00',
    clock_in: '2026-03-02T09:00:00',
    clock_out: '2026-03-02T16:00:00',
    status: '승인',
    overtime: false,
    break_minutes: 60,
    message:
      '당일 교통 지연으로 실제 출근 시간이 늦어져 기록 수정 요청드립니다.',
    created_at: '2026-03-03T14:22:00',
    updated_at: '2026-03-03T15:00:00',
  },
  {
    attendance_id: 6,
    employee_id: 105,
    employeeName: '함직원',
    target_date: '2026-03-04',
    scheduled_start_time: '14:00',
    scheduled_end_time: '22:00',
    clock_in: '2026-03-04T13:00:00',
    clock_out: '2026-03-04T22:00:00',
    status: '거절',
    overtime: false,
    break_minutes: 30,
    message:
      '당일 야간 수업 일정 착오로 실제 퇴근 시간이 달라 기록 수정 요청드립니다.',
    created_at: '2026-03-05T23:58:00',
    updated_at: '2026-03-05T23:58:00',
  },
  {
    attendance_id: 7,
    employee_id: 106,
    employeeName: '이직원',
    target_date: '2026-03-10',
    scheduled_start_time: '09:00',
    scheduled_end_time: '18:00',
    clock_in: '2026-03-10T09:00:00',
    clock_out: '2026-03-10T20:30:00',
    status: '대기',
    overtime: true,
    break_minutes: 60,
    message:
      '마감 업무로 인해 연장 근무가 발생하였습니다. 실제 퇴근 시간 반영 요청드립니다.',
    created_at: '2026-03-11T08:00:00',
    updated_at: '2026-03-11T08:00:00',
  },
  {
    attendance_id: 8,
    employee_id: 107,
    employeeName: '김직원',
    target_date: '2026-03-12',
    scheduled_start_time: '10:00',
    scheduled_end_time: '19:00',
    clock_in: '2026-03-12T10:00:00',
    clock_out: '2026-03-12T16:00:00',
    status: '대기',
    overtime: false,
    break_minutes: 0,
    message:
      '몸이 좋지 않아 조기 퇴근하였습니다. 실제 근무 시간 반영 부탁드립니다.',
    created_at: '2026-03-12T17:00:00',
    updated_at: '2026-03-12T17:00:00',
  },
];
