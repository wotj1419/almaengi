// 직원 상태 - INVITED(초대 대기), WORKING(재직), RESIGNED(퇴사), ON_LEAVE(휴직), BEST(우수 직원)
export type EmployeeStatus =
  | 'INVITED'
  | 'WORKING'
  | 'RESIGNED'
  | 'ON_LEAVE'
  | 'BEST';

// 초대 대기 직원 정보 (status가 항상 'INVITED')
export interface PendingInvite {
  id: number;
  name: string;
  phone: string;
  status: 'INVITED';
  avatarSeed: string;
}

// 직원 목록에서 사용하는 요약 정보 (상세 페이지 이동 시 location.state로도 전달)
export interface EmployeeSummary {
  id: number;
  name: string;
  workSummary: string;
  avatarSeed: string;
  status: EmployeeStatus;
}

// 근태 통계 데이터 - 날짜 범위별 출근/결근/지각/연장근무 현황
export interface EmployeeAttendanceStats {
  periodLabel: string;
  totalDays: number;
  totalHours: number;
  normalAttendance: number;
  absentCount: number;
  lateCount: number;
  overtimeHours: number;
}

// 직원 상세 페이지에서 사용하는 전체 정보 (프로필 + 근태 통계)
export interface EmployeeDetail {
  id: number;
  name: string;
  avatarSeed: string;
  part: string;
  birthDate: string;
  phone: string;
  defaultWorkTime: string;
  contractSigned: boolean;
  stats: EmployeeAttendanceStats;
}

// API 연동 전 UI 확인용 초대 대기 직원 mock 데이터
export const pendingInvites: PendingInvite[] = [
  {
    id: 1,
    name: '박모니',
    phone: '010-****-5678',
    status: 'INVITED',
    avatarSeed: 'invite-park-moni',
  },
  {
    id: 2,
    name: '김도윤',
    phone: '010-****-2198',
    status: 'INVITED',
    avatarSeed: 'invite-kim-doyoon',
  },
  {
    id: 3,
    name: '최서우',
    phone: '010-****-7712',
    status: 'INVITED',
    avatarSeed: 'invite-choi-seowoo',
  },
  {
    id: 4,
    name: '한유림',
    phone: '010-****-6484',
    status: 'INVITED',
    avatarSeed: 'invite-han-yurim',
  },
];

// API 연동 전 UI 확인용 직원 목록 mock 데이터 (재직/휴직/우수/퇴사 상태 포함)
export const employees: EmployeeSummary[] = [
  {
    id: 101,
    name: '박서연',
    workSummary: '월, 화, 수 / 09:00 - 18:00',
    avatarSeed: 'employee-park-seoyeon',
    status: 'WORKING',
  },
  {
    id: 102,
    name: '최현우',
    workSummary: '목, 금 / 10:00 - 19:00',
    avatarSeed: 'employee-choi-hyunwoo',
    status: 'ON_LEAVE',
  },
  {
    id: 103,
    name: '정유진',
    workSummary: '주말 / 09:00 - 21:00',
    avatarSeed: 'employee-jeong-yujin',
    status: 'BEST',
  },
  {
    id: 104,
    name: '강지원',
    workSummary: '퇴직 처리 완료',
    avatarSeed: 'employee-kang-jiwon',
    status: 'RESIGNED',
  },
];

// 직원 ID별 상세 정보 mock 데이터 (프로필 + 근태 통계)
export const employeeDetails: Record<number, EmployeeDetail> = {
  101: {
    id: 101,
    name: '박서연',
    avatarSeed: 'employee-park-seoyeon',
    part: '홀 파트',
    birthDate: '1998. 03. 21',
    phone: '010-3254-1128',
    defaultWorkTime: '09:00 - 18:00',
    contractSigned: true,
    stats: {
      periodLabel: '2026년 2월 1일 - 27일',
      totalDays: 20,
      totalHours: 160,
      normalAttendance: 18,
      absentCount: 1,
      lateCount: 1,
      overtimeHours: 3,
    },
  },
  102: {
    id: 102,
    name: '최현우',
    avatarSeed: 'employee-choi-hyunwoo',
    part: '주방 파트',
    birthDate: '1996. 11. 05',
    phone: '010-5478-3902',
    defaultWorkTime: '10:00 - 19:00',
    contractSigned: true,
    stats: {
      periodLabel: '2026년 2월 1일 - 27일',
      totalDays: 16,
      totalHours: 128,
      normalAttendance: 15,
      absentCount: 0,
      lateCount: 1,
      overtimeHours: 2,
    },
  },
  103: {
    id: 103,
    name: '정유진',
    avatarSeed: 'employee-jeong-yujin',
    part: '주말 파트',
    birthDate: '2000. 07. 13',
    phone: '010-7781-2415',
    defaultWorkTime: '09:00 - 21:00',
    contractSigned: false,
    stats: {
      periodLabel: '2026년 2월 1일 - 27일',
      totalDays: 8,
      totalHours: 96,
      normalAttendance: 7,
      absentCount: 1,
      lateCount: 0,
      overtimeHours: 6,
    },
  },
  104: {
    id: 104,
    name: '강지원',
    avatarSeed: 'employee-kang-jiwon',
    part: '퇴직',
    birthDate: '1997. 02. 18',
    phone: '010-9901-0032',
    defaultWorkTime: '근무 종료',
    contractSigned: true,
    stats: {
      periodLabel: '2025년 12월 1일 - 31일',
      totalDays: 6,
      totalHours: 48,
      normalAttendance: 6,
      absentCount: 0,
      lateCount: 0,
      overtimeHours: 0,
    },
  },
};

// ID로 직원 상세 정보 조회 - API 연동 시 이 함수를 API 호출로 교체
export function getEmployeeDetailById(id: number): EmployeeDetail | undefined {
  return employeeDetails[id];
}
