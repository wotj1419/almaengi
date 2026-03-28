import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import landingImg from '@/assets/images/almangi_main.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[600px] flex-col items-center overflow-hidden px-[var(--space-7)] pt-14 pb-[var(--space-8)]">
        <div className="pointer-events-none absolute -left-10 -top-16 h-64 w-64 rounded-full bg-[var(--color-primary)] opacity-10 blur-[32px]" />
        <div className="pointer-events-none absolute -right-14 bottom-4 h-72 w-72 rounded-full bg-[var(--color-primary)] opacity-15 blur-[32px]" />

        <section className="mt-8 flex w-full max-w-96 flex-col">
          <h1 className="text-[28px] font-extrabold leading-10 text-black tracking-tight">
            알바생과 사장님의 첫 걸음
            <br />
            알맹이가 함께하는 매장
          </h1>
          <p className="mt-3 text-[16px] font-medium text-[var(--color-text-muted)]">
            1분이면 회원가입 가능
          </p>
        </section>

        <section className="relative mt-8 flex h-[300px] w-full items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 320 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g stroke="#ED6B4B" strokeWidth="4" strokeLinecap="round">
              <line x1="125" y1="100" x2="110" y2="70" />
              <line x1="105" y1="125" x2="70" y2="110" />
              <line x1="215" y1="125" x2="250" y2="135" />
              <line x1="195" y1="100" x2="210" y2="70" />
              <line x1="215" y1="195" x2="245" y2="215" />
              <line x1="105" y1="195" x2="80" y2="205" />
            </g>
          </svg>

          <div className="relative z-10 flex h-[240px] w-[240px] items-center justify-center rounded-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
              <img
                src={landingImg}
                alt="알맹이 서비스 대표 이미지"
                className="h-[170px] w-[170px] object-contain opacity-95"
              />
            </div>
          </div>
        </section>

        <section className="mt-8 flex w-full max-w-96 flex-col">
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="flex h-14 w-full items-center justify-center rounded-[28px] border border-transparent bg-[#dcf351] text-[18px] font-bold text-black shadow-sm transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            알맹이 아이디로 로그인
          </button>
        </section>
      </div>
    </div>
  );
}
