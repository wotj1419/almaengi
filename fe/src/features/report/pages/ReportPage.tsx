import { useState } from 'react';
import dayjs from 'dayjs';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import MonthSelector from '../components/MonthSelector';
import SummaryCardList from '../components/SummaryCardList';
import ReportTabBar, { type ReportTab } from '../components/ReportTabBar';
import SalaryStatusTab from '../components/SalaryStatusTab';
import StaffComparisonTab from '../components/StaffComparisonTab';
import AuctionInsightTab from '../components/AuctionInsightTab';

export default function ReportPage() {
  const today = dayjs();
  const todayYear = today.year();
  const todayMonth = today.month() + 1;
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [activeTab, setActiveTab] = useState<ReportTab>('salary');

  const handlePrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
      <div className="flex flex-col w-full max-w-[var(--max-w-app)] relative overflow-x-hidden">
        <DetailHeader title="급여 및 근태 리포트" />
        <MonthSelector
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          disableNext={year === todayYear && month === todayMonth}
        />
        <SummaryCardList />
        <ReportTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 py-[var(--space-2)] pb-[var(--pb-content)]">
          {activeTab === 'salary' && (
            <SalaryStatusTab year={year} month={month} />
          )}
          {activeTab === 'staff' && <StaffComparisonTab />}
          {activeTab === 'auction' && <AuctionInsightTab />}
        </main>
        <BottomNav activeTab="salary" />
      </div>
    </div>
  );
}
