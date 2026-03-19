import { useNavigate } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function SignupCompletePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-bg-white)] px-6">
      {/* 성공 아이콘 */}
      <div className="w-20 h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
        <CircleCheck
          size={44}
          color="var(--color-text-primary)"
          strokeWidth={2}
        />
      </div>

      {/* 축하 메시지 */}
      <h1 className="mt-6 text-[length:var(--text-3xl)] font-bold text-[var(--color-text-primary)] leading-10 text-center">
        회원가입 완료!
      </h1>
      <p className="mt-3 text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] leading-6 text-center">
        알맹이의 새로운 멤버가 되신 것을 환영합니다.
        <br />
        로그인하여 서비스를 시작해보세요.
      </p>

      {/* 로그인 하러 가기 버튼 */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
        className="mt-10 w-full max-w-80 h-14 bg-[var(--color-primary)] rounded-3xl shadow-md text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-7 cursor-pointer"
      >
        로그인 하러 가기
      </button>
    </div>
  );
}
