import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import { logout } from '@/api/auth';
import useStoreStore from '@/stores/useStoreStore';
import useAuthStore from '@/stores/useAuthStore';

export default function StoreJoinPendingPage() {
  const navigate = useNavigate();
  const setStores = useStoreStore((s) => s.setStores);
  const authLogout = useAuthStore((s) => s.logout);

  const handleBackToLogin = useCallback(async () => {
    try {
      await logout();
    } catch {
      // no-op
    } finally {
      localStorage.removeItem('pendingJoin');
      authLogout();
      setStores([]);
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [authLogout, setStores, navigate]);

  const handleRetryCode = () => {
    localStorage.removeItem('pendingJoin');
    navigate(ROUTES.STORE_JOIN, { replace: true });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // no-op
    } finally {
      localStorage.removeItem('pendingJoin');
      authLogout();
      setStores([]);
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      void handleBackToLogin();
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBackToLogin]);

  return (
    <div className="bg-[var(--color-bg-base)] min-h-screen">
      <div className="w-full max-w-[var(--max-w-app)] mx-auto min-h-screen flex flex-col bg-[var(--color-bg-base)]">
        <DetailHeader
          title="매장 합류"
          onBack={() => void handleBackToLogin()}
        />

        <main className="flex-1 px-[var(--space-5)] pt-[var(--space-7)] flex flex-col items-center justify-center">
          <div className="flex flex-col gap-[var(--space-6)] items-center text-center">
            <div className="text-5xl">...</div>
            <div className="flex flex-col gap-[var(--space-2)]">
              <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)]">
                사장님 승인 대기 중
              </h2>
              <p className="text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
                초대 코드가 확인되었어요.{'\n'}
                사장님의 승인 후 매장에 합류할 수 있습니다.
              </p>
            </div>
          </div>
        </main>

        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--max-w-app)] bg-[var(--color-bg-base)] px-[var(--space-5)] pt-[var(--space-4)]"
          style={{
            paddingBottom:
              'calc(var(--space-7) + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="flex flex-col gap-[var(--space-3)]">
            <button
              type="button"
              onClick={() => void handleRetryCode()}
              className="w-full h-14 rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] text-[length:var(--text-md2)] font-bold text-[var(--color-primary)] bg-[var(--color-bg-white)] border border-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-base)]"
            >
              코드 다시 입력
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full py-3 text-[length:var(--text-md)] font-medium text-[var(--color-text-placeholder)] transition-colors hover:text-[var(--color-text-secondary)]"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
