import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import { getMyEmployeeStores } from '@/api/store';
import { logout } from '@/api/auth';
import useStoreStore from '@/stores/useStoreStore';
import useAuthStore from '@/stores/useAuthStore';

export default function StoreJoinPendingPage() {
  const navigate = useNavigate();
  const setStores = useStoreStore((s) => s.setStores);
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);
  const authLogout = useAuthStore((s) => s.logout);

  const [isChecking, setIsChecking] = useState(false);

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

  const handleCheckApprovalStatus = async () => {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const stores = await getMyEmployeeStores();

      if (stores.length > 0) {
        localStorage.removeItem('pendingJoin');
        setStores(stores);

        const nextActiveId =
          stores.length === 1
            ? stores[0].storeId
            : Math.min(...stores.map((s) => s.storeId));
        setActiveStoreId(nextActiveId);

        toast.success('승인되었어요. 홈으로 이동합니다.');
        navigate(ROUTES.HOME, { replace: true });
      } else {
        toast('아직 승인되지 않았어요. 잠시 후 다시 확인해주세요.');
      }
    } catch {
      toast.error('승인 상태 확인 중 오류가 발생했어요.');
    } finally {
      setIsChecking(false);
    }
  };

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
    <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
      <div className="w-full md:max-w-[600px] min-h-screen flex flex-col bg-[var(--color-bg-base)]">
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
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-[600px] bg-[var(--color-bg-base)] px-[var(--space-5)] pt-[var(--space-4)]"
          style={{
            paddingBottom:
              'calc(var(--space-7) + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="flex flex-col gap-[var(--space-3)]">
            <button
              type="button"
              onClick={() => void handleCheckApprovalStatus()}
              disabled={isChecking}
              className={`w-full h-14 rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] text-[length:var(--text-md2)] font-bold transition-colors ${
                isChecking
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-placeholder)] cursor-not-allowed'
                  : 'bg-[var(--color-primary)] text-[var(--color-text-primary)] cursor-pointer'
              }`}
            >
              {isChecking ? '확인 중...' : '승인 상태 확인'}
            </button>
            <button
              type="button"
              onClick={() => void handleRetryCode()}
              disabled={isChecking}
              className="w-full h-14 rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] text-[length:var(--text-md2)] font-bold text-[var(--color-primary)] bg-[var(--color-bg-white)] border border-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-base)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              코드 다시 입력
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isChecking}
              className="w-full py-3 text-[length:var(--text-md)] font-medium text-[var(--color-text-placeholder)] transition-colors hover:text-[var(--color-text-secondary)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
