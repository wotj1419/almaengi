// 사장님 급여 목록 API 응답 (GET /stores/{storeId}/payrolls)
export interface StorePayrollEmployee {
  payrollId: number;
  employeeId: number;
  employeeName: string;
  position: string;
  totalWorkMinutes: number;
  basicPay: number;
  totalAllowance: number;
  totalDeduction: number;
  netPay: number;
  isApproved: boolean;
  isTransferred: boolean;
  transferredAt: string | null;
}

export interface StorePayrollSummary {
  targetMonth: string;
  totalLaborCost: number;
  totalGrossPay: number;
  totalDeduction: number;
  employeeCount: number;
  employees: StorePayrollEmployee[];
}

// FE 직원 카드용 타입 (API 데이터 + 하드코딩 필드)
export interface Payroll {
  payroll_id: number;
  employee_id: number;
  employee_name: string;
  target_month: string;
  total_work_minutes: number;
  night_work_minutes: number;
  overtime_minutes: number;
  basic_pay: number;
  total_allowance: number;
  total_deduction: number;
  net_pay: number;
  hourly_wage: number;
  is_approved: boolean;
  is_transferred: boolean;
  transferred_at: string | null;
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
  isTransferred: boolean;
  transferredAt: string | null;
  totalWorkMinutes: number;
  nightWorkMinutes: number;
  overtimeMinutes: number;
  basicPay: number;
  totalAllowance: number;
  totalDeduction: number;
  netPay: number;
  details: MyPayrollDetailItem[];
}
