import { useNavigate, useParams } from 'react-router-dom';
import DetailHeader from '@/components/common/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { ROUTES } from '@/constants/routes';

// 근로계약서 페이지 - 현재 플레이스홀더, 다음 스프린트에서 계약서 기능 연결 예정
export default function EmployeeContractPage() {
  const navigate = useNavigate();
  const { employeeId } = useParams();

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader
          title="근로계약서"
          onBack={() =>
            navigate(
              ROUTES.EMPLOYEE_DETAIL.replace(':employeeId', employeeId ?? '')
            )
          }
        />

        <main className="flex flex-1 items-center justify-center px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-9)+env(safe-area-inset-bottom,0px))] pt-[var(--space-4)]">
          <section className="w-full rounded-[var(--radius-xl)] bg-[var(--color-bg-white)] px-[var(--space-6)] py-[var(--space-7)] text-center shadow-[var(--shadow-form-card)]">
            <h1 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
              근로계약서 페이지 준비 중
            </h1>
            <p className="mt-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
              계약서 화면은 다음 단계에서 연결됩니다.
            </p>
          </section>
        </main>
      </div>

      <BottomNav activeTab="staff" />
    </div>
  );
}
