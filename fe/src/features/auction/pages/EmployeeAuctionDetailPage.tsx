import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, MapPin, Timer, Users, WalletMinimal } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/layout/DetailHeader';
import { getMyEmployeeStores, getStore } from '@/api/store';
import useAuthStore from '@/stores/useAuthStore';
import { useAuctionDetail, useBidAuction } from '../hooks/useAuctionQueries';

export default function EmployeeAuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auctionId = Number(id);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  const { data: detail } = useAuctionDetail(auctionId);
  const bidMutation = useBidAuction();

  const [bidWageInput, setBidWageInput] = useState('');
  const [error, setError] = useState('');

  const auction = detail?.auction;
  const resolvedStoreId = auction?.storeId ?? activeStoreId;
  const { data: storeInfo } = useQuery({
    queryKey: ['auction', 'store', resolvedStoreId],
    queryFn: () => getStore(resolvedStoreId!),
    enabled: typeof resolvedStoreId === 'number',
  });
  const { data: myEmployeeStores = [] } = useQuery({
    queryKey: ['employee', 'stores'],
    queryFn: getMyEmployeeStores,
  });
  const fallbackStoreName =
    myEmployeeStores.find((store) => store.storeId === resolvedStoreId)
      ?.storeName ?? null;

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

  const minWage = auction.minWage;
  const maxWage = auction.maxWage;
  const bidWage = Number(bidWageInput.replace(/,/g, ''));

  const getValidationError = (
    value: string,
    options?: { checkEmpty?: boolean; checkRangeImmediately?: boolean }
  ): string => {
    const checkEmpty = options?.checkEmpty ?? false;
    const checkRangeImmediately = options?.checkRangeImmediately ?? true;

    if (!value.trim()) {
      return checkEmpty ? '시급을 입력해 주세요' : '';
    }

    const numericBidWage = Number(value);
    if (Number.isNaN(numericBidWage)) return '시급을 입력해 주세요';

    if (!checkRangeImmediately && value.length < 5) {
      return '';
    }

    if (numericBidWage > maxWage) {
      return `시급 상한가(${maxWage.toLocaleString()}원)를 초과할 수 없습니다`;
    }
    if (numericBidWage < minWage) {
      return `시급 하한가(${minWage.toLocaleString()}원)보다 낮게 입찰할 수 없습니다`;
    }
    return '';
  };

  const handleInputChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 5);
    setBidWageInput(numericValue);
    setError(
      getValidationError(numericValue, {
        checkEmpty: false,
        checkRangeImmediately: false,
      })
    );
  };

  const handleBid = () => {
    const validationError = getValidationError(bidWageInput, {
      checkEmpty: true,
      checkRangeImmediately: true,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    bidMutation.mutate(
      { auctionId, body: { bidWage } },
      {
        onSuccess: () => {
          toast.success('입찰이 성공적으로 접수되었습니다.');
          navigate(-1);
        },
        onError: (err: unknown) => {
          const status =
            err &&
            typeof err === 'object' &&
            'response' in err &&
            (err as { response?: { status?: number } }).response?.status;
          if (status === 429) {
            toast.error(
              '처리가 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
            );
          } else {
            toast.error('입찰에 실패했습니다.');
          }
        },
      }
    );
  };

  const isButtonDisabled =
    !bidWageInput.trim() ||
    Boolean(
      getValidationError(bidWageInput, {
        checkEmpty: true,
        checkRangeImmediately: true,
      })
    ) ||
    bidMutation.isPending;

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)]">
      <DetailHeader title="경매 참가" onBack={() => navigate(-1)} />

      <main className="px-[var(--space-5)] pt-[var(--space-4)] pb-[var(--pb-content)] flex flex-col gap-[var(--space-4)]">
        <div className="w-full bg-[var(--color-bg-white)] border border-[var(--color-border-light)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-form-card)] overflow-hidden">
          <div className="p-[var(--space-5)] flex flex-col gap-[var(--space-3)]">
            <div className="inline-flex items-center gap-[var(--space-2)]">
              <Timer
                className="w-4 h-4 text-[var(--color-text-sub)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-sub)] text-[length:var(--text-base)] font-medium leading-5">
                경매 잔여 시간:{' '}
                <span className="text-[var(--color-text-primary)]">
                  {remainingTimeStr}
                </span>
              </span>
            </div>

            <div className="inline-flex items-center gap-[var(--space-2)]">
              <Users
                className="w-4 h-4 text-[var(--color-text-sub)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-sub)] text-[length:var(--text-base)] font-medium leading-5">
                모집 인원:{' '}
                <span className="text-[var(--color-text-primary)]">
                  {auction.recruitCount}명
                </span>
              </span>
            </div>

            <div className="inline-flex items-center gap-[var(--space-2)]">
              <Clock
                className="w-4 h-4 text-[var(--color-text-sub)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-sub)] text-[length:var(--text-base)] font-medium leading-5">
                근무 시간:{' '}
                <span className="text-[var(--color-text-primary)]">
                  {auction.targetDate} | {auction.targetStartTime.slice(0, 5)} -{' '}
                  {auction.targetEndTime.slice(0, 5)}
                </span>
              </span>
            </div>

            <div className="inline-flex items-center gap-[var(--space-2)]">
              <MapPin
                className="w-4 h-4 text-[var(--color-text-sub)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-sub)] text-[length:var(--text-base)] font-medium leading-5">
                근무 지점:{' '}
                <span className="text-[var(--color-text-primary)]">
                  {storeInfo?.storeName ?? fallbackStoreName ?? '-'}
                </span>
              </span>
            </div>

            <div className="inline-flex items-center gap-[var(--space-2)]">
              <WalletMinimal
                className="w-4 h-4 text-[var(--color-text-sub)]"
                strokeWidth={2}
              />
              <span className="text-[var(--color-text-sub)] text-[length:var(--text-base)] font-medium leading-5">
                시급 범위:{' '}
                <span className="text-[var(--color-status-orange-dot)]">
                  {minWage.toLocaleString()}원
                </span>
                <span className="text-[var(--color-text-muted)]"> ~ </span>
                <span className="text-[var(--color-action-schedule)]">
                  {maxWage.toLocaleString()}원
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="w-full bg-[var(--color-bg-white)] border border-[var(--color-border-light)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-5)] flex flex-col gap-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-2)]">
            <label className="text-[var(--color-text-sub)] text-[length:var(--text-sm)] font-medium leading-5">
              희망 시급
            </label>
            <div className="flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-[var(--radius-md)] focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all">
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={bidWageInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="시급 입력"
                className="flex-1 bg-transparent text-[var(--color-text-primary)] text-[length:var(--text-ml)] font-semibold leading-5 outline-none placeholder:text-[var(--color-text-placeholder)] placeholder:font-medium"
              />
              <span className="text-[var(--color-text-sub)] text-[length:var(--text-base)] font-medium">
                원
              </span>
            </div>

            {error && (
              <p className="text-[var(--color-danger)] text-[length:var(--text-xs)] font-medium leading-4 mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-[var(--space-3)]">
            <span className="text-[var(--color-text-sub)] text-[length:var(--text-xs)] font-medium">
              최고 시급{' '}
              <span className="text-[var(--color-action-schedule)] font-bold ml-1">
                {maxWage.toLocaleString()}원
              </span>
            </span>
            <span className="text-[var(--color-border-muted)]">|</span>
            <span className="text-[var(--color-text-sub)] text-[length:var(--text-xs)] font-medium">
              최저 시급{' '}
              <span className="text-[var(--color-status-orange-dot)] font-bold ml-1">
                {minWage.toLocaleString()}원
              </span>
            </span>
          </div>

          <button
            onClick={handleBid}
            disabled={isButtonDisabled}
            className={`w-full h-12 rounded-[var(--radius-md)] inline-flex justify-center items-center transition-all ${
              isButtonDisabled
                ? 'bg-[var(--color-bg-surface)] opacity-50 cursor-not-allowed'
                : 'bg-[var(--color-primary)] active:scale-[0.98]'
            }`}
          >
            <span
              className={`text-[length:var(--text-md2)] font-bold leading-5 ${
                isButtonDisabled
                  ? 'text-[var(--color-text-muted)]'
                  : 'text-[var(--color-text-primary)]'
              }`}
            >
              {bidMutation.isPending ? '입찰 중...' : '입찰하기'}
            </span>
          </button>
        </div>
      </main>

      <BottomNav activeTab="schedule" />
    </div>
  );
}
