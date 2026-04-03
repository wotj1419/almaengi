import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchMyPayroll } from '@/api/payroll';
import { getMonthlyAttendanceReport } from '@/api/attendance';
import { getEmployees } from '@/api/store';
import { getLast6TargetMonths } from './useReportQueries';

const employeeReportKeys = {
  myPayroll: (storeId: number, targetMonth: string) =>
    ['employeeReport', 'myPayroll', storeId, targetMonth] as const,
  attendance: (storeId: number, targetMonth: string) =>
    ['employeeReport', 'attendance', storeId, targetMonth] as const,
  employees: (storeId: number) =>
    ['employeeReport', 'employees', storeId] as const,
};

export function useEmployeePayroll(
  storeId: number | null,
  targetMonth: string
) {
  return useQuery({
    queryKey: employeeReportKeys.myPayroll(storeId ?? 0, targetMonth),
    queryFn: () => fetchMyPayroll(storeId as number, targetMonth),
    enabled: storeId != null,
  });
}

export function useEmployeePayrollTrend(
  storeId: number | null,
  year: number,
  month: number
) {
  const targetMonths = getLast6TargetMonths(year, month);

  const results = useQueries({
    queries: targetMonths.map((tm) => ({
      queryKey: employeeReportKeys.myPayroll(storeId ?? 0, tm),
      queryFn: () => fetchMyPayroll(storeId as number, tm),
      enabled: storeId != null,
    })),
  });

  return {
    targetMonths,
    payrolls: results.map((r) => r.data ?? null),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}

export function useEmployeeAttendance(
  storeId: number | null,
  targetMonth: string
) {
  return useQuery({
    queryKey: employeeReportKeys.attendance(storeId ?? 0, targetMonth),
    queryFn: () => getMonthlyAttendanceReport(storeId as number, targetMonth),
    enabled: storeId != null,
  });
}

export function useMyEmployeeId(storeId: number | null, userId: number | null) {
  return useQuery({
    queryKey: employeeReportKeys.employees(storeId ?? 0),
    queryFn: async () => {
      const employees = await getEmployees(storeId as number);
      return employees.find((e) => e.userId === userId)?.employeeId ?? null;
    },
    enabled: storeId != null && userId != null,
  });
}
