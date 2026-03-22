import type {
  AlertCardData,
  AttendanceRecord,
  AuctionInsightItem,
  AuctionSummaryItem,
  MonthlyBarData,
  MonthlyHighlightItem,
  PeakTimeItem,
  SalaryBreakdownItem,
  SalaryRankingItem,
  SummaryCard,
} from '../types';

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    name: '박직원',
    attendance: 22,
    late: 0,
    absent: 0,
    hours: 176,
    isWarning: false,
  },
  {
    id: '2',
    name: '이직원',
    attendance: 22,
    late: 0,
    absent: 0,
    hours: 160,
    isWarning: false,
  },
  {
    id: '3',
    name: '정직원',
    attendance: 20,
    late: 2,
    absent: 0,
    hours: 152,
    isWarning: false,
  },
  {
    id: '4',
    name: '김직원',
    attendance: 16,
    late: 5,
    absent: 1,
    hours: 120,
    isWarning: true,
  },
];

export const mockSalaryAlerts: AlertCardData[] = [
  {
    id: 'labor-cost-alert',
    title: '인건비 최적화 알림',
    description:
      '주말 야간 파트타임 인건비가 전월 대비 15% 상승했습니다.\n근무 조정을 검토해보세요.',
    variant: 'green',
  },
  {
    id: 'late-alert',
    title: '지각 주의보',
    description:
      '특정 시간대 지각이 집중되고 있습니다.\n지각 주의 공지를 작성해보면 어떨까요?',
    variant: 'orange',
  },
];

export const mockMonthlysalary: MonthlyBarData[] = [
  { value: 210 },
  { value: 195 },
  { value: 220 },
  { value: 200 },
  { value: 230 },
  { value: 234 },
];

export const mockMonthlyHighlights: MonthlyHighlightItem[] = [
  {
    id: 'top-salary',
    category: '최고 급여',
    name: '박직원',
    bgColor: 'var(--color-primary)',
    iconColor: 'var(--color-highlight-salary-icon)',
    iconType: 'salary',
  },
  {
    id: 'best-attendance',
    category: '성실왕',
    name: '이직원',
    bgColor: 'var(--color-highlight-attendance-bg)',
    iconColor: 'var(--color-highlight-attendance-icon)',
    iconType: 'attendance',
  },
  {
    id: 'most-late',
    category: '지각왕',
    name: '김직원',
    bgColor: 'var(--color-highlight-late-bg)',
    iconColor: 'var(--color-highlight-late-icon)',
    iconType: 'late',
  },
];

export const mockStaffAlerts: AlertCardData[] = [
  {
    id: 'late-staff',
    title: '김직원님 지각 5회',
    description: '최근 30일 내 지각 횟수가 급증했습니다.',
    variant: 'orange',
  },
  {
    id: 'perfect-attendance',
    title: '개근: 박직원, 이직원',
    description: '결근 없이 성실하게 근무 중입니다.',
    variant: 'blue',
  },
];

export const mockSalaryBreakdown: SalaryBreakdownItem[] = [
  {
    id: 'base',
    label: '기본급',
    amount: 1750000,
    color: 'var(--color-primary)',
  },
  {
    id: 'holiday',
    label: '주휴수당',
    amount: 320000,
    color: 'var(--color-warning)',
    changePercent: -7,
  },
  {
    id: 'overtime',
    label: '연장근무',
    amount: 180000,
    color: 'var(--color-action-schedule)',
    changePercent: -29,
  },
  {
    id: 'night',
    label: '야간수당',
    amount: 90000,
    color: 'var(--color-status-purple-bg)',
    changePercent: -38,
  },
];

