import { Bell, ChevronDown, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

interface HeaderProps {
  storeName?: string;
  hasNotification?: boolean;
  title?: string;
  onBack?: () => void;
  auctionStyle?: boolean;
}

export default function Header({
  storeName = '부산갈매기 수완점',
  hasNotification = true,
  title,
  onBack,
  auctionStyle = false,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className="relative z-[var(--z-content)] w-full shrink-0 flex items-center justify-between px-[var(--space-5)] pb-[var(--space-5)] ${auctionStyle ? 'bg-transparent : 'bg[var(--color-bg-dark)]'}'}"
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
          <div className="flex items-center gap-[9px]">
            <span
              className={`${auctionStyle ? "text-[25px] text-black font-bold font-['Noto_Sans_KR:Bold',sans-serif]" : "text-[length:var(--text-2xl)] text-white font-bold font-['Noto_Sans_KR:Bold',sans-serif]"}`}
            >
              {storeName}
            </span>
            <ChevronDown
              size={24}
              color={auctionStyle ? 'black' : 'white'}
              strokeWidth={2.3}
            />
          </div>
          <button
            onClick={() => navigate(ROUTES.NOTIFICATION)}
            className="relative cursor-pointer"
          >
            <Bell
              size={25}
              color={auctionStyle ? 'black' : 'white'}
              strokeWidth={1.95}
            />
            {hasNotification && (
              <div className="absolute top-0 right-0 size-[8px] bg-[var(--color-danger)] rounded-full border-[1.5px] border-[var(--color-bg-dark)]" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
