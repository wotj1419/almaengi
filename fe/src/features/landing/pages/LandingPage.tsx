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

        {/* Title area */}
        <section className="mt-8 flex w-full max-w-96 flex-col">
          <h1 className="text-[28px] font-extrabold leading-10 text-black tracking-tight">
            현명한 사장님의 첫 발걸음
            <br />
            알맹이와 함께하는 매장
          </h1>
          <p className="mt-3 text-[16px] font-medium text-[var(--color-text-muted)]">
            1분이면 회원가입 가능!
          </p>
        </section>

        {/* Image Area with Radiating Lines */}
        <section className="relative mt-8 flex h-[300px] w-full items-center justify-center">
          {/* Radiating lines SVG */}
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

          {/* Center Circle */}
          <div className="relative z-10 flex h-[240px] w-[240px] items-center justify-center rounded-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
            <div className="flex h-full w-full items-center justify-center rounded-full overflow-hidden">
              <img
                src={landingImg}
                alt="알맹이 서비스 대표 이미지"
                className="h-[170px] w-[170px] object-contain opacity-95"
              />
            </div>
          </div>
        </section>

        {/* Login Buttons Area */}
        <section className="mt-8 flex w-full max-w-96 flex-col">
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="flex h-14 w-full items-center justify-center rounded-[28px] bg-[#dcf351] text-[18px] font-bold text-black border border-transparent shadow-sm transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            알맹이 아이디로 로그인
          </button>

          <div className="mt-10 flex items-center justify-center gap-4 px-4">
            <div className="h-px flex-1 bg-[var(--color-border-light)]" />
            <span className="text-[13px] font-medium text-[var(--color-text-placeholder)]">
              간편 로그인
            </span>
            <div className="h-px flex-1 bg-[var(--color-border-light)]" />
          </div>

          <div className="mt-8 flex items-center justify-center gap-5">
            <button
              type="button"
              disabled
              className="flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full bg-[#03C75A] opacity-95 transition-transform"
            >
              <span className="text-[22px] font-extrabold text-white leading-none">
                N
              </span>
            </button>
            <button
              type="button"
              disabled
              className="flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full bg-[#FEE500] opacity-95 transition-transform"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="#191919"
              >
                <path d="M12 3C6.477 3 2 6.551 2 10.93c0 2.822 1.848 5.291 4.675 6.634-.34 1.258-1.233 4.545-1.258 4.654-.031.141.054.215.158.15 1.517-1.025 5.518-3.774 5.518-3.774 1.253.307 2.56.368 3.907.368 5.523 0 10-3.551 10-7.93C24 6.55 19.523 3 12 3z" />
              </svg>
            </button>
            <button
              type="button"
              disabled
              className="flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full bg-[#111111] opacity-95 transition-transform"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                width="20"
                height="20"
                fill="white"
              >
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
