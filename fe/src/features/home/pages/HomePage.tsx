import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import RevenueCard from '../components/RevenueCard';
import AlertBanner from '../components/AlertBanner';
import WorkStatusCard from '../components/WorkStatusCard';
import ActionGrid from '../components/ActionGrid';

export default function HomePage() {
  return (
    <>
      <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
        <div className="flex flex-col items-center w-full md:max-w-[600px] relative overflow-x-hidden">
          {/* 배경 레이어 */}
          <div className="absolute left-0 top-0 w-full h-full min-h-[935px] pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[433px] bg-[var(--color-bg-dark)]" />
            <div className="absolute top-[350px] left-0 w-full h-[585px] bg-[var(--color-bg-base)] rounded-tl-[var(--radius-xl)] rounded-tr-[var(--radius-xl)]" />
          </div>

          {/* 헤더 */}
          <Header />

          {/* 메인 콘텐츠 */}
          <div className="flex flex-col gap-[var(--space-5)] items-center pt-[var(--space-3)] pb-[var(--space-9)] px-[var(--space-5)] relative w-full">
            <RevenueCard />
            <AlertBanner />
            <WorkStatusCard />
            <ActionGrid />
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 - 화면 고정 */}
      <BottomNav />
    </>
  );
}
