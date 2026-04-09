import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, MapPin, Timer, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/common/DetailHeader';
import { getStore } from '@/api/store';
import { getApiErrorMessage } from '@/api/error';
import useAuthStore from '@/stores/useAuthStore';
import { useAuctionDetail, useCloseAuction } from '../hooks/useAuctionQueries';
import BidderGroup from '../components/BidderGroup';

interface ResultPageWinner {
  bidId: number;
  employeeId: number;
  name: string;
  wage: number;
}

type AuctionEntryFrom = 'home' | 'storeManage';

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const auctionId = Number(id);
  const entryFrom = (location.state as { from?: AuctionEntryFrom } | null)
    ?.from;
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  const { data: detail } = useAuctionDetail(auctionId);
  const closeMutation = useCloseAuction();

  const [selectedBidIds, setSelectedBidIds] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const auction = detail?.auction;
  const { data: storeInfo } = useQuery({
    queryKey: ['auction', 'store', auction?.storeId],
    queryFn: () => getStore(auction!.storeId),
    enabled: typeof auction?.storeId === 'number',
  });
  const bidders = detail?.bidders;
  const hasBidders = Boolean(
    bidders &&
    bidders.group1.length + bidders.group2.length + bidders.group3.length > 0
  );

  const toggleBidder = (bidId: number) => {
    if (selectedBidIds.includes(bidId)) {
      setSelectedBidIds((prev) => prev.filter((value) => value !== bidId));
      return;
    }

    if (auction && selectedBidIds.length >= auction.recruitCount) {
      toast.error(`모집 인원(${auction.recruitCount}명)만 선택할 수 있습니다.`);
      return;
    }

    setSelectedBidIds((prev) => [...prev, bidId]);
  };

  const handleClose = () => {
    if (activeStoreId === null) {
      toast.error('등록된 매장이 없어 경매를 마감할 수 없습니다.');
      return;
    }

    if (selectedBidIds.length === 0) {
      toast.error('낙찰할 알바생을 선택해 주세요.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmClose = () => {
    closeMutation.mutate(
      { auctionId, body: { selectedBidIds } },
      {
        onSuccess: (result) => {
          const winners: ResultPageWinner[] = result.winners.map((winner) => ({
            bidId: winner.bidId,
            employeeId: winner.employeeId,
            name: winner.employeeName,
            wage: winner.bidWage,
          }));

          navigate(`/auction/result/${auctionId}`, {
            replace: true,
            state: {
              from: entryFrom,
              winners,
              auction: auction
                ? {
                    ...auction,
                    status: result.status,
                    winnerIds: result.winners.map(
                      (winner) => winner.employeeId
                    ),
                  }
                : undefined,
            },
          });
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, '경매 낙찰에 실패했습니다.'));
        },
        onSettled: () => {
          setShowConfirmModal(false);
        },
      }
    );
  };

  if (!auction) {
    return (
      <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)]">
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[var(--color-text-muted)]">로딩 중...</span>
        </div>
      </div>
    );
  }

  const deadline = new Date(auction.deadline);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const remainingHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const remainingMinutes = Math.max(
    0,
    Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  );
  const remainingTimeStr =
    diffMs > 0 ? `${remainingHours}시간 ${remainingMinutes}분` : '마감됨';

  const isInProgress = auction.status === 'IN_PROGRESS';

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)]">
      <DetailHeader title="경매 현황" onBack={() => navigate(-1)} />

      <div className="px-3.5 pt-3.5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col items-center gap-3.5">
        <div className="w-full bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-[var(--color-border-light)] overflow-hidden">
          <div className="p-5 flex flex-col gap-3">
            <div className="inline-flex items-center gap-2">
              <Timer
                className="w-4 h-4 text-[var(--color-text-muted)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-muted)] text-base font-medium leading-5">
                경매 잔여 시간:{' '}
                <span className="text-[var(--color-text-primary)]">
                  {remainingTimeStr}
                </span>
              </span>
            </div>

            <div className="inline-flex items-center gap-2">
              <Users
                className="w-4 h-4 text-[var(--color-text-muted)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-muted)] text-base font-medium leading-5">
                모집 인원:{' '}
                <span className="text-[var(--color-text-primary)]">
                  {auction.recruitCount}명
                </span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Clock
                className="w-4 h-4 text-[var(--color-text-muted)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-muted)] text-base font-medium leading-5">
                근무 시간:{' '}
                <span className="text-[var(--color-text-primary)]">
                  {auction.targetDate} | {auction.targetStartTime.slice(0, 5)} -{' '}
                  {auction.targetEndTime.slice(0, 5)}
                </span>
              </span>
            </div>

            <div className="inline-flex items-center gap-2">
              <MapPin
                className="w-4 h-4 text-[var(--color-text-muted)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-muted)] text-base font-medium leading-5">
                근무 지점:{' '}
                <span className="text-[var(--color-text-primary)]">
                  {storeInfo?.storeName ?? '-'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {hasBidders && bidders && (
          <>
            <BidderGroup
              title="기존에도 주휴수당 발생"
              description="이미 주휴수당 조건을 만족한 직원"
              bidders={bidders.group1}
              borderColor="border-[var(--color-status-orange-dot)]"
              rankColor="text-[var(--color-status-orange-dot)]"
              selectedBidIds={selectedBidIds}
              onToggle={toggleBidder}
            />
            <BidderGroup
              title="주휴수당 발생 가능"
              description="이번 낙찰 시 주휴수당이 발생하는 직원"
              bidders={bidders.group2}
              borderColor="border-[var(--color-action-schedule)]"
              rankColor="text-[var(--color-action-schedule)]"
              selectedBidIds={selectedBidIds}
              onToggle={toggleBidder}
            />
            <BidderGroup
              title="주휴수당 미발생"
              description="이번 낙찰 시 주휴수당이 미발생하는 직원"
              bidders={bidders.group3}
              borderColor="border-[var(--color-primary)]"
              rankColor="text-[var(--color-primary)]"
              selectedBidIds={selectedBidIds}
              onToggle={toggleBidder}
            />
          </>
        )}

        {!hasBidders && (
          <section className="w-full bg-[var(--color-bg-white)] rounded-2xl border border-[var(--color-border-light)] p-6">
            <p className="text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] text-center">
              아직 지원한 알바생이 없습니다.
            </p>
          </section>
        )}

        {isInProgress && (
          <div className="w-full px-0 inline-flex justify-center items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 h-12 bg-[var(--color-bg-surface)] rounded-xl inline-flex justify-center items-center"
            >
              <span className="text-[var(--color-text-muted)] text-xl font-bold leading-5">
                취소
              </span>
            </button>
            <button
              onClick={handleClose}
              className="flex-1 h-12 bg-[var(--color-primary)] rounded-xl inline-flex justify-center items-center"
            >
              <span className="text-[var(--color-text-primary)] text-xl font-bold leading-5">
                경매 낙찰
              </span>
            </button>
          </div>
        )}
      </div>

      <BottomNav activeTab="schedule" />

      <ConfirmModal
        isOpen={showConfirmModal}
        message={`선택한 ${selectedBidIds.length}명을 낙찰하시겠습니까?`}
        confirmText="낙찰"
        cancelText="취소"
        onConfirm={handleConfirmClose}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
