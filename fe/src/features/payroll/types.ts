// 사장님 급여 관리 (오너 전용)
export interface Payroll {
  payroll_id: number;
  employee_id: number;
  employee_name: string;
  target_month: string;
  total_work_minutes: number; // 급여 대상 월 (YYYY-MM-DD 형식, 항상 1일)
  night_work_minutes: number; // 해당 월 총 근무 시간 (분 단위)
  overtime_minutes: number; // 야간 근무 시간 (분 단위, 22:00~06:00)
  basic_pay: number;
  total_allowance: number; // 총 수당 합계 (원)
  total_deduction: number; // 총 공제 합계 (원)
  net_pay: number; // 실수령액 = 기본급 + 수당 - 공제 (원)
  hourly_wage: number; // 시급 (원)
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// 알바생 내 급여 조회
export interface MyPayrollDetailItem {
  detailId: number;
  detailType: 'BASE' | 'ALLOWANCE' | 'DEDUCTION' | 'OTHER';
  itemName: string;
  amount: number;
  calculationFormula: string | null; // 계산식 설명 (예: '9,860원 × 84시간'), 없으면 null
  workMinutes: number | null;
}

// 알바생 월별 급여 전체 데이터
export interface MyPayrollData {
  payrollId: number | null;
  targetMonth: string;
  isEstimated: boolean;
  isApproved: boolean;
  totalWorkMinutes: number;
  nightWorkMinutes: number;
  overtimeMinutes: number;
  basicPay: number;
  totalAllowance: number;
  totalDeduction: number;
  netPay: number;
  details: MyPayrollDetailItem[];
}
