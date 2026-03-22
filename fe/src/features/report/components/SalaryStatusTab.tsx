import { Lightbulb, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { mockSalaryAlerts } from '../data/mockReport';
import AlertCard from './AlertCard';
import MonthlySalaryChart from './MonthlySalaryChart';
import SalaryDonutChart from './SalaryDonutChart';
import type { AlertCardData } from '../types';

const ICON_CONFIG: Record<
  AlertCardData['variant'],
  { icon: ReactNode; iconBg: string }
> = {
  green: {
    icon: (
      <Lightbulb
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
};

interface Props {
  year: number;
  month: number;
}

export default function SalaryStatusTab({ year, month }: Props) {
  return (
    <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-5)]">
      {mockSalaryAlerts.map((alert) => {
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
      <MonthlySalaryChart year={year} month={month} />
      <SalaryDonutChart />
    </div>
  );
}
