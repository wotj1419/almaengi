// ─── 사장님 급여 관리 (오너 전용) ───────────────────────────────────────────
// PayrollPage에서 직원 목록 급여 카드에 사용되는 타입
// 백엔드 snake_case 그대로 사용 (변환 없음)
export interface Payroll {
  payroll_id: number; // 급여 레코드 고유 ID
  employee_id: number; // 직원 ID
  employee_name: string; // 직원 이름
  target_month: string; // 급여 대상 월 (YYYY-MM-DD 형식, 항상 1일)
  total_work_minutes: number; // 해당 월 총 근무 시간 (분 단위)
  night_work_minutes: number; // 야간 근무 시간 (분 단위, 22:00~06:00)
  basic_pay: number; // 기본급 (원)
  total_allowance: number; // 총 수당 합계 (원)
  total_deduction: number; // 총 공제 합계 (원)
  net_pay: number; // 실수령액 = 기본급 + 수당 - 공제 (원)
  hourly_wage: number; // 시급 (원)
  is_approved: boolean; // 사장님 급여 승인 여부
  approved_at: string | null; // 승인 시각 (미승인 시 null)
  created_at: string; // 급여 레코드 생성 시각
  updated_at: string; // 급여 레코드 최종 수정 시각
}

// ─── 알바생 내 급여 조회 (PayrollResponseDto.MyPayroll) ───────────────────
// EmployeePayrollPage에서 로그인한 알바생 본인의 급여를 조회할 때 사용
// 백엔드 camelCase 그대로 사용 (Jackson 기본 직렬화 방식)

/**
 * 급여 상세 항목 한 줄 (PayrollResponseDto.DetailItem 대응)
 *
 * detailType에 따라 세 가지 섹션으로 분류됨:
 *  - BASE      : 기본급 (시급 × 근무시간)
 *  - ALLOWANCE : 수당 (야간수당, 주휴수당 등)
 *  - DEDUCTION : 공제 (국민연금, 건강보험, 고용보험 등)
 *  - OTHER     : 기타 항목
 */
export interface MyPayrollDetailItem {
  detailId: number; // 상세 항목 고유 ID
  detailType: 'BASE' | 'ALLOWANCE' | 'DEDUCTION' | 'OTHER'; // 항목 분류
  itemName: string; // 항목명 (예: '기본급', '야간 수당')
  amount: number; // 금액 (원, 공제는 양수로 저장)
  calculationFormula: string | null; // 계산식 설명 (예: '9,860원 × 84시간'), 없으면 null
  workMinutes: number | null; // 해당 항목 관련 근무 시간(분), 무관하면 null
}

/**
 * 알바생 월별 급여 전체 데이터 (PayrollResponseDto.MyPayroll 대응)
 *
 * API: GET /api/v1/stores/{storeId}/payrolls/me?targetMonth=YYYY-MM
 * - payrollId가 null이면 해당 월 급여가 아직 생성되지 않은 상태
 * - isEstimated=true : 월 마감 전 실시간 조회 급여
 * - isEstimated=false: 월 마감 후 확정 급여
 * - isApproved=true  : 사장님이 급여 내역을 승인한 상태
 */
export interface MyPayrollData {
  payrollId: number | null; // 급여 ID (급여 미생성 시 null → 빈 상태 표시)
  targetMonth: string; // 조회 대상 월 (YYYY-MM 형식)
  isEstimated: boolean; // true: 실시간 조회, false: 확정 급여
  isApproved: boolean; // true: 승인 완료, false: 승인 대기
  totalWorkMinutes: number; // 해당 월 총 근무 시간 (분)
  nightWorkMinutes: number; // 야간 근무 시간 (분, 0이면 야간 근무 없음)
  basicPay: number; // 기본급 합계 (원)
  totalAllowance: number; // 수당 합계 (원)
  totalDeduction: number; // 공제 합계 (원)
  netPay: number; // 실수령액 = 기본급 + 수당 - 공제 (원)
  details: MyPayrollDetailItem[]; // 급여 구성 항목 목록 (BASE / ALLOWANCE / DEDUCTION 혼합)
}
