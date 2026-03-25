import type { ReactNode } from 'react';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import useAuthStore from '@/stores/useAuthStore';

interface DocumentsPageLayoutProps {
  title: string;
  children: ReactNode;
  mainClassName?: string;
  onBack?: () => void;
}

export default function DocumentsPageLayout({
  title,
  children,
  mainClassName = '',
  onBack,
}: DocumentsPageLayoutProps) {
  const role = useAuthStore((state) => state.user?.role);

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader title={title} onBack={onBack} />
        <main className={`flex-1 ${mainClassName}`.trim()}>{children}</main>
      </div>
      <BottomNav activeTab={role === 'OWNER' ? 'store' : 'documents'} />
    </div>
  );
}
