import { useEffect, useRef } from 'react';
import type { SummaryCard as SummaryCardType } from '../types';
import SummaryCard from './SummaryCard';

interface Props {
  cards: SummaryCardType[];
}

export default function SummaryCardList({ cards }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={ref}
      className="flex gap-[var(--space-3)] overflow-x-auto scrollbar-hide px-[var(--space-5)] pt-[var(--space-6)] pb-[var(--space-2)]"
    >
      {cards.map((card) => (
        <SummaryCard key={card.id} card={card} />
      ))}
    </div>
  );
}
