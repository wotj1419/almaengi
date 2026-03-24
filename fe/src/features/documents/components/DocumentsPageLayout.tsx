import type { ReactNode } from 'react';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';

interface DocumentsPageLayoutProps {
  title: string;
  children: ReactNode;
  mainClassName?: string;
}

export default function DocumentsPageLayout({
  title,
  children,
  mainClassName = '',
}: DocumentsPageLayoutProps) {
  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader title={title} />
        <main className={`flex-1 ${mainClassName}`.trim()}>{children}</main>
      </div>
      <BottomNav activeTab="store" />
    </div>
  );
}
