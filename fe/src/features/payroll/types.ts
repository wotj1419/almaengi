export interface Payroll {
  payroll_id: number;
  employee_id: number;
  employee_name: string;
  target_month: string; // 'YYYY-MM-DD' (해당 월의 1일)
  total_work_minutes: number;
  night_work_minutes: number;
  basic_pay: number;
  total_allowance: number;
  total_deduction: number;
  net_pay: number;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}
