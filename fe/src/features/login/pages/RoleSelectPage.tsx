import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import RoleCard from '../components/RoleCard';
import ownerImg from '@/assets/images/owner.png';
import workerImg from '@/assets/images/worker.png';

type Role = 'OWNER' | 'WORKER';

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleNext = () => {
    if (!selectedRole) return;
    navigate(ROUTES.SIGNUP_INFO, { state: { role: selectedRole } });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-white)]">
      {/* 헤더 */}
      <DetailHeader
        title="역할 선택"
        onBack={() => navigate(ROUTES.LOGIN)}
        accentLine
      />

      {/* 안내 메시지 */}
      <div className="px-6 pt-8 pb-6 flex flex-col gap-2">
        <h1 className="text-[length:var(--text-3xl)] font-bold text-[var(--color-text-primary)] leading-9">
          어떤 서비스로 <br />
          시작할까요?
        </h1>
        <p className="text-[length:var(--text-sm)] font-medium text-[var(--color-text-muted)] leading-5">
          사용하시려는 목적에 맞는 역할을 선택해주세요.
        </p>
      </div>

      {/* 역할 카드 */}
      <div className="flex-1 px-3.5 flex flex-col gap-4">
        <RoleCard
          role="OWNER"
          title="사장님"
          description={
            <>
              직원을 관리하고 <br />
              구인 공고를 올려보세요
            </>
          }
          image={ownerImg}
          selected={selectedRole === 'OWNER'}
          onSelect={() => setSelectedRole('OWNER')}
        />
        <RoleCard
          role="WORKER"
          title="직원"
          description="편리한 출퇴근과 급여관리를 시작해보세요"
          image={workerImg}
          selected={selectedRole === 'WORKER'}
          onSelect={() => setSelectedRole('WORKER')}
        />
      </div>

      {/* 하단 버튼 */}
      <div className="px-4 pt-4 pb-6">
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedRole}
          className="w-full h-14 bg-[var(--color-primary)] rounded-3xl shadow-md text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-7 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          선택 완료
        </button>
      </div>
    </div>
  );
}
