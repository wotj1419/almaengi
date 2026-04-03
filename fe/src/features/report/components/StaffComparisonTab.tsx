import { TriangleAlert, BadgeCheck, Banknote } from 'lucide-react';
import type { ReactNode } from 'react';
import AlertCard from './AlertCard';
import AttendanceTable from './AttendanceTable';
import PayrollRankingCard from './PayrollRankingCard';
import type {
  AlertCardData,
  AttendanceRecord,
  PayrollRankingItem,
} from '../types';

const ICON_CONFIG: Record<
  AlertCardData['variant'],
  { icon: ReactNode; iconBg: string }
> = {
  green: {
    icon: (
      <Banknote
        size={20}
        color="var(--color-status-green-dot)"
        strokeWidth={2}
      />
    ),
    iconBg: 'var(--color-status-green-bg)',
  },
  orange: {
    icon: (
      <TriangleAlert size={20} color="var(--color-warning)" strokeWidth={2} />
    ),
    iconBg: 'var(--color-status-orange-bg)',
  },
  blue: {
    icon: (
      <BadgeCheck
        size={20}
        color="var(--color-action-schedule)"
        strokeWidth={2}
      />
    ),
    iconBg: 'var(--color-attendance-bg)',
  },
};

interface Props {
  alerts: AlertCardData[];
  attendanceRecords: AttendanceRecord[];
  payrollRanking: PayrollRankingItem[];
}

export default function StaffComparisonTab({
  alerts,
  attendanceRecords,
  payrollRanking,
}: Props) {
  return (
    <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-5)]">
      {alerts.map((alert) => {
        const { icon, iconBg } = ICON_CONFIG[alert.variant];
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
      <AttendanceTable records={attendanceRecords} />
      <PayrollRankingCard ranking={payrollRanking} />
    </div>
  );
}
