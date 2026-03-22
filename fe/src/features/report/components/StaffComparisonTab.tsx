import { TriangleAlert, BadgeCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { mockStaffAlerts } from '../data/mockReport';
import AlertCard from './AlertCard';
import MonthlyHighlights from './MonthlyHighlights';
import AttendanceTable from './AttendanceTable';
import SalaryRankingCard from './SalaryRankingCard';
import type { AlertCardData } from '../types';

const ICON_CONFIG: Record<
  AlertCardData['variant'],
  { icon: ReactNode; iconBg: string }
> = {
  green: {
    icon: (
      <BadgeCheck
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

export default function StaffComparisonTab() {
  return (
    <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-5)]">
      {mockStaffAlerts.map((alert) => {
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
      <MonthlyHighlights />
      <AttendanceTable />
      <SalaryRankingCard />
    </div>
  );
}
