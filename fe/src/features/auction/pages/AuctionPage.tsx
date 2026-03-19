import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { getApiErrorMessage } from '@/api/error';
import useAuthStore from '@/stores/useAuthStore';
import AuctionListCard from '../components/AuctionListCard';
import AuctionSummaryCard from '../components/AuctionSummaryCard';
import { useAuctions, useDeleteAuction } from '../hooks/useAuctionQueries';
import { toAuctionItem } from '../utils/auctionMapper';

export default function AuctionPage() {
  // 로그인한 사용자의 매장 ID (미로그인 시 기본값 1)
  const storeId = useAuthStore((state) => state.user?.storeId ?? 1);
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

  const { data: auctionDtos = [] } = useAuctions(storeId);
  const deleteMutation = useDeleteAuction();

  const auctions = useMemo(() => auctionDtos.map(toAuctionItem), [auctionDtos]);
  const inProgressAuctions = useMemo(
    () => auctions.filter((auction) => auction.status === 'inProgress'),
    [auctions]
  );
  const completedAuctions = useMemo(
    () => auctions.filter((auction) => auction.status === 'completed'),
    [auctions]
  );

  const filteredAuctions =
    activeTab === 'inProgress' ? inProgressAuctions : completedAuctions;

  const handleConfirmStop = () => {
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
      <Header storeName="부산갈매기 수완점" hasNotification auctionStyle />

      <main className="px-[15px] pt-2.5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3.5">
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
        />
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
