import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { getApiErrorMessage } from '@/api/error';
import useAuthStore from '@/stores/useAuthStore';
import MonthSelector from '../components/MonthSelector';
import SummaryCardList from '../components/SummaryCardList';
import ReportTabBar, { type ReportTab } from '../components/ReportTabBar';
import PayrollStatusTab from '../components/PayrollStatusTab';
import StaffComparisonTab from '../components/StaffComparisonTab';
import AuctionInsightTab from '../components/AuctionInsightTab';
import {
  useReportAttendanceMonthly,
  useReportAuctionInsights,
  useReportPayrollSummary,
  useReportPayrollTrend,
} from '../hooks/useReportQueries';
import {
  mapAttendanceRecords,
  mapAuctionInsightsAlerts,
  mapAuctionSummary,
  mapMonthlyHighlights,
  mapMonthlyPayrollSeries,
  mapPayrollAlerts,
  mapPayrollBreakdown,
  mapPayrollRanking,
  mapPeakTimes,
  mapStaffAlerts,
  mapSummaryCards,
} from '../utils/reportMapper';

export default function ReportPage() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  const today = dayjs();
  const todayYear = today.year();
  const todayMonth = today.month() + 1;
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [activeTab, setActiveTab] = useState<ReportTab>('payroll');

  const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
  const isCurrentMonth = year === todayYear && month === todayMonth;

  const payrollSummaryQuery = useReportPayrollSummary(activeStoreId, targetMonth);
  const attendanceMonthlyQuery = useReportAttendanceMonthly(
    activeStoreId,
    targetMonth
  );
  const payrollTrendQuery = useReportPayrollTrend(activeStoreId, year, month);
  const auctionInsightsQuery = useReportAuctionInsights(
    activeStoreId,
    targetMonth,
    !isCurrentMonth
  );

  const payrollSummary = payrollSummaryQuery.data;
  const attendanceMonthly = attendanceMonthlyQuery.data;
  const auctionInsights = isCurrentMonth ? null : (auctionInsightsQuery.data ?? null);

  const summaryCards = useMemo(() => {
    if (!payrollSummary || !attendanceMonthly) {
      return [
        {
          id: 'loading-1',
          title: '이번 달 인건비',
          mainValue: '-',
        },
        {
          id: 'loading-2',
          title: '지각 주의',
          mainValue: '-',
        },
        {
          id: 'loading-3',
          title: '경매 낙찰률',
          mainValue: '-',
          subText: isCurrentMonth ? '전월부터 확인 가능' : '데이터 로딩 중',
          subTextVariant: 'info' as const,
        },
      ];
    }

    return mapSummaryCards(payrollSummary, attendanceMonthly, auctionInsights);
  }, [payrollSummary, attendanceMonthly, auctionInsights, isCurrentMonth]);

  const payrollAlerts = useMemo(() => {
    if (!payrollSummary || !attendanceMonthly) return [];
    return mapPayrollAlerts(payrollSummary, attendanceMonthly);
  }, [payrollSummary, attendanceMonthly]);

  const monthlyPayrollSeries = useMemo(
    () => mapMonthlyPayrollSeries(payrollTrendQuery.summaries),
    [payrollTrendQuery.summaries]
  );

  const payrollBreakdown = useMemo(() => {
    if (!payrollSummary) return [];
    return mapPayrollBreakdown(payrollSummary);
  }, [payrollSummary]);

  const staffAlerts = useMemo(() => {
    if (!attendanceMonthly) return [];
    return mapStaffAlerts(attendanceMonthly);
  }, [attendanceMonthly]);

  const monthlyHighlights = useMemo(() => {
    if (!payrollSummary || !attendanceMonthly) return [];
    return mapMonthlyHighlights(payrollSummary, attendanceMonthly);
  }, [payrollSummary, attendanceMonthly]);

  const attendanceRecords = useMemo(() => {
    if (!attendanceMonthly) return [];
    return mapAttendanceRecords(attendanceMonthly);
  }, [attendanceMonthly]);

  const payrollRanking = useMemo(() => {
    if (!payrollSummary) return [];
    return mapPayrollRanking(payrollSummary);
  }, [payrollSummary]);

  const auctionAlerts = useMemo(
    () => mapAuctionInsightsAlerts(auctionInsights),
    [auctionInsights]
  );
  const auctionSummary = useMemo(
    () => mapAuctionSummary(auctionInsights),
    [auctionInsights]
  );
  const peakTimes = useMemo(() => mapPeakTimes(auctionInsights), [auctionInsights]);

  const isCoreLoading =
    payrollSummaryQuery.isLoading || attendanceMonthlyQuery.isLoading;

  const isPayrollTabLoading = isCoreLoading || payrollTrendQuery.isLoading;
  const isAuctionTabLoading = isCurrentMonth ? false : auctionInsightsQuery.isLoading;

  const payrollErrorMessage =
    payrollSummaryQuery.error || attendanceMonthlyQuery.error || payrollTrendQuery.isError
      ? getApiErrorMessage(
          payrollSummaryQuery.error ?? attendanceMonthlyQuery.error,
          '급여 리포트를 불러오지 못했습니다.'
        )
      : null;

  const staffErrorMessage =
    payrollSummaryQuery.error || attendanceMonthlyQuery.error
      ? getApiErrorMessage(
          payrollSummaryQuery.error ?? attendanceMonthlyQuery.error,
          '직원 비교 리포트를 불러오지 못했습니다.'
        )
      : null;

  const auctionErrorMessage =
    !isCurrentMonth && auctionInsightsQuery.error
      ? getApiErrorMessage(
          auctionInsightsQuery.error,
          '경매 인사이트를 불러오지 못했습니다.'
        )
      : null;

  const handlePrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
      <div className="flex flex-col w-full max-w-[var(--max-w-app)] relative overflow-x-hidden">
        <DetailHeader title="급여 및 근태 리포트" />
        <MonthSelector
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          disableNext={year === todayYear && month === todayMonth}
        />
        {!activeStoreId ? (
          <div className="px-[var(--space-5)] pt-[var(--space-6)] pb-[var(--space-2)]">
            <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
              선택된 매장이 없어 리포트를 조회할 수 없습니다.
            </div>
          </div>
        ) : (
          <SummaryCardList cards={summaryCards} />
        )}
        <ReportTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 py-[var(--space-2)] pb-[var(--pb-content)]">
          {!activeStoreId ? (
            <div className="px-[var(--space-5)]">
              <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
                선택된 매장이 없어 상세 리포트를 조회할 수 없습니다.
              </div>
            </div>
          ) : (
            activeTab === 'payroll' &&
            (isPayrollTabLoading ? (
              <div className="px-[var(--space-5)]">
                <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
                  급여 리포트를 불러오는 중입니다.
                </div>
              </div>
            ) : payrollErrorMessage ? (
              <div className="px-[var(--space-5)]">
                <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-danger)]">
                  {payrollErrorMessage}
                </div>
              </div>
            ) : (
              <PayrollStatusTab
                year={year}
                month={month}
                alerts={payrollAlerts}
                monthlyPayroll={monthlyPayrollSeries}
                breakdown={payrollBreakdown}
              />
            ))
          )}

          {activeStoreId &&
            activeTab === 'staff' &&
            (isCoreLoading ? (
              <div className="px-[var(--space-5)]">
                <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
                  직원 비교 리포트를 불러오는 중입니다.
                </div>
              </div>
            ) : staffErrorMessage ? (
              <div className="px-[var(--space-5)]">
                <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-danger)]">
                  {staffErrorMessage}
                </div>
              </div>
            ) : (
              <StaffComparisonTab
                alerts={staffAlerts}
                highlights={monthlyHighlights}
                attendanceRecords={attendanceRecords}
                payrollRanking={payrollRanking}
              />
            ))}

          {activeStoreId &&
            activeTab === 'auction' &&
            (isAuctionTabLoading ? (
              <div className="px-[var(--space-5)]">
                <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
                  경매 인사이트를 불러오는 중입니다.
                </div>
              </div>
            ) : auctionErrorMessage ? (
              <div className="px-[var(--space-5)]">
                <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-6)] text-[length:var(--text-sm)] text-[color:var(--color-danger)]">
                  {auctionErrorMessage}
                </div>
              </div>
            ) : (
              <AuctionInsightTab
                insights={auctionAlerts}
                summary={auctionSummary}
                peakTimes={peakTimes}
                isCurrentMonth={isCurrentMonth}
              />
            ))}
        </main>
        <BottomNav activeTab="payroll" />
      </div>
    </div>
  );
}
