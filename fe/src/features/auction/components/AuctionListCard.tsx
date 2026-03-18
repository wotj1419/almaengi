import { Inbox } from 'lucide-react';
import AuctionItemCard, { type AuctionItem } from './AuctionItemCard';

interface AuctionListCardProps {
  activeTab: 'inProgress' | 'completed';
  onTabChange: (tab: 'inProgress' | 'completed') => void;
  auctions: AuctionItem[];
  onViewBids?: (id: number) => void;
  onViewResult?: (id: number) => void;
  onEdit?: (id: number) => void;
  onStop?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function AuctionListCard({
  activeTab,
  onTabChange,
  auctions,
  onViewBids,
  onViewResult,
  onEdit,
  onStop,
  onDelete,
}: AuctionListCardProps) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* 탭 필터 */}
      <div className="self-stretch inline-flex justify-center items-start gap-3">
        <button
          onClick={() => onTabChange('inProgress')}
          className={`flex-1 px-4 py-3 rounded-full inline-flex justify-center items-center ${
            activeTab === 'inProgress'
              ? 'bg-[var(--color-primary)]'
              : 'bg-[var(--color-bg-white)]'
          }`}
        >
          <span
            className={`text-center text-base font-medium leading-5 ${
              activeTab === 'inProgress'
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-primary)]'
            }`}
          >
            진행 중
          </span>
        </button>
        <button
          onClick={() => onTabChange('completed')}
          className={`flex-1 px-4 py-3 rounded-full inline-flex justify-center items-center ${
            activeTab === 'completed'
              ? 'bg-[var(--color-primary)]'
              : 'bg-[var(--color-bg-white)]'
          }`}
        >
          <span
            className={`text-center text-base font-medium leading-5 ${
              activeTab === 'completed'
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-primary)]'
            }`}
          >
            종료
          </span>
        </button>
      </div>

      {/* 경매 목록 */}
      {auctions.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {auctions.map((auction) => (
            <AuctionItemCard
              key={auction.id}
              auction={auction}
              onViewBids={() => onViewBids?.(auction.id)}
              onViewResult={() => onViewResult?.(auction.id)}
              onEdit={() => onEdit?.(auction.id)}
              onStop={() => onStop?.(auction.id)}
              onDelete={() => onDelete?.(auction.id)}
            />
          ))}
        </div>
      ) : (
        <div className="min-h-96 px-5 pt-5 pb-7 bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] flex flex-col gap-4">
          <h2 className="text-[var(--color-text-primary)] text-xl font-bold leading-7">
            {activeTab === 'inProgress' ? '진행 중 경매' : '종료된 경매'}
          </h2>
          <div className="py-5 flex flex-col items-center">
            <div className="w-16 h-16 bg-[var(--color-bg-body)] rounded-full flex items-center justify-center mb-6">
              <Inbox className="w-7 h-7 text-[var(--color-text-primary)]/30" />
            </div>
            <p className="text-[var(--color-text-primary)] text-base font-medium leading-7 mb-2">
              {activeTab === 'inProgress'
                ? '등록된 근무 경매가 없습니다'
                : '종료된 경매가 없습니다'}
            </p>
            {activeTab === 'inProgress' && (
              <p className="text-[var(--color-text-primary)]/50 text-base font-medium leading-6 text-center max-w-60">
                기피 시간대 근무를 경매로 등록하여
                <br />
                직원들이 입찰할 수 있도록 해보세요.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
