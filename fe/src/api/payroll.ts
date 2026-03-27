import instance from './instance';
import type { ApiResponse } from './auction.types';
import type { MyPayrollData } from '@/features/payroll/types';

export interface PayrollSummary {
  targetMonth: string;
  thisMonthTotal: number;
  lastMonthTotal: number;
  changeRate: number;
  changeDirection: string;
  employeeCount: number;
}

export async function getPayrollSummary(
  storeId: number
): Promise<PayrollSummary> {
  const targetMonth = new Date().toISOString().slice(0, 7); // "2026-03"
  const { data } = await instance.get<ApiResponse<PayrollSummary>>(
    `/api/v1/stores/${storeId}/payrolls/summary`,
    { params: { targetMonth } }
  );
  return data.data;
}

/**
 * 알바생 본인 급여 조회 API
 *
 * [엔드포인트]
 *   GET /api/v1/stores/{storeId}/payrolls/me?targetMonth=YYYY-MM
 *
 * [응답 구조]
 *   ApiResponse<MyPayrollData>
 *   └─ data.data → MyPayrollData (실제 급여 데이터)
 *
 * [파라미터]
 * @param storeId     - 조회할 매장 ID (useAuthStore의 activeStoreId)
 * @param targetMonth - 조회 월 (YYYY-MM 형식, 생략 시 서버에서 현재 월로 처리)
 *
 * [주의]
 * - payrollId가 null이면 해당 월 급여가 아직 생성되지 않은 것
 * - targetMonth를 생략하면 서버 기준 현재 월을 반환
 */
export async function fetchMyPayroll(
  storeId: number,
  targetMonth?: string
): Promise<MyPayrollData> {
  // targetMonth가 있을 때만 쿼리 파라미터로 전달
  const params = targetMonth ? { targetMonth } : {};

  const { data } = await instance.get<ApiResponse<MyPayrollData>>(
    `/api/v1/stores/${storeId}/payrolls/me`,
    { params }
  );

  // ApiResponse 래퍼에서 실제 데이터만 추출하여 반환
  return data.data;
}
