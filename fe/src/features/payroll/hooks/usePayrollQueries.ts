import { useQuery } from '@tanstack/react-query';
import { fetchMyPayroll, fetchStorePayrolls } from '@/api/payroll';

export const payrollKeys = {
  storePayrolls: (storeId: number, targetMonth: string) =>
    ['payroll', 'store', storeId, targetMonth] as const,
  myPayroll: (storeId: number, targetMonth: string) =>
    ['payroll', 'my', storeId, targetMonth] as const,
};

export function useStorePayrolls(storeId: number | null, targetMonth: string) {
  return useQuery({
    queryKey: payrollKeys.storePayrolls(storeId ?? 0, targetMonth),
    queryFn: () => fetchStorePayrolls(storeId!, targetMonth),
    enabled: storeId != null,
  });
}

export function useMyPayroll(storeId: number | null, targetMonth: string) {
  return useQuery({
    queryKey: payrollKeys.myPayroll(storeId ?? 0, targetMonth),
    queryFn: () => fetchMyPayroll(storeId!, targetMonth),
    enabled: storeId != null,
  });
}
