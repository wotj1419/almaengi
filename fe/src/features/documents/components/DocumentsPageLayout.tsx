import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import useAuthStore from '@/stores/useAuthStore';

interface DocumentsPageLayoutProps {
  title: string;
  children: ReactNode;
  mainClassName?: string;
  onBack?: () => void;
}

function resolveDefaultBackPath(pathname: string, role?: string) {
  if (role === 'OWNER') {
    if (
      pathname === ROUTES.DOCUMENTS_MY ||
      pathname === ROUTES.DOCUMENTS_REQUEST
    ) {
      return ROUTES.STORE;
    }
    if (pathname === ROUTES.DOCUMENTS) {
      return ROUTES.STORE;
    }
    return ROUTES.STORE;
  }

  if (role === 'EMPLOYEE') {
    if (/^\/documents\/contract\/[^/]+\/sign$/.test(pathname)) {
      return ROUTES.WORKER_DOCUMENTS;
    }
    if (pathname === ROUTES.WORKER_DOCUMENTS) {
      return ROUTES.HOME;
    }
    if (pathname.startsWith('/documents/')) {
      return ROUTES.WORKER_DOCUMENTS;
    }
  }

  return ROUTES.HOME;
}

export default function DocumentsPageLayout({
  title,
  children,
  mainClassName = '',
  onBack,
}: DocumentsPageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useAuthStore((state) => state.user?.role);
  const handleBack =
    onBack ??
    (() =>
      navigate(resolveDefaultBackPath(location.pathname, role), {
        replace: true,
      }));

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader title={title} onBack={handleBack} />
        <main className={`flex-1 ${mainClassName}`.trim()}>{children}</main>
      </div>
      <BottomNav activeTab={role === 'OWNER' ? 'store' : 'documents'} />
    </div>
  );
}
