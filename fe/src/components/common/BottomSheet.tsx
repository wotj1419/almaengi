import { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  header,
  children,
}: BottomSheetProps) {
  // 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-bottom-sheet)]">
      {/* 딤 배경 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* 시트 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] bg-white rounded-t-[var(--radius-xl)] max-h-[50vh] flex flex-col animate-slide-up">
        {/* 핸들 바 */}
        <div className="flex justify-center pt-[var(--space-4)] pb-[var(--space-2)] shrink-0">
          <div className="w-[40px] h-[4px] bg-[var(--color-border-muted)] rounded-full" />
        </div>
        {/* 고정 헤더 */}
        {header && <div className="shrink-0 px-[var(--space-7)]">{header}</div>}
        {/* 콘텐츠 */}
        <div className="overflow-y-auto flex-1 pb-[env(safe-area-inset-bottom,0px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
