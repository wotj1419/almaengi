import type { MonthlyAttendanceReport } from '@/api/attendance';
import type { AuctionInsightsReportDto } from '@/api/auction.types';
import type { PayrollSummary } from '@/api/payroll';
import type {
  AlertCardData,
  AttendanceRecord,
  AuctionInsightItem,
  AuctionSummaryItem,
  MonthlyBarData,
  MonthlyHighlightItem,
  PeakTimeItem,
  PayrollBreakdownItem,
  PayrollRankingItem,
  SummaryCard,
} from '../types';

function toManwon(amount: number): number {
  return Math.round(amount / 10000);
}

function formatManwon(amount: number): string {
  return `${toManwon(amount).toLocaleString('ko-KR')}만원`;
}

function formatWon(amount: number): string {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

function calcPercentChange(current: number, previous: number): number | undefined {
  if (current === previous) return 0;
  if (previous <= 0) return undefined;
  const value = ((current - previous) / previous) * 100;
  return Math.round(value);
}

function dayLabel(day: string): string {
  const map: Record<string, string> = {
    MON: '월요일',
    TUE: '화요일',
    WED: '수요일',
    THU: '목요일',
    FRI: '금요일',
    SAT: '토요일',
    SUN: '일요일',
  };
  return map[day] ?? day;
}

function timeText(time: string): string {
  return time.slice(0, 5);
}

function getLateChampionCount(attendance: MonthlyAttendanceReport): number {
  const championIds = new Set(attendance.lateChampions.map((c) => c.employeeId));
  if (championIds.size === 0) return 0;
  return attendance.employees
    .filter((e) => championIds.has(e.employeeId))
    .reduce((max, e) => Math.max(max, e.lateCount), 0);
}

export function mapSummaryCards(
  payroll: PayrollSummary,
  attendance: MonthlyAttendanceReport,
  auction: AuctionInsightsReportDto | null
): SummaryCard[] {
  const lateChampionName = attendance.lateChampions[0]?.employeeName ?? '없음';
  const lateChampionCount = getLateChampionCount(attendance);
  const successRate = auction ? Number(auction.successRate ?? 0) : 0;

  return [
    {
      id: 'labor-cost',
      title: '이번 달 인건비',
      mainValue: formatManwon(payroll.thisMonthTotal),
      trend:
        payroll.changeRate == null ? undefined : `${Math.abs(payroll.changeRate)}%`,
      trendType:
        payroll.changeDirection === 'UP'
          ? 'positive'
          : payroll.changeDirection === 'DOWN'
            ? 'negative'
            : 'neutral',
    },
    {
      id: 'late',
      title: '지각 주의',
      mainValue: lateChampionName,
      subText:
        lateChampionCount > 0
          ? `${lateChampionCount}회 누적`
          : '이번 달 지각 없음',
    },
    {
      id: 'auction',
      title: '경매 낙찰률',
      mainValue: auction ? `${successRate.toFixed(1)}%` : '-',
      subText: auction ? `총 ${auction.totalAuctionCount}건` : '전월부터 확인 가능',
      subTextVariant: 'info',
    },
  ];
}

export function mapPayrollAlerts(
  payroll: PayrollSummary,
  attendance: MonthlyAttendanceReport
): AlertCardData[] {
  const laborAlertDescription =
    payroll.changeRate == null
      ? '지난달 비교 데이터가 없어 인건비 추이를 계산할 수 없습니다.'
      : payroll.changeDirection === 'UP'
        ? `인건비가 전월 대비 ${Math.abs(payroll.changeRate)}% 상승했습니다.\n근무 배치와 수당 정책을 점검해보세요.`
        : payroll.changeDirection === 'DOWN'
          ? `인건비가 전월 대비 ${Math.abs(payroll.changeRate)}% 감소했습니다.\n운영 효율이 개선되고 있습니다.`
          : '전월 대비 인건비 변동이 없습니다.\n현재 운영 수준이 안정적으로 유지되고 있습니다.';

  const lateChampionName = attendance.lateChampions[0]?.employeeName;
  const lateChampionCount = getLateChampionCount(attendance);

  return [
    {
      id: 'labor-cost-alert',
      title: '인건비 변화 알림',
      description: laborAlertDescription,
      variant: 'green',
    },
    lateChampionName
      ? {
          id: 'late-alert',
          title: '지각 주의보',
          description: `${lateChampionName}님 지각이 ${lateChampionCount}회로 가장 높습니다.\n근무 시작 전 리마인드 공지를 권장합니다.`,
          variant: 'orange',
        }
      : {
          id: 'late-alert',
          title: '근태 안정',
          description: '이번 달 지각왕이 없습니다.\n현재 근태 관리 상태가 안정적입니다.',
          variant: 'blue',
        },
  ];
}

export function mapMonthlyPayrollSeries(summaries: (PayrollSummary | null)[]): MonthlyBarData[] {
  return summaries.map((summary) => ({
    value: toManwon(summary?.thisMonthTotal ?? 0),
  }));
}

export function mapPayrollBreakdown(payroll: PayrollSummary): PayrollBreakdownItem[] {
  return [
    {
      id: 'basic',
      label: '기본급',
      amount: payroll.thisMonthBasicPay,
      color: 'var(--color-primary)',
      changePercent: calcPercentChange(
        payroll.thisMonthBasicPay,
        payroll.lastMonthBasicPay
      ),
    },
    {
      id: 'holiday',
      label: '주휴수당',
      amount: payroll.thisMonthWeeklyHolidayPay,
      color: 'var(--color-warning)',
      changePercent: calcPercentChange(
        payroll.thisMonthWeeklyHolidayPay,
        payroll.lastMonthWeeklyHolidayPay
      ),
    },
    {
      id: 'overtime',
      label: '연장근무',
      amount: payroll.thisMonthOvertimePay,
      color: 'var(--color-action-schedule)',
      changePercent: calcPercentChange(
        payroll.thisMonthOvertimePay,
        payroll.lastMonthOvertimePay
      ),
    },
    {
      id: 'night',
      label: '야간수당',
      amount: payroll.thisMonthNightPay,
      color: 'var(--color-status-purple-bg)',
      changePercent: calcPercentChange(
        payroll.thisMonthNightPay,
        payroll.lastMonthNightPay
      ),
    },
  ];
}

export function mapStaffAlerts(attendance: MonthlyAttendanceReport): AlertCardData[] {
  const lateChampionName = attendance.lateChampions[0]?.employeeName;
  const lateChampionCount = getLateChampionCount(attendance);
  const diligentNames = attendance.diligentEmployees
    .slice(0, 3)
    .map((d) => d.employeeName)
    .join(', ');

  const alerts: AlertCardData[] = [];

  if (lateChampionName) {
    alerts.push({
      id: 'late-staff',
      title: `${lateChampionName}님 지각 ${lateChampionCount}회`,
      description: '최근 30일 내 지각 횟수가 누적되었습니다.',
      variant: 'orange',
    });
  }

  if (diligentNames.length > 0) {
    alerts.push({
      id: 'diligent-staff',
      title: `성실왕: ${diligentNames}`,
      description: '결근 없이 안정적으로 근무 중입니다.',
      variant: 'blue',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'empty-staff',
      title: '근태 데이터 없음',
      description: '선택한 달의 근태 데이터가 없습니다.',
      variant: 'blue',
    });
  }

  return alerts;
}

export function mapMonthlyHighlights(
  payroll: PayrollSummary,
  attendance: MonthlyAttendanceReport
): MonthlyHighlightItem[] {
  return [
    {
      id: 'top-salary',
      category: '최고 급여',
      name: payroll.topEarners[0]?.employeeName ?? '없음',
      bgColor: 'var(--color-primary)',
      iconColor: 'var(--color-highlight-payroll-icon)',
      iconType: 'payroll',
    },
    {
      id: 'best-attendance',
      category: '성실왕',
      name: attendance.diligentEmployees[0]?.employeeName ?? '없음',
      bgColor: 'var(--color-highlight-attendance-bg)',
      iconColor: 'var(--color-highlight-attendance-icon)',
      iconType: 'attendance',
    },
    {
      id: 'most-late',
      category: '지각왕',
      name: attendance.lateChampions[0]?.employeeName ?? '없음',
      bgColor: 'var(--color-highlight-late-bg)',
      iconColor: 'var(--color-highlight-late-icon)',
      iconType: 'late',
    },
  ];
}

export function mapAttendanceRecords(
  attendance: MonthlyAttendanceReport
): AttendanceRecord[] {
  return attendance.employees.map((employee) => ({
    id: String(employee.employeeId),
    name: employee.employeeName,
    attendance: employee.attendanceCount,
    late: employee.lateCount,
    absent: employee.absentCount,
    hours: Math.round(employee.totalWorkMinutes / 60),
    isWarning: employee.lateCount >= 3 || employee.absentCount >= 1,
  }));
}

export function mapPayrollRanking(payroll: PayrollSummary): PayrollRankingItem[] {
  return payroll.employees
    .map((employee, index) => ({
      id: String(employee.employeeId),
      rank: index + 1,
      name: employee.employeeName,
      amount: employee.netPay,
    }))
    .slice(0, 6);
}

export function mapAuctionInsightsAlerts(
  auction: AuctionInsightsReportDto | null
): AuctionInsightItem[] {
  if (!auction) {
    return [
      {
        id: 'auction-empty',
        title: '경매 인사이트 없음',
        description: '선택한 조건의 경매 데이터가 없습니다.',
        variant: 'purple',
      },
    ];
  }

  const topTimeline = auction.timelinePage.content[0];

  return [
    {
      id: 'peak-time',
      title: topTimeline
        ? `${dayLabel(topTimeline.dayOfWeek)} ${timeText(topTimeline.startTime)} 피크`
        : '피크타임 데이터 없음',
      description: topTimeline
        ? `${timeText(topTimeline.startTime)}~${timeText(topTimeline.endTime)} 구간 입찰이 가장 활발합니다.`
        : '최근 경매 타임라인 데이터가 없습니다.',
      variant: 'orange',
    },
    {
      id: 'avg-wage',
      title: '평균 낙찰 시급',
      description: `해당 월 평균 낙찰 시급은 ${formatWon(auction.averageWinningWage)}입니다.`,
      variant: 'purple',
    },
  ];
}

export function mapAuctionSummary(
  auction: AuctionInsightsReportDto | null
): AuctionSummaryItem[] {
  if (!auction) {
    return [
      {
        id: 'monthly-count',
        label: '월간 건수',
        value: '-건',
        bgColor: 'var(--color-primary)',
        labelColor: 'var(--color-icon-dark)',
        valueColor: 'var(--color-icon-dark)',
      },
      {
        id: 'winning-rate',
        label: '낙찰률',
        value: '-%',
        bgColor: 'var(--color-highlight-attendance-bg)',
        labelColor: 'var(--color-highlight-attendance-label)',
        valueColor: 'var(--color-highlight-attendance-icon)',
      },
      {
        id: 'avg-wage',
        label: '평균 시급',
        value: '-원',
        bgColor: 'var(--color-highlight-late-bg)',
        labelColor: 'var(--color-highlight-late-label)',
        valueColor: 'var(--color-highlight-late-icon)',
      },
    ];
  }

  return [
    {
      id: 'monthly-count',
      label: '월간 건수',
      value: `${auction.totalAuctionCount}건`,
      bgColor: 'var(--color-primary)',
      labelColor: 'var(--color-icon-dark)',
      valueColor: 'var(--color-icon-dark)',
    },
    {
      id: 'winning-rate',
      label: '낙찰률',
      value: `${Number(auction.successRate ?? 0).toFixed(1)}%`,
      bgColor: 'var(--color-highlight-attendance-bg)',
      labelColor: 'var(--color-highlight-attendance-label)',
      valueColor: 'var(--color-highlight-attendance-icon)',
    },
    {
      id: 'avg-wage',
      label: '평균 시급',
      value: formatWon(auction.averageWinningWage),
      bgColor: 'var(--color-highlight-late-bg)',
      labelColor: 'var(--color-highlight-late-label)',
      valueColor: 'var(--color-highlight-late-icon)',
    },
  ];
}

export function mapPeakTimes(auction: AuctionInsightsReportDto | null): PeakTimeItem[] {
  if (!auction) return [];

  return auction.timelinePage.content.slice(0, 6).map((item, index) => {
    const isTop3 = index < 3;

    return {
      id: `${item.dayOfWeek}-${item.startTime}-${item.endTime}`,
      rank: index + 1,
      timeRange: `${dayLabel(item.dayOfWeek)} ${timeText(item.startTime)} - ${timeText(item.endTime)}`,
      description: `${dayLabel(item.dayOfWeek)} 인기 시간대`,
      count: item.auctionCount,
      barColor: isTop3
        ? 'var(--color-warning)'
        : index < 5
          ? 'var(--color-action-schedule)'
          : 'var(--color-primary)',
      badgeBg: isTop3
        ? 'var(--color-status-orange-bg)'
        : index < 5
          ? 'var(--color-attendance-bg)'
          : 'var(--color-status-green-bg)',
      badgeTextColor: isTop3
        ? 'var(--color-warning)'
        : index < 5
          ? 'var(--color-action-schedule)'
          : 'var(--color-status-badge-green-text)',
    };
  });
}
