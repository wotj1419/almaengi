import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/common/DetailHeader';
import { getApiErrorMessage } from '@/api/error';
import useAuthStore from '@/stores/useAuthStore';
import NoStoreCard from '@/components/common/NoStoreCard';
import AuctionListCard from '../components/AuctionListCard';
import AuctionSummaryCard from '../components/AuctionSummaryCard';
import { useAuctions, useDeleteAuction } from '../hooks/useAuctionQueries';
import { toAuctionItem } from '../utils/auctionMapper';

const HIDDEN_COMPLETED_AUCTION_IDS_KEY = 'hiddenCompletedAuctionIds';

function readHiddenCompletedAuctionIds(): number[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(HIDDEN_COMPLETED_AUCTION_IDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is number => typeof value === 'number');
  } catch {
    return [];
  }
}

function persistHiddenCompletedAuctionIds(auctionIds: number[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      HIDDEN_COMPLETED_AUCTION_IDS_KEY,
      JSON.stringify(auctionIds)
    );
  } catch {
    // Ignore localStorage failure and keep runtime state.
  }
}

export default function AuctionPage() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab =
    (location.state as { tab?: string } | null)?.tab === 'completed'
      ? 'completed'
      : 'inProgress';

  const [activeTab, setActiveTab] = useState<'inProgress' | 'completed'>(
    initialTab
  );
  const [showStopModal, setShowStopModal] = useState(false);
  const [targetAuctionId, setTargetAuctionId] = useState<number | null>(null);
  const [hiddenCompletedAuctionIds, setHiddenCompletedAuctionIds] = useState<
    number[]
  >(() => readHiddenCompletedAuctionIds());
  const [countdownTick, setCountdownTick] = useState(() => Date.now());

  // ─── 경매 데이터 조회 ──────────────────────────────────────────────────────
  // [변경 사항] Mock 폴백 제거: API가 빈 배열을 반환하면 정상적으로 빈 상태 UI 표시
  // - 이전: auctionDtos.length === 0일 때 mockAuctionDtos로 폴백 → 실제 API 동작 숨김
  // - 현재: auctionDtos를 그대로 사용 → 로딩/에러/빈 상태를 명확히 구분
  const { data: auctionDtos = [] } = useAuctions(activeStoreId);
  const deleteMutation = useDeleteAuction();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // ─── 경매 항목 변환 (카운트다운 재계산용) ─────────────────────────────────
  // countdownTick이 변할 때마다 남은 시간 표시 업데이트
  const auctions = useMemo(() => {
    // countdownTick drives re-computation every second for live countdown labels.
    void countdownTick;
    return auctionDtos.map(toAuctionItem);
  }, [auctionDtos, countdownTick]);
  const hiddenCompletedAuctionIdSet = useMemo(
    () => new Set(hiddenCompletedAuctionIds),
    [hiddenCompletedAuctionIds]
  );
  const inProgressAuctions = useMemo(
    () => auctions.filter((auction) => auction.status === 'inProgress'),
    [auctions]
  );
  const completedAuctions = useMemo(
    () =>
      auctions.filter(
        (auction) =>
          auction.status === 'completed' &&
          !hiddenCompletedAuctionIdSet.has(auction.id)
      ),
    [auctions, hiddenCompletedAuctionIdSet]
  );

  const filteredAuctions =
    activeTab === 'inProgress' ? inProgressAuctions : completedAuctions;

  const hideCompletedAuction = (auctionId: number) => {
    setHiddenCompletedAuctionIds((prev) => {
      if (prev.includes(auctionId)) return prev;

      const next = [...prev, auctionId];
      persistHiddenCompletedAuctionIds(next);
      return next;
    });
  };

  const handleDeleteCompleted = (auctionId: number) => {
    hideCompletedAuction(auctionId);

    deleteMutation.mutate(auctionId, {
      onSuccess: () => {
        toast.success('경매가 삭제되었습니다.');
      },
      onError: () => {
        // 종료 경매는 백엔드에서 삭제가 막혀도 UI에서는 숨김을 유지합니다.
      },
    });
  };

  const handleConfirmStop = () => {
    if (activeStoreId === null) {
      toast.error('등록된 매장이 없어 경매를 관리할 수 없습니다.');
      setShowStopModal(false);
      setTargetAuctionId(null);
      return;
    }

    if (targetAuctionId === null) {
      setShowStopModal(false);
      return;
    }

    deleteMutation.mutate(targetAuctionId, {
      onSuccess: () => {
        toast.success('경매가 중단되었습니다.');
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, '경매 중단에 실패했습니다.'));
      },
      onSettled: () => {
        setShowStopModal(false);
        setTargetAuctionId(null);
      },
    });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-body)]">
      <DetailHeader title="근무 경매" />

      <main className="px-[15px] pt-2.5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3.5">
        {/* ─── 매장 미선택 상태 ─────────────────────────────────────────────
            [변경 사항] Mock 폴백 제거 후 조건 단순화
            - 이전: activeStoreId === null && !isUsingMockAuctions
              (매장 없거나 && 실제 데이터를 사용 중일 때만 NoStoreCard 표시)
            - 현재: activeStoreId === null
              (매장이 없으면 항상 NoStoreCard 표시)
            ──────────────────────────────────────────────────────────────── */}
        {activeStoreId === null ? (
          <div className="-mx-[15px]">
            <NoStoreCard
              description={
                <>
                  경매 기능을 사용하려면
                  <br />
                  매장을 등록해야 합니다
                </>
              }
            />
          </div>
        ) : (
          <>
            <AuctionSummaryCard
              inProgressCount={inProgressAuctions.length}
              completedCount={completedAuctions.length}
              onRegister={() => navigate('/auction/register')}
            />
            <AuctionListCard
              activeTab={activeTab}
              onTabChange={setActiveTab}
              auctions={filteredAuctions}
              onViewBids={(id) => navigate(`/auction/${id}`)}
              onViewResult={(id) => navigate(`/auction/result/${id}`)}
              onEdit={(id) => navigate(`/auction/edit/${id}`)}
              onStop={(id) => {
                setTargetAuctionId(id);
                setShowStopModal(true);
              }}
              onDeleteCompleted={handleDeleteCompleted}
            />
          </>
        )}
      </main>

      <BottomNav activeTab="schedule" />

      <ConfirmModal
        isOpen={showStopModal}
        message="해당 경매를 취소하시겠습니까?"
        confirmText="경매 중단"
        cancelText="취소"
        onConfirm={handleConfirmStop}
        onClose={() => {
          setShowStopModal(false);
          setTargetAuctionId(null);
        }}
      />
    </div>
  );
}
