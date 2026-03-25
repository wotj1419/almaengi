import {
  useEffect,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { login } from '@/api/auth';
import { validateSessionByReissue } from '@/api/session';
import { getMyStoresWithToken } from '@/api/store';
import useAuthStore from '@/stores/useAuthStore';
import ConfirmModal from '@/components/common/ConfirmModal';

const INPUT_CLASS =
  'h-14 px-4 bg-[var(--color-bg-white)] rounded-[var(--radius-xl)] border border-[var(--color-border-muted)] text-[length:var(--text-base)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none';

const TEST_ACCOUNTS = [
  {
    label: '사장 테스트 로그인',
    email: 'owner@test.com',
    password: 'Test1234!',
  },
  {
    label: '직원 테스트 로그인',
    email: 'employee@test.com',
    password: 'Test1234!',
  },
] as const;

const IS_TEST_LOGIN_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true';

interface LabeledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: ReactNode;
}

function LabeledInput({
  label,
  suffix,
  className,
  ...inputProps
}: LabeledInputProps) {
  return (
    <div className="flex flex-col">
      <label className="pb-2 text-[length:var(--text-sm)] font-medium text-[var(--color-text-secondary)] leading-5">
        {label}
      </label>
      {suffix ? (
        <div className="relative">
          <input
            className={`w-full pr-12 ${INPUT_CLASS} ${className ?? ''}`}
            {...inputProps}
          />
          {suffix}
        </div>
      ) : (
        <input
          className={`${INPUT_CLASS} ${className ?? ''}`}
          {...inputProps}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const authStatus = await validateSessionByReissue();
      if (!isMounted) return;

      if (authStatus === 'authenticated') {
        navigate(ROUTES.HOME, { replace: true });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const resolveActiveStoreId = async (accessToken: string) => {
    try {
      const stores = await getMyStoresWithToken(accessToken);
      if (stores.length === 1) return stores[0].storeId;
      if (stores.length > 1) {
        return Math.min(...stores.map((store) => store.storeId));
      }
    } catch {
      return null;
    }

    return null;
  };

  const loginWithCredentials = async (
    nextEmail: string,
    nextPassword: string
  ) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await login({ email: nextEmail, password: nextPassword });
      if (res.status !== 'SUCCESS') {
        setErrorMessage(res.message || '로그인에 실패했습니다.');
        setShowErrorModal(true);
        return;
      }

      const activeStoreId = await resolveActiveStoreId(res.data.accessToken);

      authLogin(
        { id: res.data.userId, name: res.data.name, role: res.data.role },
        res.data.accessToken,
        activeStoreId
      );

      navigate(ROUTES.HOME, { replace: true });
    } catch {
      setErrorMessage('서버와 연결할 수 없습니다.');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    void loginWithCredentials(email, password);
  };

  const handleTestLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    void loginWithCredentials(testEmail, testPassword);
  };

  return (
    <div className="min-h-dvh px-[var(--space-6)] py-14 bg-[var(--color-bg-base)] flex justify-center items-center">
      <div className="w-full max-w-96 bg-[var(--color-bg-white)] rounded-[var(--radius-xl)] shadow-xl border border-[var(--color-border-light)] flex flex-col overflow-hidden">
        <div className="grid grid-cols-[20px_1fr_20px] items-center p-3.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-5 w-5 items-center justify-center cursor-pointer"
          >
            <ChevronLeft
              size={20}
              color="var(--color-text-primary)"
              strokeWidth={2}
            />
          </button>
          <span className="text-center text-[length:var(--text-xl)] font-bold text-black leading-6">
            알맹이
          </span>
          <div aria-hidden="true" className="h-5 w-5" />
        </div>

        <div className="px-6 pt-8 pb-4 flex flex-col gap-2">
          <h1 className="text-[length:var(--text-3xl)] font-bold text-[var(--color-text-primary)] leading-10">
            환영합니다!
          </h1>
          <p className="text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] leading-6">
            알맹이에 로그인하여 시작하세요.
          </p>
        </div>

        <form onSubmit={handleLogin} className="px-6 py-4 flex flex-col gap-4">
          <LabeledInput
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
          />

          <LabeledInput
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff size={20} color="var(--color-text-placeholder)" />
                ) : (
                  <Eye size={20} color="var(--color-text-placeholder)" />
                )}
              </button>
            }
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full h-14 bg-[var(--color-primary)] rounded-3xl text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-7 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {IS_TEST_LOGIN_ENABLED && (
          <div className="px-6 pb-4 flex flex-col gap-2">
            <p className="text-center text-[length:var(--text-sm)] font-medium text-[var(--color-text-muted)]">
              테스트 계정으로 바로 로그인
            </p>
            {TEST_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleTestLogin(account.email, account.password)}
                disabled={isSubmitting}
                className="w-full h-11 border border-[var(--color-border-muted)] rounded-[var(--radius-lg)] text-[length:var(--text-sm)] font-semibold text-[var(--color-text-primary)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {account.label}
              </button>
            ))}
          </div>
        )}

        <div className="px-6 pt-4 pb-10 flex justify-center gap-1">
          <span className="text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] leading-5">
            계정이 없으신가요?
          </span>
          <Link
            to={ROUTES.SIGNUP}
            className="text-[length:var(--text-base)] font-medium text-[var(--color-primary)] leading-5"
          >
            회원가입
          </Link>
        </div>

        <div className="h-2 bg-[var(--color-primary)]" />
      </div>

      <ConfirmModal
        isOpen={showErrorModal}
        title="로그인 실패"
        description={errorMessage}
        showCloseButton
        confirmText=""
        cancelText=""
        onConfirm={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
}
