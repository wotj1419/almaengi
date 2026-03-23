import { Plus, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function NoStoreCard() {
  const navigate = useNavigate();

  return (
    <section className="mx-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-6 py-8 flex flex-col items-center gap-6">
      <div className="size-24 rounded-full bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="size-14 rounded-full border-2 border-[var(--color-border-muted)] border-dashed flex items-center justify-center">
          <Store
            size={26}
            color="var(--color-text-placeholder)"
            strokeWidth={2}
          />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-8">
          등록된 매장이 없습니다
        </h2>
        <p className="mt-2 text-[length:var(--text-md2)] text-[var(--color-text-muted)] leading-6">
          새로운 매장을 등록하고
          <br />
          편리하게 직원을 관리해보세요
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate(ROUTES.STORE_REGISTER)}
        className="w-full max-w-[280px] h-14 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-text-primary)] font-bold text-[length:var(--text-md2)] shadow-[var(--shadow-form-card)] inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={18} color="var(--color-text-primary)" strokeWidth={2.6} />
        <span>새 매장 등록하기</span>
      </button>
    </section>
  );
}
