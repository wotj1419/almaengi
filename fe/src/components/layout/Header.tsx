import { useState } from 'react';
import { Bell, ChevronDown, ChevronLeft, LogOut, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useUnreadNotificationCount } from '@/features/notification/hooks/useNotificationQueries';
import BottomSheet from '@/components/common/BottomSheet';
import useStoreStore from '@/stores/useStoreStore';
import useAuthStore from '@/stores/useAuthStore';

interface HeaderProps {
  storeName?: string;
  hasNotification?: boolean;
  title?: string;
  onBack?: () => void;
  auctionStyle?: boolean;
  showLogout?: boolean;
  onLogout?: () => void;
}

export default function Header({
  storeName,
  hasNotification = true,
  title,
  onBack,
  auctionStyle = false,
  showLogout = false,
  onLogout,
}: HeaderProps) {
  const navigate = useNavigate();
  const [isStoreSheetOpen, setIsStoreSheetOpen] = useState(false);

  const stores = useStoreStore((s) => s.stores);
  const currentStore = useStoreStore((s) => s.currentStore);
  const selectStore = useStoreStore((s) => s.selectStore);
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);

  const displayName = currentStore?.storeName ?? storeName ?? '';
  const hasMultipleStores = stores.length > 1;

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const shouldShowNotificationBadge = hasNotification && unreadCount > 0;
  const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <>
      <div
        className={`relative z-[var(--z-content)] w-full shrink-0 flex items-center justify-between px-[var(--space-5)] pb-[var(--space-5)] ${
          auctionStyle ? 'bg-transparent' : 'bg-[var(--color-bg-dark)]'
        }`}
        style={{ paddingTop: 'calc(45px + env(safe-area-inset-top, 0px))' }}
      >
        {title ? (
          <>
            <button
              onClick={onBack ?? (() => navigate(-1))}
              className="cursor-pointer"
            >
              <ChevronLeft
                size={24}
                color={auctionStyle ? 'black' : 'white'}
                strokeWidth={2}
              />
            </button>
            <span
              className={`absolute left-1/2 -translate-x-1/2 font-bold ${
                auctionStyle
                  ? "text-[25px] text-black font-['Noto_Sans_KR:Bold',sans-serif]"
                  : 'text-[length:var(--text-2xl)] text-white'
              }`}
            >
              {title}
            </span>
            <div className="w-6" />
          </>
        ) : (
          <>
            <button
              className="flex items-center gap-[9px] cursor-pointer"
              onClick={() => hasMultipleStores && setIsStoreSheetOpen(true)}
              disabled={!hasMultipleStores}
            >
              <span
                className={`${auctionStyle ? "text-[25px] text-black font-bold font-['Noto_Sans_KR:Bold',sans-serif]" : "text-[length:var(--text-2xl)] text-white font-bold font-['Noto_Sans_KR:Bold',sans-serif]"}`}
              >
                {displayName}
              </span>
              {hasMultipleStores && (
                <ChevronDown
                  size={24}
                  color={auctionStyle ? 'black' : 'white'}
                  strokeWidth={2.3}
                />
              )}
            </button>
            <div className="flex items-center gap-[var(--space-3)]">
              {showLogout && (
                <button onClick={onLogout} className="cursor-pointer">
                  <LogOut
                    size={22}
                    color={auctionStyle ? 'black' : 'white'}
                    strokeWidth={1.95}
                  />
                </button>
              )}
              <button
                onClick={() => navigate(ROUTES.NOTIFICATION)}
                className="relative cursor-pointer"
              >
                <Bell
                  size={25}
                  color={auctionStyle ? 'black' : 'white'}
                  strokeWidth={1.95}
                />
                {shouldShowNotificationBadge && (
                  <div className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold leading-[18px] text-center border border-[var(--color-bg-dark)]">
                    {unreadLabel}
                  </div>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <BottomSheet
        isOpen={isStoreSheetOpen}
        onClose={() => setIsStoreSheetOpen(false)}
        header={
          <div className="flex items-center gap-[var(--space-2)] pb-[var(--space-3)]">
            <Store size={20} strokeWidth={1.8} />
            <p className="text-[length:var(--text-lg)] font-bold">매장 선택</p>
          </div>
        }
      >
        <ul>
          {stores.map((store) => (
            <li key={store.storeId}>
              <button
                className={`w-full text-left px-[var(--space-7)] py-[var(--space-4)] text-[length:var(--text-base)] ${
                  currentStore?.storeId === store.storeId
                    ? 'font-bold bg-[var(--color-primary)]'
                    : 'text-[var(--color-text-primary)]'
                }`}
                onClick={() => {
                  selectStore(store);
                  setActiveStoreId(store.storeId);
                  setIsStoreSheetOpen(false);
                }}
              >
                {store.storeName}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
