import { useCallback, useEffect, useState } from 'react';
import Avatar from 'boring-avatars';
import { ChevronRight, RefreshCw } from 'lucide-react';
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
  key:
    | 'community'
    | 'qr'
    | 'documents'
    | 'documentsRequest'
    | 'scheduleAuction';
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
  {
    key: 'documentsRequest',
    title: '근로계약서 작성',
    description: '직원들의 근로계약서를 작성해요.',
    path: ROUTES.DOCUMENTS_REQUEST,
  },
  {
    key: 'scheduleAuction',
    title: '스케줄 경매',
    description: '홈의 스케줄 경매와 동일한 경매 페이지로 이동해요.',
    path: ROUTES.AUCTION,
  },
];

const LIST_SECTION_CLASS =
  'mt-[var(--space-4)] mx-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] overflow-hidden';

export default function StoreManagePage() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const inviteCodes = useStoreStore((s) => s.inviteCodes);
  const setStores = useStoreStore((s) => s.setStores);
  const setInviteCodeStore = useStoreStore((s) => s.setInviteCode);

  const currentEntry = currentStore ? inviteCodes[currentStore.storeId] : null;
  const storedInviteCode = currentEntry?.code ?? null;
  const storedExpiredAt = currentEntry?.expiredAt ?? null;
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
        setInviteCodeStore(storeId, result.inviteCode, result.expiredAt);
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

  const handleAddStoreClick = () => {
    navigate(ROUTES.STORE_REGISTER, { state: { mode: 'add' } });
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.path) {
      if (item.key === 'scheduleAuction') {
        navigate(item.path, { state: { from: 'storeManage' } });
        return;
      }
      navigate(item.path);
      return;
    }
    showPreparingToast();
  };

  return (
    <div className="bg-[var(--color-bg-base)] min-h-screen">
      <div className="w-full max-w-[var(--max-w-app)] mx-auto min-h-screen flex flex-col bg-[var(--color-bg-base)]">
        <DetailHeader title="매장 관리" onBack={() => navigate(ROUTES.HOME)} />

        <main className="flex-1 pt-[var(--space-7)] pb-[calc(var(--height-bottom-nav)+40px+env(safe-area-inset-bottom,0px))]">
          {currentStore ? (
            <section className="mx-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-6 py-8 flex flex-col items-center gap-[var(--space-4)]">
              <div>
                <Avatar
                  size={58}
                  name={`store-${currentStore.storeId}`}
                  variant="beam"
                />
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
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMenuClick(item)}
                className="w-full px-[var(--space-5)] py-5 flex items-center justify-between text-left cursor-pointer border-b border-[var(--color-border-light)]"
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
            {currentStore && (
              <button
                type="button"
                onClick={handleAddStoreClick}
                className="w-full px-[var(--space-5)] py-5 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)] leading-5">
                    추가 매장 등록하기
                  </p>
                  <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)] leading-5">
                    새로운 매장을 추가로 등록해요
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  color="var(--color-text-placeholder)"
                  strokeWidth={2.2}
                  className="shrink-0"
                />
              </button>
            )}
          </section>
        </main>

        <BottomNav activeTab="store" />
      </div>
    </div>
  );
}
