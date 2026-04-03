import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/common/DetailHeader';
import { getApiErrorMessage } from '@/api/error';
import { ROUTES } from '@/constants/routes';
import useAuthStore from '@/stores/useAuthStore';
import NoStoreCard from '@/components/common/NoStoreCard';
import AuctionListCard from '../components/AuctionListCard';
import AuctionSummaryCard from '../components/AuctionSummaryCard';
import { useAuctions, useDeleteAuction } from '../hooks/useAuctionQueries';
import { toAuctionItem } from '../utils/auctionMapper';
import { useAuctionSocket } from '../hooks/useAuctionSocket';

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

  // 사장 페이지에서 경매 이벤트를 구독해 목록/상세를 즉시 동기화
  useAuctionSocket(activeStoreId);

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    tab?: string;
    from?: 'home' | 'storeManage';
  } | null;
  const entryFrom = locationState?.from;
  const initialTab =
    locationState?.tab === 'completed' ? 'completed' : 'inProgress';

  const [activeTab, setActiveTab] = useState<'inProgress' | 'completed'>(
    initialTab
  );
  const [showStopModal, setShowStopModal] = useState(false);
  const [targetAuctionId, setTargetAuctionId] = useState<number | null>(null);
  const [hiddenCompletedAuctionIds, setHiddenCompletedAuctionIds] = useState<
    number[]
  >(() => readHiddenCompletedAuctionIds());
  const [countdownTick, setCountdownTick] = useState(() => Date.now());

  const { data: auctionDtos = [] } = useAuctions(activeStoreId);
  const deleteMutation = useDeleteAuction();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const auctions = useMemo(() => {
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

  const completedAuctions = useMemo(() => {
    const filtered = auctions.filter(
      (auction) =>
        auction.status === 'completed' &&
        !hiddenCompletedAuctionIdSet.has(auction.id)
    );

    const expired = filtered.filter(
      (auction) => auction.displayStatus === 'expired'
    );
    const normal = filtered.filter(
      (auction) => auction.displayStatus !== 'expired'
    );
    return [...expired, ...normal];
  }, [auctions, hiddenCompletedAuctionIdSet]);

  const filteredAuctions =
    activeTab === 'inProgress' ? inProgressAuctions : completedAuctions;

  const handleDeleteCompleted = (auctionId: number) => {
    setHiddenCompletedAuctionIds((prev) => {
      if (prev.includes(auctionId)) return prev;
      const next = [...prev, auctionId];
      persistHiddenCompletedAuctionIds(next);
      return next;
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

  const handleBack = () => {
    if (entryFrom === 'home') {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }

    if (entryFrom === 'storeManage') {
      navigate(ROUTES.STORE, { replace: true });
      return;
    }

    navigate(-1);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)]">
      <DetailHeader title="근무 경매" onBack={handleBack} />

      <main className="px-[15px] pt-2.5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3.5">
        {activeStoreId === null ? (
          <div className="-mx-[15px]">
            <NoStoreCard
              description={
                <>
                  경매 기능을 사용하려면
                  <br />
                  매장을 먼저 등록해야 합니다.
                </>
              }
            />
          </div>
        ) : (
          <>
            <AuctionSummaryCard
              inProgressCount={inProgressAuctions.length}
              completedCount={completedAuctions.length}
              onRegister={() =>
                navigate('/auction/register', { state: { from: entryFrom } })
              }
            />
            <AuctionListCard
              activeTab={activeTab}
              onTabChange={setActiveTab}
              auctions={filteredAuctions}
              onViewBids={(id) =>
                navigate(`/auction/${id}`, { state: { from: entryFrom } })
              }
              onViewResult={(id) =>
                navigate(`/auction/result/${id}`, {
                  state: { from: entryFrom },
                })
              }
              onEdit={(id) =>
                navigate(`/auction/edit/${id}`, { state: { from: entryFrom } })
              }
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
