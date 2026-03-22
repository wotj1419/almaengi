import { Flame, Banknote } from 'lucide-react';
import type { ReactNode } from 'react';
import { mockAuctionInsights } from '../data/mockReport';
import AlertCard from './AlertCard';
import AuctionSummaryCard from './AuctionSummaryCard';
import PeakTimeCard from './PeakTimeCard';
import type { AuctionInsightItem } from '../types';

const ICON_CONFIG: Record<
  AuctionInsightItem['variant'],
  { icon: ReactNode; iconBg: string }
> = {
  orange: {
    icon: <Flame size={20} color="var(--color-warning)" strokeWidth={2} />,
    iconBg: 'var(--color-status-orange-bg)',
  },
  purple: {
    icon: (
      <Banknote
        size={20}
        color="var(--color-status-purple-dot)"
        strokeWidth={2}
      />
    ),
    iconBg: 'var(--color-status-purple-bg)',
  },
};

export default function AuctionInsightTab() {
  return (
    <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-5)]">
      {mockAuctionInsights.map((item) => {
        const { icon, iconBg } = ICON_CONFIG[item.variant];
        return (
          <AlertCard
            key={item.id}
            icon={icon}
            iconBg={iconBg}
            title={item.title}
            description={item.description}
          />
        );
      })}
      <AuctionSummaryCard />
      <PeakTimeCard />
    </div>
  );
}
