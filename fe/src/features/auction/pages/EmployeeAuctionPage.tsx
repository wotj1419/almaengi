import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/layout/DetailHeader';
import useAuthStore from '@/stores/useAuthStore';
import AuctionSummaryCard from '../components/AuctionSummaryCard';
import EmployeeAuctionItemCard from '../components/EmployeeAuctionItemCard';
import { useAuctions } from '../hooks/useAuctionQueries';
import { toAuctionItem } from '../utils/auctionMapper';
import { useAuctionSocket } from '../hooks/useAuctionSocket';

export default function EmployeeAuctionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  // 알바 페이지에서 경매 생성/수정/마감 이벤트를 실시간 반영
  useAuctionSocket(activeStoreId);

  const userId = useAuthStore((state) => state.user?.id ?? 0);

  const initialTab =
    (location.state as { tab?: string } | null)?.tab === 'completed'
      ? 'completed'
      : 'inProgress';

  const [activeTab, setActiveTab] = useState<'inProgress' | 'completed'>(
    initialTab
  );
  const [countdownTick, setCountdownTick] = useState(() => Date.now());

  // ─── 경매 데이터 조회 ──────────────────────────────────────────────────────
  // [변경 사항] Mock 폴백 제거: API 응답을 그대로 사용
  // - 이전: auctionDtos.length > 0일 때만 사용, 아니면 mockAuctionDtos로 폴백
  //        → 빈 배열과 mock 데이터 구분 불가, 실제 API 동작 숨김
  // - 현재: auctionDtos를 직접 사용 → 로딩/에러/빈 상태 명확히 처리
  const { data: auctionDtos = [] } = useAuctions(activeStoreId);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownTick(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // ─── 경매 항목 변환 ────────────────────────────────────────────────────────
  // countdownTick이 1초마다 변해 남은 시간 표시 업데이트
  const auctions = useMemo(() => {
    void countdownTick;
    return auctionDtos.map(toAuctionItem);
  }, [auctionDtos, countdownTick]);

  // ─── 상태별 필터링 ────────────────────────────────────────────────────────
  const inProgressAuctions = useMemo(
    () => auctions.filter((a) => a.status === 'inProgress'),
    [auctions]
  );
  const completedAuctions = useMemo(
    () => auctions.filter((a) => a.status === 'completed'),
    [auctions]
  );

  const filteredAuctions =
    activeTab === 'inProgress' ? inProgressAuctions : completedAuctions;

  // ─── 경매별 낙찰자 맵핑 ────────────────────────────────────────────────────
  // 알바생이 각 경매의 낙찰자인지 확인하기 위한 맵
  const winnerIdsMap = useMemo(() => {
    const map: Record<number, number[]> = {};
    auctionDtos.forEach((dto) => {
      map[dto.auctionId] = dto.winnerIds ?? [];
    });
    return map;
  }, [auctionDtos]);

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)]">
      <DetailHeader title="근무 경매" />

      <main className="px-[var(--space-5)] pt-[var(--space-3)] pb-[var(--pb-content)] flex flex-col gap-[var(--space-4)]">
        <AuctionSummaryCard
          inProgressCount={inProgressAuctions.length}
          completedCount={completedAuctions.length}
        />

        <div className="self-stretch inline-flex justify-center items-start gap-[var(--space-3)]">
          <button
            onClick={() => setActiveTab('inProgress')}
            className={`flex-1 px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] inline-flex justify-center items-center ${
              activeTab === 'inProgress'
                ? 'bg-[var(--color-primary)]'
                : 'bg-[var(--color-bg-white)]'
            }`}
          >
            <span className="text-center text-[length:var(--text-md2)] font-medium leading-5 text-[var(--color-text-primary)]">
              진행 중
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] inline-flex justify-center items-center ${
              activeTab === 'completed'
                ? 'bg-[var(--color-primary)]'
                : 'bg-[var(--color-bg-white)]'
            }`}
          >
            <span className="text-center text-[length:var(--text-md2)] font-medium leading-5 text-[var(--color-text-primary)]">
              종료
            </span>
          </button>
        </div>

        {filteredAuctions.length > 0 ? (
          <div className="flex flex-col gap-[var(--space-4)]">
            {filteredAuctions.map((auction) => (
              <EmployeeAuctionItemCard
                key={auction.id}
                auction={auction}
                winnerIds={winnerIdsMap[auction.id] ?? []}
                userId={userId}
                onJoin={() => navigate(`/auction/${auction.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="min-h-96 px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-7)] bg-[var(--color-bg-white)] rounded-[var(--radius-2xl)] border border-[var(--color-border-light)] shadow-[var(--shadow-form-card)] flex flex-col gap-[var(--space-4)]">
            <h2 className="text-[var(--color-text-primary)] text-[length:var(--text-xl)] font-bold leading-7">
              {activeTab === 'inProgress' ? '진행 중 경매' : '종료된 경매'}
            </h2>
            <div className="py-[var(--space-5)] flex flex-col items-center">
              <div className="w-16 h-16 bg-[var(--color-bg-base)] rounded-full flex items-center justify-center mb-[var(--space-8)]">
                <Inbox className="w-7 h-7 text-[var(--color-text-primary)]/30" />
              </div>
              <p className="text-[var(--color-text-primary)] text-[length:var(--text-base)] font-medium leading-7 mb-[var(--space-2)]">
                {activeTab === 'inProgress'
                  ? '등록된 근무 경매가 없습니다'
                  : '종료된 경매가 없습니다'}
              </p>
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab="schedule" />
    </div>
  );
}
