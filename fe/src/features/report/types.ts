export interface AttendanceRecord {
  id: string;
  name: string;
  attendance: number;
  late: number;
  absent: number;
  hours: number;
  isWarning: boolean;
}

export interface MonthlyHighlightItem {
  id: string;
  category: string;
  name: string;
  bgColor: string;
  iconColor: string;
  iconType: 'salary' | 'attendance' | 'late';
}

export interface SalaryBreakdownItem {
  id: string;
  label: string;
  amount: number;
  color: string;
  changePercent?: number;
}

export interface MonthlyBarData {
  value: number;
}

export interface AlertCardData {
  id: string;
  title: string;
  description: string;
  variant: 'green' | 'orange' | 'blue';
}

export interface AuctionSummaryItem {
  id: string;
  label: string;
  value: string;
  bgColor: string;
  labelColor: string;
  valueColor: string;
}

export interface PeakTimeItem {
  id: string;
  rank: number;
  timeRange: string;
  description: string;
  count: number;
  barColor: string;
  badgeBg: string;
  badgeTextColor: string;
}

export interface AuctionInsightItem {
  id: string;
  title: string;
  description: string;
  variant: 'orange' | 'purple';
}

export interface SalaryRankingItem {
  id: string;
  rank: number;
  name: string;
  amount: number;
}

export interface SummaryCard {
  id: string;
  title: string;
  mainValue: string;
  subText?: string;
  subTextVariant?: 'warning' | 'info';
  trend?: string; // "-12%"
  trendType?: 'positive' | 'negative' | 'neutral';
}
