import type { Payroll, MyPayrollData } from '../types';

// ─── 사장님 급여 관리 목업 데이터 (PayrollPage용) ─────────────────────────
// 오너 페이지에서 직원 목록 카드에 표시되는 급여 데이터
// 실제 API 연동 전 UI 확인 및 개발 시 사용
export const mockPayrolls: Payroll[] = [
  // ── 2월 데이터 ──
  {
    payroll_id: 1,
    employee_id: 101,
    employee_name: '차직원',
    target_month: '2026-02-01', // YYYY-MM-DD 형식, 항상 1일
    total_work_minutes: 10800, // 180시간
    night_work_minutes: 0,
    basic_pay: 2000000,
    total_allowance: 400000,
    total_deduction: 0,
    net_pay: 2400000,
    hourly_wage: 12000,
    is_approved: true,
    approved_at: '2026-02-28T10:00:00',
    created_at: '2026-02-28T09:00:00',
    updated_at: '2026-02-28T10:00:00',
  },
  {
    payroll_id: 2,
    employee_id: 102,
    employee_name: '박직원',
    target_month: '2026-02-01',
    total_work_minutes: 8400, // 140시간
    night_work_minutes: 0,
    basic_pay: 1500000,
    total_allowance: 300000,
    total_deduction: 0,
    net_pay: 1800000,
    hourly_wage: 10500,
    is_approved: false,
    approved_at: null,
    created_at: '2026-02-28T09:00:00',
    updated_at: '2026-02-28T09:00:00',
  },
  {
    payroll_id: 3,
    employee_id: 103,
    employee_name: '최직원',
    target_month: '2026-02-01',
    total_work_minutes: 9600, // 160시간
    night_work_minutes: 0,
    basic_pay: 1800000,
    total_allowance: 360000,
    total_deduction: 0,
    net_pay: 2160000,
    hourly_wage: 11000,
    is_approved: true,
    approved_at: '2026-02-28T11:00:00',
    created_at: '2026-02-28T09:00:00',
    updated_at: '2026-02-28T11:00:00',
  },
  // ── 3월 데이터 ──
  {
    payroll_id: 4,
    employee_id: 101,
    employee_name: '차직원',
    target_month: '2026-03-01',
    total_work_minutes: 11200, // 약 186시간
    night_work_minutes: 600, // 10시간
    basic_pay: 2000000,
    total_allowance: 400000,
    total_deduction: 0,
    net_pay: 2400000,
    hourly_wage: 12000,
    is_approved: false,
    approved_at: null,
    created_at: '2026-03-20T09:00:00',
    updated_at: '2026-03-20T09:00:00',
  },
  {
    payroll_id: 5,
    employee_id: 102,
    employee_name: '박직원',
    target_month: '2026-03-01',
    total_work_minutes: 7200, // 120시간
    night_work_minutes: 180, // 3시간
    basic_pay: 1500000,
    total_allowance: 300000,
    total_deduction: 0,
    net_pay: 1800000,
    hourly_wage: 10500,
    is_approved: false,
    approved_at: null,
    created_at: '2026-03-20T09:00:00',
    updated_at: '2026-03-20T09:00:00',
  },
];

// ─── 알바생 내 급여 목업 데이터 (EmployeePayrollPage용) ───────────────────
// 알바생 본인 급여 페이지 UI 확인용 더미 데이터
// 실제 API 연동 후에는 useMyPayroll 훅이 반환하는 data로 대체됨
//
// [제거 방법] EmployeePayrollPage.tsx에서 아래 한 줄만 수정하면 됨:
//   const payroll = apiPayroll ?? mockMyPayroll;
//   →  const payroll = apiPayroll;  (폴백 제거)
//
export const mockMyPayroll: MyPayrollData = {
  payrollId: 1,
  targetMonth: '2026-03',
  isEstimated: true, // 월 마감 전 실시간 조회 상태
  isApproved: false, // 아직 사장님 승인 전
  totalWorkMinutes: 5040,
  nightWorkMinutes: 180,
  basicPay: 1260000,
  totalAllowance: 54000,
  totalDeduction: 113630,
  netPay: 1200370,
  details: [
    // ── 기본급 항목 ──
    {
      detailId: 1,
      detailType: 'BASE',
      itemName: '기본급',
      amount: 1260000,
      calculationFormula: '9,860원 × 84시간',
      workMinutes: 5040,
    },
    // ── 수당 항목 ──
    {
      detailId: 2,
      detailType: 'ALLOWANCE',
      itemName: '야간 수당',
      amount: 29580,
      calculationFormula: '9,860원 × 1.5 × 3시간 × 66.7%',
      workMinutes: 180,
    },
    {
      detailId: 3,
      detailType: 'ALLOWANCE',
      itemName: '주휴 수당',
      amount: 24420,
      calculationFormula: '9,860원 × 15.6시간 × (84/40)',
      workMinutes: null, // 주휴수당은 실제 근무시간과 무관
    },
    // ── 공제 항목 ──
    {
      detailId: 4,
      detailType: 'DEDUCTION',
      itemName: '국민연금',
      amount: 59850,
      calculationFormula: '(기본급 + 수당) × 4.5%',
      workMinutes: null,
    },
    {
      detailId: 5,
      detailType: 'DEDUCTION',
      itemName: '건강보험',
      amount: 43290,
      calculationFormula: '(기본급 + 수당) × 3.25%',
      workMinutes: null,
    },
    {
      detailId: 6,
      detailType: 'DEDUCTION',
      itemName: '고용보험',
      amount: 10490,
      calculationFormula: '(기본급 + 수당) × 0.9%',
      workMinutes: null,
    },
  ],
};
