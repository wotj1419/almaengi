import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, Clock, MapPin, Timer, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DetailHeader from '@/components/common/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { getStore } from '@/api/store';
import { useAuctionDetail } from '../hooks/useAuctionQueries';
import type { AuctionDto } from '@/api/auction.types';

interface ResultPageWinner {
  bidId: number;
  employeeId: number;
  name: string;
  wage: number;
}

interface ResultState {
  winners?: ResultPageWinner[];
  auction?: AuctionDto;
  from?: 'home' | 'storeManage';
}

export default function AuctionResultPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const auctionId = Number(id);
  const location = useLocation();
  const state = location.state as ResultState | null;
  const entryFrom = state?.from;
  const isFirstView = Boolean(state?.winners?.length);

  const { data: detail, isLoading } = useAuctionDetail(auctionId);
  const auction = state?.auction ?? detail?.auction;
  const { data: storeInfo } = useQuery({
    queryKey: ['auction', 'store', auction?.storeId],
    queryFn: () => getStore(auction!.storeId),
    enabled: typeof auction?.storeId === 'number',
  });

  const winners: ResultPageWinner[] =
    state?.winners ??
    (() => {
      if (!detail?.bidders || !detail.auction.winnerIds.length) {
        return [];
      }

      const allBidders = [
        ...detail.bidders.group1,
        ...detail.bidders.group2,
        ...detail.bidders.group3,
      ];

      return allBidders
        .filter((bidder) =>
          detail.auction.winnerIds.includes(bidder.employeeId)
        )
        .map((bidder) => ({
          bidId: bidder.bidId,
          employeeId: bidder.employeeId,
          name: bidder.applicantName,
          wage: bidder.proposedWage,
        }));
    })();

  if (isLoading && !state) {
    return (
      <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)]">
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[var(--color-text-muted)]">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)]">
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[var(--color-text-muted)]">
            결과 데이터를 찾을 수 없습니다.
          </span>
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

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)]">
      <DetailHeader
        title="경매 결과"
        onBack={() =>
          navigate('/auction', {
            replace: true,
            state: { tab: 'completed', from: entryFrom },
          })
        }
      />

      <div className="px-3.5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col items-center gap-5">
        {isFirstView ? (
          <>
            <div className="pt-10 pb-2 flex justify-center">
              <div className="w-14 h-14 bg-[var(--color-action-schedule)]/20 rounded-full flex items-center justify-center">
                <CircleCheck
                  className="w-7 h-7 text-[var(--color-action-schedule)]"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <div className="text-center">
              <span className="text-[var(--color-text-primary)] text-xl font-bold leading-6">
                경매가 성공적으로
                <br />
                낙찰되었습니다
              </span>
            </div>
          </>
        ) : (
          <div className="w-full mt-3.5 bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-[var(--color-border-light)] overflow-hidden">
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
                    {auction.targetDate} | {auction.targetStartTime.slice(0, 5)}{' '}
                    - {auction.targetEndTime.slice(0, 5)}
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
        )}

        <div className="self-stretch flex flex-col gap-3.5">
          {winners.map((winner) => {
            const wageStr = winner.wage.toLocaleString('ko-KR');

            return (
              <div
                key={winner.bidId}
                className="self-stretch p-3.5 bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] flex flex-col gap-4"
              >
                <div className="self-stretch inline-flex justify-between items-start">
                  <span className="text-[var(--color-text-primary)] text-xl font-bold leading-8">
                    {winner.name}
                  </span>
                  <div className="px-4 py-1.5 bg-[var(--color-bg-surface)] rounded-full">
                    <span className="text-[var(--color-text-primary)] text-base font-bold leading-5">
                      {wageStr}원
                    </span>
                  </div>
                </div>

                <div className="self-stretch pt-4 border-t border-[var(--color-border-light)] flex flex-col gap-4">
                  <div className="flex flex-col">
                    <span className="text-[var(--color-text-light)] text-xs font-medium leading-4">
                      날짜 및 시간
                    </span>
                    <span className="text-[var(--color-text-secondary)] text-base font-medium leading-5">
                      {auction.targetDate} |{' '}
                      {auction.targetStartTime.slice(0, 5)} -{' '}
                      {auction.targetEndTime.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[var(--color-text-light)] text-xs font-medium leading-4">
                      근무 지점
                    </span>
                    <span className="text-[var(--color-text-secondary)] text-base font-medium leading-5">
                      {storeInfo?.storeName ?? '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={() =>
              navigate('/auction', {
                replace: true,
                state: { tab: 'completed', from: entryFrom },
              })
            }
            className="self-stretch py-4 bg-[var(--color-primary)] rounded-2xl flex justify-center items-center"
          >
            <span className="text-[var(--color-text-primary)] text-xl font-bold leading-6">
              확인
            </span>
          </button>
        </div>
      </div>

      <BottomNav activeTab="schedule" />
    </div>
  );
}