export const mockAuctionSummary: AuctionSummaryItem[] = [
  {
    id: 'monthly-count',
    label: '월간 건수',
    value: '8건',
    bgColor: 'var(--color-primary)',
    labelColor: 'var(--color-icon-dark)',
    valueColor: 'var(--color-icon-dark)',
  },
  {
    id: 'winning-rate',
    label: '낙찰률',
    value: '87%',
    bgColor: 'var(--color-highlight-attendance-bg)',
    labelColor: 'var(--color-highlight-attendance-label)',
    valueColor: 'var(--color-highlight-attendance-icon)',
  },
  {
    id: 'avg-wage',
    label: '평균 시급',
    value: '13,500원',
    bgColor: 'var(--color-highlight-late-bg)',
    labelColor: 'var(--color-highlight-late-label)',
    valueColor: 'var(--color-highlight-late-icon)',
  },
];

export const mockPeakTimes: PeakTimeItem[] = [
  {
    id: '1',
    rank: 1,
    timeRange: '금요일 19:00 - 21:00',
    description: '가장 경쟁률이 높은 시간대',
    count: 12,
    barColor: 'var(--color-warning)',
    badgeBg: 'var(--color-status-orange-bg)',
    badgeTextColor: 'var(--color-warning)',
  },
  {
    id: '2',
    rank: 2,
    timeRange: '토요일 18:00 - 20:00',
    description: '주말 저녁 피크',
    count: 10,
    barColor: 'var(--color-warning)',
    badgeBg: 'var(--color-status-orange-bg)',
    badgeTextColor: 'var(--color-warning)',
  },
  {
    id: '3',
    rank: 3,
    timeRange: '목요일 20:00 - 22:00',
    description: '평일 야간 피크',
    count: 9,
    barColor: 'var(--color-warning)',
    badgeBg: 'var(--color-status-orange-bg)',
    badgeTextColor: 'var(--color-warning)',
  },
  {
    id: '4',
    rank: 4,
    timeRange: '수요일 18:00 - 19:30',
    description: '주중 저녁 타임',
    count: 7,
    barColor: 'var(--color-action-schedule)',
    badgeBg: 'var(--color-attendance-bg)',
    badgeTextColor: 'var(--color-action-schedule)',
  },
  {
    id: '5',
    rank: 5,
    timeRange: '일요일 17:00 - 19:00',
    description: '주말 저녁 타임',
    count: 6,
    barColor: 'var(--color-action-schedule)',
    badgeBg: 'var(--color-attendance-bg)',
    badgeTextColor: 'var(--color-action-schedule)',
  },
  {
    id: '6',
    rank: 6,
    timeRange: '월요일 19:00 - 20:30',
    description: '월요일 선호 시간',
    count: 4,
    barColor: 'var(--color-primary)',
    badgeBg: 'var(--color-status-green-bg)',
    badgeTextColor: 'var(--color-status-badge-green-text)',
  },
];

export const mockAuctionInsights: AuctionInsightItem[] = [
  {
    id: 'peak-time',
    title: '금요일 저녁 피크',
    description: '금요일 저녁 피크타임에 경매 참여가 가장 활발합니다.',
    variant: 'orange',
  },
  {
    id: 'high-salary',
    title: '평균 경매 급여 높음',
    description: '현재 평균 급여 수준이 높게 형성되어 있습니다.',
    variant: 'purple',
  },
];

export const mockSalaryRanking: SalaryRankingItem[] = [
  { id: '1', rank: 1, name: '박직원', amount: 4250000 },
  { id: '2', rank: 2, name: '이직원', amount: 3800000 },
  { id: '3', rank: 3, name: '정직원', amount: 3200000 },
  { id: '4', rank: 4, name: '김직원', amount: 2100000 },
];

export const mockSummaryCards: SummaryCard[] = [
  {
    id: 'labor-cost',
    title: '이번 달 인건비',
    mainValue: '234만원',
    trend: '12%',
    trendType: 'positive',
  },
  {
    id: 'late',
    title: '지각 주의',
    mainValue: '김직원',
    subText: '5회 누적',
  },
  {
    id: 'auction',
    title: '경매 낙찰률',
    mainValue: '87%',
    subText: '총 8건',
    subTextVariant: 'info',
  },
];
