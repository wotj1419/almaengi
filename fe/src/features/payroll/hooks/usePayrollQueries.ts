import { useQuery } from '@tanstack/react-query';
import { fetchMyPayroll } from '@/api/payroll';

// ─── 쿼리 키 팩토리 ──────────────────────────────────────────────────────────
// React Query 캐시를 storeId + targetMonth 조합으로 구분
// 월을 변경하거나 매장이 바뀔 때 자동으로 별도 캐시 엔트리가 생성됨
export const payrollKeys = {
  myPayroll: (storeId: number, targetMonth: string) =>
    ['payroll', 'my', storeId, targetMonth] as const,
};

/**
 * 알바생 본인 급여 조회 훅
 *
 * [호출 API]
 *   GET /api/v1/stores/{storeId}/payrolls/me?targetMonth=YYYY-MM
 *
 * [동작]
 * - storeId가 null이면 쿼리를 실행하지 않음 (로그인 전 / 매장 미선택 상태 대응)
 * - targetMonth가 바뀌면 자동으로 새 API 요청을 보냄 (월 네비게이션 연동)
 * - 같은 storeId + targetMonth 조합은 캐시에서 즉시 반환
 *
 * @param storeId     - 매장 ID (null이면 쿼리 비활성화)
 * @param targetMonth - 조회 월 (YYYY-MM 형식)
 * @returns useQuery 결과 ({ data, isLoading, error, ... })
 */
export function useMyPayroll(storeId: number | null, targetMonth: string) {
  return useQuery({
    queryKey: payrollKeys.myPayroll(storeId ?? 0, targetMonth),
    queryFn: () => fetchMyPayroll(storeId!, targetMonth),
    // storeId가 없으면 API 호출 자체를 막음 (storeId! 비null 단언 안전하게 사용)
    enabled: storeId != null,
  });
}
