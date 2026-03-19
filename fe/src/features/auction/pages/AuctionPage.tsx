import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';
import AuctionSummaryCard from '../components/AuctionSummaryCard';
import AuctionListCard from '../components/AuctionListCard';
import { useAuctions, useDeleteAuction } from '../hooks/useAuctionQueries';
import { toAuctionItem } from '../utils/auctionMapper';

const STORE_ID = 1; // TODO: auth store에서 가져오기

export default function AuctionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab =
    (location.state as { tab?: string } | null)?.tab === 'completed'
      ? 'completed'
      : 'inProgress';
  const [activeTab, setActiveTab] = useState<'inProgress' | 'completed'>(
    initialTab
  );

  const { data: auctionDtos = [] } = useAuctions(STORE_ID);
  const deleteMutation = useDeleteAuction(STORE_ID);

  const [showStopModal, setShowStopModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetAuctionId, setTargetAuctionId] = useState<number | null>(null);

  const auctions = useMemo(() => auctionDtos.map(toAuctionItem), [auctionDtos]);
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

  const handleRegister = () => {
    navigate('/auction/register');
  };

  const handleViewBids = (id: number) => {
    navigate(`/auction/${id}`);
  };

  const handleViewResult = (id: number) => {
    navigate(`/auction/result/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/auction/edit/${id}`);
  };

  const handleStop = (id: number) => {
    setTargetAuctionId(id);
    setShowStopModal(true);
  };

  const handleConfirmStop = () => {
    if (targetAuctionId !== null) {
      deleteMutation.mutate(targetAuctionId, {
        onSuccess: () => {
          toast.success('경매가 중단되었습니다.');
        },
      });
    }
    setShowStopModal(false);
    setTargetAuctionId(null);
  };

  const handleDelete = (id: number) => {
    setTargetAuctionId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (targetAuctionId !== null) {
      deleteMutation.mutate(targetAuctionId, {
        onSuccess: () => {
          toast.success('경매가 삭제되었습니다.');
        },
      });
    }
    setShowDeleteModal(false);
    setTargetAuctionId(null);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-body)]">
      <Header storeName="부산갈매기 수완점" hasNotification auctionStyle />

      <main className="px-[15px] pt-2.5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3.5">
        <AuctionSummaryCard
          inProgressCount={inProgressAuctions.length}
          completedCount={completedAuctions.length}
          onRegister={handleRegister}
        />
        <AuctionListCard
          activeTab={activeTab}
          onTabChange={setActiveTab}
          auctions={filteredAuctions}
          onViewBids={handleViewBids}
          onViewResult={handleViewResult}
          onEdit={handleEdit}
          onStop={handleStop}
          onDelete={handleDelete}
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

      <ConfirmModal
        isOpen={showDeleteModal}
        message="해당 경매를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setTargetAuctionId(null);
        }}
      />
    </div>
  );
}
