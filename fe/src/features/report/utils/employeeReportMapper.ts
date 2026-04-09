import type { MonthlyAttendanceEmployeeSummary } from '@/api/attendance';
import type { MyPayrollData } from '@/features/payroll/types';
import type {
  AlertCardData,
  MonthlyBarData,
  PayrollBreakdownItem,
  SummaryCard,
} from '../types';

function toManwon(amount: number): number {
  return Math.round(amount / 10000);
}

function formatManwon(amount: number): string {
  return `${toManwon(amount).toLocaleString('ko-KR')}만원`;
}

function calcPercentChange(
  current: number,
  previous: number
): number | undefined {
  if (current === previous) return 0;
  if (previous <= 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

// ── 급여 변동 원인 분석 ────────────────────────────────────

function getDetailAmount(payroll: MyPayrollData, keyword: string): number {
  return payroll.details.find((d) => d.itemName.includes(keyword))?.amount ?? 0;
}

function buildPayChangeDescription(
  current: MyPayrollData,
  previous: MyPayrollData
): string {
  // 각 항목별 변동폭 계산
  const diffs: { label: string; diff: number; absDiff: number }[] = [
    {
      label: '기본급',
      diff: current.basicPay - previous.basicPay,
      absDiff: Math.abs(current.basicPay - previous.basicPay),
    },
    {
      label: '연장 근무 수당',
      diff:
        getDetailAmount(current, '연장') - getDetailAmount(previous, '연장'),
      absDiff: Math.abs(
        getDetailAmount(current, '연장') - getDetailAmount(previous, '연장')
      ),
    },
    {
      label: '야간 근무 수당',
      diff:
        getDetailAmount(current, '야간') - getDetailAmount(previous, '야간'),
      absDiff: Math.abs(
        getDetailAmount(current, '야간') - getDetailAmount(previous, '야간')
      ),
    },
    {
      label: '주휴수당',
      diff:
        getDetailAmount(current, '주휴') - getDetailAmount(previous, '주휴'),
      absDiff: Math.abs(
        getDetailAmount(current, '주휴') - getDetailAmount(previous, '주휴')
      ),
    },
  ];

  // 변동이 가장 큰 항목
  const top = diffs
    .filter((d) => d.absDiff > 0)
    .sort((a, b) => b.absDiff - a.absDiff)[0];

  if (!top) return '근무 일수나 수당 변동을 아래에서 확인해보세요.';

  const direction = top.diff > 0 ? '늘었어요' : '줄었어요';
  return `${top.label}이 전월 대비 ${Math.round(top.absDiff).toLocaleString('ko-KR')}원 ${direction}.`;
}

// ── 요약 카드 ──────────────────────────────────────────────

export function mapEmployeeSummaryCards(
  current: MyPayrollData,
  previous: MyPayrollData | null,
  attendance: MonthlyAttendanceEmployeeSummary | null
): SummaryCard[] {
  const payChange = previous
    ? calcPercentChange(current.netPay, previous.netPay)
    : undefined;

  const lateCount = attendance?.lateCount ?? 0;

  return [
    {
      id: 'my-pay',
      title: '이번 달 인건비',
      mainValue: formatManwon(current.netPay),
      trend: payChange != null ? `${Math.abs(payChange)}%` : undefined,
      trendType:
        payChange == null
          ? undefined
          : payChange > 0
            ? 'negative'
            : payChange < 0
              ? 'positive'
              : 'neutral',
    },
    {
      id: 'my-late',
      title: '지각 주의',
      mainValue: `${lateCount}회`,
      subText: lateCount > 0 ? '이번 달 누적' : '이번 달 지각 없음',
      subTextVariant: lateCount >= 3 ? 'warning' : 'info',
    },
  ];
}

// ── 알림 카드 ──────────────────────────────────────────────

export function mapEmployeeAlerts(
  current: MyPayrollData,
  previous: MyPayrollData | null,
  attendance: MonthlyAttendanceEmployeeSummary | null
): AlertCardData[] {
  const alerts: AlertCardData[] = [];

  const payChange = previous
    ? calcPercentChange(current.netPay, previous.netPay)
    : undefined;

  if (payChange != null && payChange !== 0) {
    const direction = payChange > 0 ? '증가' : '감소';
    alerts.push({
      id: 'pay-change',
      title: `전월 대비 급여 ${Math.abs(payChange)}% ${direction}`,
      description: buildPayChangeDescription(current, previous!),
      variant: payChange > 0 ? 'orange' : 'green',
    });
  } else if (payChange == null && !previous) {
    alerts.push({
      id: 'pay-change',
      title: '전월 비교 데이터 없음',
      description: '지난달 급여 데이터가 없어 비교할 수 없습니다.',
      variant: 'blue',
    });
  }

  const lateCount = attendance?.lateCount ?? 0;
  if (lateCount > 0) {
    alerts.push({
      id: 'late-warn',
      title: `이번 달 지각 ${lateCount}회`,
      description: '최근 30일 내 지각 횟수가 누적되었습니다.',
      variant: 'orange',
    });
  }

  return alerts;
}

// ── 월별 바 차트 ───────────────────────────────────────────

export function mapEmployeeMonthlyPayrollSeries(
  payrolls: (MyPayrollData | null)[]
): MonthlyBarData[] {
  return payrolls.map((p) => ({
    value: toManwon(p?.netPay ?? 0),
  }));
}

// ── 수당 도넛 차트 ─────────────────────────────────────────

export function mapEmployeePayrollBreakdown(
  current: MyPayrollData,
  previous: MyPayrollData | null
): PayrollBreakdownItem[] {
  // details에서 항목별로 집계
  const basicPay =
    current.details
      .filter((d) => d.detailType === 'BASE')
      .reduce((sum, d) => sum + d.amount, 0) || current.basicPay;

  const allowances = current.details.filter(
    (d) => d.detailType === 'ALLOWANCE'
  );

  // 주휴수당, 연장근무, 야간수당 분리
  const weeklyHoliday =
    allowances.find((d) => d.itemName.includes('주휴'))?.amount ?? 0;
  const overtime =
    allowances.find(
      (d) => d.itemName.includes('연장') || d.itemName.includes('초과')
    )?.amount ?? 0;
  const nightPay =
    allowances.find((d) => d.itemName.includes('야간'))?.amount ?? 0;

  // 전월 비교용
  const prevBasic = previous?.basicPay ?? 0;
  const prevAllowances = previous?.details.filter(
    (d) => d.detailType === 'ALLOWANCE'
  );
  const prevWeeklyHoliday =
    prevAllowances?.find((d) => d.itemName.includes('주휴'))?.amount ?? 0;
  const prevOvertime =
    prevAllowances?.find(
      (d) => d.itemName.includes('연장') || d.itemName.includes('초과')
    )?.amount ?? 0;
  const prevNight =
    prevAllowances?.find((d) => d.itemName.includes('야간'))?.amount ?? 0;

  return [
    {
      id: 'basic',
      label: '기본급',
      amount: basicPay,
      color: 'var(--color-primary)',
      changePercent: previous
        ? calcPercentChange(basicPay, prevBasic)
        : undefined,
    },
    {
      id: 'holiday',
      label: '주휴수당',
      amount: weeklyHoliday,
      color: 'var(--color-warning)',
      changePercent: previous
        ? calcPercentChange(weeklyHoliday, prevWeeklyHoliday)
        : undefined,
    },
    {
      id: 'overtime',
      label: '연장근무',
      amount: overtime,
      color: 'var(--color-action-schedule)',
      changePercent: previous
        ? calcPercentChange(overtime, prevOvertime)
        : undefined,
    },
    {
      id: 'night',
      label: '야간수당',
      amount: nightPay,
      color: 'var(--color-status-purple-bg)',
      changePercent: previous
        ? calcPercentChange(nightPay, prevNight)
        : undefined,
    },
  ];
}

// ── 근태 통계 ──────────────────────────────────────────────

export interface EmployeeAttendanceStatsData {
  attendanceCount: number;
  lateCount: number;
  absentCount: number;
  totalWorkHours: number;
  overtimeHours: number;
  nightHours: number;
}

export function mapEmployeeAttendanceStats(
  attendance: MonthlyAttendanceEmployeeSummary | null,
  payroll: MyPayrollData | null
): EmployeeAttendanceStatsData {
  return {
    attendanceCount: attendance?.attendanceCount ?? 0,
    lateCount: attendance?.lateCount ?? 0,
    absentCount: attendance?.absentCount ?? 0,
    totalWorkHours: Math.round((payroll?.totalWorkMinutes ?? 0) / 60),
    overtimeHours: Math.round((payroll?.overtimeMinutes ?? 0) / 60),
    nightHours: Math.round((payroll?.nightWorkMinutes ?? 0) / 60),
  };
}
