import { Flame, Banknote } from 'lucide-react';
import type { ReactNode } from 'react';
import AlertCard from './AlertCard';
import AuctionSummaryCard from './AuctionSummaryCard';
import PeakTimeCard from './PeakTimeCard';
import type { AuctionInsightItem, AuctionSummaryItem, PeakTimeItem } from '../types';

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

interface Props {
  insights: AuctionInsightItem[];
  summary: AuctionSummaryItem[];
  peakTimes: PeakTimeItem[];
  isCurrentMonth: boolean;
}

export default function AuctionInsightTab({
  insights,
  summary,
  peakTimes,
  isCurrentMonth,
}: Props) {
  if (isCurrentMonth) {
    return (
      <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-5)]">
        <AlertCard
          icon={<Banknote size={20} color="var(--color-status-blue-dot)" strokeWidth={2} />}
          iconBg="var(--color-status-blue-bg)"
          title="경매 인사이트는 전월부터 조회 가능"
          description="현재 월 데이터는 마감 전이라 분석이 제한됩니다. 이전 달을 선택해 주세요."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-5)]">
      {insights.map((item) => {
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
      <AuctionSummaryCard summary={summary} />
      <PeakTimeCard peakTimes={peakTimes} />
    </div>
  );
}
