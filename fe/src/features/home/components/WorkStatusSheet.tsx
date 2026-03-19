import { useState } from 'react';
import { Phone } from 'lucide-react';
import Avatar from 'boring-avatars';
import BottomSheet from '@/components/common/BottomSheet';
import PhoneCallModal from '@/features/home/components/PhoneCallModal';

interface Employee {
  name: string;
  phone: string;
  schedule: string;
  status: '근무 중' | '지각' | '결근' | '휴게 중';
}

interface WorkStatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filter: 'green' | 'orange' | 'purple' | 'grey' | null;
}

// 임시 목 데이터 (나중에 API 연동 시 교체)
const mockEmployees: Employee[] = [
  {
    name: '박알바',
    phone: '010-1234-5678',
    schedule: '09:00 - 18:00',
    status: '근무 중',
  },
  {
    name: '차알바',
    phone: '010-1234-5678',
    schedule: '09:00 - 18:00',
    status: '근무 중',
  },
  {
    name: '함알바',
    phone: '010-2345-6789',
    schedule: '09:00 - 14:00',
    status: '휴게 중',
  },
  {
    name: '김알바',
    phone: '010-1234-5678',
    schedule: '09:00 - 18:00',
    status: '근무 중',
  },
  {
    name: '이알바',
    phone: '010-3456-7890',
    schedule: '11:00 - 18:00',
    status: '지각',
  },
  {
    name: '정알바',
    phone: '010-3456-7890',
    schedule: '11:00 - 18:00',
    status: '지각',
  },
  {
    name: '최알바',
    phone: '010-4567-8901',
    schedule: '09:00 - 12:00',
    status: '결근',
  },
  {
    name: '한알바',
    phone: '010-5678-9012',
    schedule: '10:00 - 19:00',
    status: '근무 중',
  },
  {
    name: '송알바',
    phone: '010-6789-0123',
    schedule: '08:00 - 17:00',
    status: '휴게 중',
  },
];

const statusColorMap = {
  green: '근무 중',
  grey: '휴게 중',
  orange: '지각',
  purple: '결근',
} as const;

const statusBadgeStyles: Record<
  string,
  { bg: string; border: string; dot: string; avatarBg: string }
> = {
  '근무 중': {
    bg: 'bg-[var(--color-status-green-bg)]',
    border: 'border-[var(--color-status-green-border)]',
    dot: 'bg-[var(--color-status-green-dot)]',
    avatarBg: 'bg-[var(--color-status-green-border)]',
  },
  지각: {
    bg: 'bg-[var(--color-status-orange-bg)]',
    border: 'border-[var(--color-status-orange-border)]',
    dot: 'bg-[var(--color-status-orange-dot)]',
    avatarBg: 'bg-[var(--color-status-orange-border)]',
  },
  결근: {
    bg: 'bg-[var(--color-status-purple-bg)]',
    border: 'border-[var(--color-status-purple-border)]',
    dot: 'bg-[var(--color-status-purple-dot)]',
    avatarBg: 'bg-[var(--color-status-purple-border)]',
  },
  '휴게 중': {
    bg: 'bg-[var(--color-status-grey-bg)]',
    border: 'border-[var(--color-status-grey-border)]',
    dot: 'bg-[var(--color-status-grey-dot)]',
    avatarBg: 'bg-[var(--color-status-grey-border)]',
  },
};

export default function WorkStatusSheet({
  isOpen,
  onClose,
  filter,
}: WorkStatusSheetProps) {
  const [phoneModal, setPhoneModal] = useState<Employee | null>(null);

  const filtered = filter
    ? mockEmployees.filter((e) =>
        filter === 'green'
          ? e.status === '근무 중' || e.status === '휴게 중'
          : e.status === statusColorMap[filter]
      )
    : mockEmployees;

  const title = filter ? statusColorMap[filter] : '매장 근무 현황';

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        header={
          <div className="flex items-center justify-between mb-[var(--space-6)]">
            <span className="text-[length:var(--text-lg)] font-bold text-[color:var(--color-text-primary)]">
              {title}
            </span>
            <span className="text-[length:var(--text-base)] text-[color:var(--color-text-placeholder)] font-medium">
              총 {filtered.length}명
            </span>
          </div>
        }
      >
        <div className="px-[var(--space-7)] pb-[var(--space-7)]">
          {/* 직원 리스트 */}
          <div className="flex flex-col gap-[var(--space-3)]">
            {filtered.map((employee) => (
              <div
                key={employee.name}
                className="flex items-center gap-[var(--space-4)] bg-[var(--color-bg-card)] rounded-[var(--radius-md)] px-[var(--space-6)] py-[14px]"
              >
                {/* 아바타 */}
                <div
                  className={`shrink-0 rounded-full border-2 p-[1px] overflow-hidden ${statusBadgeStyles[employee.status].border} ${statusBadgeStyles[employee.status].avatarBg}`}
                >
                  <Avatar name={employee.name} size={34} variant="beam" />
                </div>

                {/* 이름 + 시간 */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]">
                    {employee.name}
                  </span>
                  <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-placeholder)]">
                    {employee.schedule}
                  </span>
                </div>

                {/* 상태 뱃지 */}
                <span
                  className={`flex items-center gap-[5px] text-[length:var(--text-xs)] font-bold text-[color:var(--color-text-secondary)] px-[var(--space-3)] py-[2px] rounded-full shrink-0 border-[1.5px] ${statusBadgeStyles[employee.status].bg} ${statusBadgeStyles[employee.status].border}`}
                >
                  <span
                    className={`size-[6px] rounded-full ${statusBadgeStyles[employee.status].dot}`}
                  />
                  {employee.status}
                </span>

                {/* 전화 아이콘 */}
                <button
                  onClick={() => setPhoneModal(employee)}
                  className="shrink-0 p-[7px]"
                >
                  <Phone
                    size={20}
                    color="var(--color-icon-default)"
                    fill="var(--color-icon-default)"
                    strokeWidth={0}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* 전화 걸기 모달 */}
      {phoneModal && (
        <PhoneCallModal
          isOpen={!!phoneModal}
          onClose={() => setPhoneModal(null)}
          name={phoneModal.name}
          phone={phoneModal.phone}
        />
      )}
    </>
  );
}
