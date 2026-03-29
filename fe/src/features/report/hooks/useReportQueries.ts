import { useQueries, useQuery } from '@tanstack/react-query';
import { getMonthlyAttendanceReport } from '@/api/attendance';
import { fetchAuctionInsightsReport } from '@/api/auction';
import { getPayrollSummary } from '@/api/payroll';

export const reportKeys = {
  payrollSummary: (storeId: number, targetMonth: string) =>
    ['report', 'payrollSummary', storeId, targetMonth] as const,
  attendanceMonthly: (storeId: number, targetMonth: string) =>
    ['report', 'attendanceMonthly', storeId, targetMonth] as const,
  auctionInsights: (storeId: number, targetMonth: string) =>
    ['report', 'auctionInsights', storeId, targetMonth] as const,
};

export function getLast6TargetMonths(year: number, month: number): string[] {
  const base = new Date(year, month - 1, 1);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

export function useReportPayrollSummary(
  storeId: number | null,
  targetMonth: string
) {
  return useQuery({
    queryKey: reportKeys.payrollSummary(storeId ?? 0, targetMonth),
    queryFn: () => getPayrollSummary(storeId as number, targetMonth),
    enabled: storeId != null,
  });
}

export function useReportAttendanceMonthly(
  storeId: number | null,
  targetMonth: string
) {
  return useQuery({
    queryKey: reportKeys.attendanceMonthly(storeId ?? 0, targetMonth),
    queryFn: () => getMonthlyAttendanceReport(storeId as number, targetMonth),
    enabled: storeId != null,
  });
}

export function useReportAuctionInsights(
  storeId: number | null,
  targetMonth: string,
  enabled = true
) {
  return useQuery({
    queryKey: reportKeys.auctionInsights(storeId ?? 0, targetMonth),
    queryFn: () => fetchAuctionInsightsReport(storeId as number, targetMonth, 0, 6),
    enabled: storeId != null && enabled,
  });
}

export function useReportPayrollTrend(
  storeId: number | null,
  year: number,
  month: number
) {
  const targetMonths = getLast6TargetMonths(year, month);

  const results = useQueries({
    queries: targetMonths.map((targetMonth) => ({
      queryKey: reportKeys.payrollSummary(storeId ?? 0, targetMonth),
      queryFn: () => getPayrollSummary(storeId as number, targetMonth),
      enabled: storeId != null,
    })),
  });

  return {
    targetMonths,
    summaries: results.map((r) => r.data ?? null),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}
