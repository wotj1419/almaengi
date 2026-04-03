import { useMemo, useState } from 'react';
import { Info, TriangleAlert, TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import useAuthStore from '@/stores/useAuthStore';
import MonthSelector from '../components/MonthSelector';
import SummaryCardList from '../components/SummaryCardList';
import AlertCard from '../components/AlertCard';
import MonthlyPayrollChart from '../components/MonthlyPayrollChart';
import PayrollDonutChart from '../components/PayrollDonutChart';
import EmployeeAttendanceStats from '../components/EmployeeAttendanceStats';
import {
  useEmployeePayroll,
  useEmployeePayrollTrend,
  useEmployeeAttendance,
  useMyEmployeeId,
} from '../hooks/useEmployeeReportQueries';
import {
  mapEmployeeSummaryCards,
  mapEmployeeAlerts,
  mapEmployeeMonthlyPayrollSeries,
  mapEmployeePayrollBreakdown,
  mapEmployeeAttendanceStats,
} from '../utils/employeeReportMapper';
import type { AlertCardData } from '../types';

const ICON_CONFIG: Record<
  AlertCardData['variant'],
  { icon: ReactNode; iconBg: string }
> = {
  green: {
    icon: (
      <TrendingDown
        size={20}
        color="var(--color-status-green-dot)"
        strokeWidth={2}
      />
    ),
    iconBg: 'var(--color-status-green-bg)',
  },
  orange: {
    icon: <TrendingUp size={20} color="var(--color-warning)" strokeWidth={2} />,
    iconBg: 'var(--color-status-orange-bg)',
  },
  blue: {
    icon: (
      <Info size={20} color="var(--color-status-blue-dot)" strokeWidth={2} />
    ),
    iconBg: 'var(--color-status-blue-bg)',
  },
};

export default function EmployeeReportPage() {
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const today = dayjs();
  const todayYear = today.year();
  const todayMonth = today.month() + 1;
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);

  const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
  const prevMonth =
    month === 1
      ? `${year - 1}-12`
      : `${year}-${String(month - 1).padStart(2, '0')}`;

  // ── 데이터 훅 ──────────────────────────────────────────
  const currentPayrollQuery = useEmployeePayroll(activeStoreId, targetMonth);
  const prevPayrollQuery = useEmployeePayroll(activeStoreId, prevMonth);
  const trendQuery = useEmployeePayrollTrend(activeStoreId, year, month);
  const attendanceQuery = useEmployeeAttendance(activeStoreId, targetMonth);
  const myEmployeeIdQuery = useMyEmployeeId(activeStoreId, userId);

  const currentPayroll = currentPayrollQuery.data ?? null;
  const prevPayroll = prevPayrollQuery.data ?? null;
  const myEmployeeId = myEmployeeIdQuery.data ?? null;

  // 근태 리포트에서 나의 데이터 필터링
  const myAttendance = useMemo(() => {
    if (!attendanceQuery.data || !myEmployeeId) return null;
    return (
      attendanceQuery.data.employees.find(
        (e) => e.employeeId === myEmployeeId
      ) ?? null
    );
  }, [attendanceQuery.data, myEmployeeId]);

  // ── 매핑 ───────────────────────────────────────────────
  const summaryCards = useMemo(() => {
    if (!currentPayroll) {
      return [
        { id: 'loading-1', title: '이번 달 인건비', mainValue: '-' },
        { id: 'loading-2', title: '지각 주의', mainValue: '-' },
      ];
    }
    return mapEmployeeSummaryCards(currentPayroll, prevPayroll, myAttendance);
  }, [currentPayroll, prevPayroll, myAttendance]);

  const alerts = useMemo(() => {
    if (!currentPayroll) return [];
    return mapEmployeeAlerts(currentPayroll, prevPayroll, myAttendance);
  }, [currentPayroll, prevPayroll, myAttendance]);

  const monthlyPayrollSeries = useMemo(
    () => mapEmployeeMonthlyPayrollSeries(trendQuery.payrolls),
    [trendQuery.payrolls]
  );

  const payrollBreakdown = useMemo(() => {
    if (!currentPayroll) return [];
    return mapEmployeePayrollBreakdown(currentPayroll, prevPayroll);
  }, [currentPayroll, prevPayroll]);

  const attendanceStats = useMemo(
    () => mapEmployeeAttendanceStats(myAttendance, currentPayroll),
    [myAttendance, currentPayroll]
  );

  // ── 로딩/에러 ──────────────────────────────────────────
  const isLoading =
    currentPayrollQuery.isLoading ||
    trendQuery.isLoading ||
    myEmployeeIdQuery.isLoading;

  const handlePrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const handleNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
      <div className="flex flex-col w-full max-w-[var(--max-w-app)] relative overflow-x-hidden">
        <DetailHeader title="나의 급여 리포트" />

        <MonthSelector
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          disableNext={year === todayYear && month === todayMonth}
        />

        {!activeStoreId ? (
          <div className="px-[var(--space-5)] pt-[var(--space-6)]">
            <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
              선택된 매장이 없어 리포트를 조회할 수 없습니다.
            </div>
          </div>
        ) : (
          <>
            <SummaryCardList cards={summaryCards} />

            <main className="flex-1 py-[var(--space-2)] pb-[var(--pb-content)]">
              {isLoading ? (
                <div className="px-[var(--space-5)]">
                  <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
                    리포트를 불러오는 중입니다.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-5)]">
                  {/* 알림 카드 */}
                  {alerts.map((alert) => {
                    const isLateAlert = alert.id === 'late-warn';
                    const { icon, iconBg } = isLateAlert
                      ? {
                          icon: (
                            <TriangleAlert
                              size={20}
                              color="var(--color-warning)"
                              strokeWidth={2}
                            />
                          ),
                          iconBg: 'var(--color-status-orange-bg)',
                        }
                      : ICON_CONFIG[alert.variant];
                    return (
                      <AlertCard
                        key={alert.id}
                        icon={icon}
                        iconBg={iconBg}
                        title={alert.title}
                        description={alert.description}
                      />
                    );
                  })}

                  {/* 월별 급여 차트 */}
                  <MonthlyPayrollChart
                    year={year}
                    month={month}
                    monthlyPayroll={monthlyPayrollSeries}
                  />

                  {/* 근태 통계 */}
                  <EmployeeAttendanceStats stats={attendanceStats} />

                  {/* 수당 항목별 도넛 차트 */}
                  <PayrollDonutChart breakdown={payrollBreakdown} />
                </div>
              )}
            </main>
          </>
        )}

        <BottomNav activeTab="payroll" />
      </div>
    </div>
  );
}
