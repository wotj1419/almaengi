import { useCallback, useEffect, useState } from 'react';
import { Camera, ChevronRight, RefreshCw, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import NoStoreCard from '@/components/common/NoStoreCard';
import useStoreStore from '@/stores/useStoreStore';
import { generateInviteCode, getMyStores } from '@/api/store';
import { getApiErrorMessage } from '@/api/error';

type MenuItem = {
  key: 'community' | 'qr' | 'documents';
  title: string;
  description: string;
  path?: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'community',
    title: '매장 커뮤니티',
    description: '직원들에게 전달할 공지나 소통을 관리해요',
    path: ROUTES.STORE_COMMUNITY,
  },
  {
    key: 'qr',
    title: 'QR 코드 관리',
    description: '직원이 출퇴근을 인증할 QR 코드를 관리해요',
    path: ROUTES.STORE_QR,
  },
  {
    key: 'documents',
    title: '문서함',
    description: '매장 운영에 필요한 문서와 데이터를 손쉽게 관리해요',
    path: ROUTES.DOCUMENTS,
  },
];

const LIST_SECTION_CLASS =
  'mt-[var(--space-4)] mx-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] overflow-hidden';

export default function StoreManagePage() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const storedInviteCode = useStoreStore((s) => s.inviteCode);
  const storedExpiredAt = useStoreStore((s) => s.inviteCodeExpiredAt);
  const setStores = useStoreStore((s) => s.setStores);
  const setInviteCodeStore = useStoreStore((s) => s.setInviteCode);
  const [isReissuing, setIsReissuing] = useState(false);

  useEffect(() => {
    if (!currentStore) {
      getMyStores()
        .then(setStores)
        .catch(() => {});
    }
  }, [currentStore, setStores]);

  const fetchInviteCode = useCallback(
    async (storeId: number) => {
      setIsReissuing(true);
      try {
        const result = await generateInviteCode(storeId);
        setInviteCodeStore(result.inviteCode, result.expiredAt);
      } catch (error) {
        toast.error(getApiErrorMessage(error, '초대코드 발급에 실패했어요.'));
      } finally {
        setIsReissuing(false);
      }
    },
    [setInviteCodeStore]
  );

  useEffect(() => {
    if (!currentStore) return;
    const isExpired =
      !storedInviteCode ||
      !storedExpiredAt ||
      new Date() >= new Date(storedExpiredAt);
    if (isExpired) fetchInviteCode(currentStore.storeId);
  }, [currentStore, fetchInviteCode, storedInviteCode, storedExpiredAt]);

  const handleReissueCode = () => {
    if (currentStore && !isReissuing) fetchInviteCode(currentStore.storeId);
  };

  const showPreparingToast = () => {
    toast('준비 중인 기능입니다.');
  };

  const handleRegisterClick = () => {
    navigate(ROUTES.STORE_REGISTER, { state: { mode: 'edit' } });
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
      return;
    }
    showPreparingToast();
  };

  return (
    <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
      <div className="w-full md:max-w-[600px] min-h-screen flex flex-col bg-[var(--color-bg-base)]">
        <DetailHeader title="매장 관리" onBack={() => navigate(ROUTES.HOME)} />

        <main className="flex-1 pt-[var(--space-7)] pb-[calc(var(--height-bottom-nav)+40px+env(safe-area-inset-bottom,0px))]">
          {currentStore ? (
            <section className="mx-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-6 py-8 flex flex-col items-center gap-[var(--space-4)]">
              <div className="relative">
                <div className="size-24 rounded-full bg-[var(--color-bg-base)] flex items-center justify-center">
                  <div className="size-14 rounded-full border-2 border-[var(--color-border-muted)] border-dashed flex items-center justify-center">
                    <Store
                      size={26}
                      color="var(--color-text-placeholder)"
                      strokeWidth={2}
                    />
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 size-8 rounded-full border border-[var(--color-border-muted)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] flex items-center justify-center">
                  <Camera
                    size={15}
                    color="var(--color-text-muted)"
                    strokeWidth={2}
                  />
                </div>
              </div>

              <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-8">
                {currentStore.storeName}
              </h2>

              <div className="inline-flex items-center gap-[var(--space-2)]">
                <span className="text-[length:var(--text-md2)] text-[var(--color-text-secondary)]">
                  초대코드
                </span>
                <span className="text-[length:var(--text-md2)] font-medium text-[var(--color-danger)]">
                  {storedInviteCode ?? '-'}
                </span>
                <button
                  type="button"
                  onClick={handleReissueCode}
                  disabled={isReissuing}
                  className="inline-flex items-center gap-1 text-[length:var(--text-xs)] text-[var(--color-text-placeholder)] border-b border-[var(--color-border-muted)] cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} strokeWidth={2} />
                  <span>코드 재발급</span>
                </button>
              </div>

              <div className="w-full rounded-[var(--radius-md)] bg-[var(--color-bg-base)] px-[var(--space-4)] py-[var(--space-3)]">
                <div className="flex items-center justify-between gap-[var(--space-3)]">
                  <div className="min-w-0 flex flex-col gap-[var(--space-1)]">
                    <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)] truncate">
                      매장 주소: {currentStore.address}
                    </p>
                    {currentStore.phone && (
                      <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)] truncate">
                        연락처: {currentStore.phone}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRegisterClick}
                    className="h-8 shrink-0 px-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--color-border-muted)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-secondary)] cursor-pointer"
                  >
                    수정
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <NoStoreCard
              description={
                <>
                  새로운 매장을 등록하고
                  <br />
                  편리하게 직원을 관리해보세요
                </>
              }
            />
          )}

          <section className={LIST_SECTION_CLASS}>
            {MENU_ITEMS.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMenuClick(item)}
                className={`w-full px-[var(--space-5)] py-5 flex items-center justify-between text-left cursor-pointer ${
                  index < MENU_ITEMS.length - 1
                    ? 'border-b border-[var(--color-border-light)]'
                    : ''
                }`}
              >
                <div className="min-w-0 pr-4">
                  <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)] leading-5">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)] leading-5">
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  color="var(--color-text-placeholder)"
                  strokeWidth={2.2}
                  className="shrink-0"
                />
              </button>
            ))}
          </section>
        </main>

        <BottomNav activeTab="store" />
      </div>
    </div>
  );
}
