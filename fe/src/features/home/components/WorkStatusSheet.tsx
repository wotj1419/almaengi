import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import Avatar from 'boring-avatars';
import BottomSheet from '@/components/common/BottomSheet';
import PhoneCallModal from '@/features/home/components/PhoneCallModal';
import { getDashboardDetail, type DashboardEmployee } from '@/api/attendance';
import useStoreStore from '@/stores/useStoreStore';

interface WorkStatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  apiStatus: 'working' | 'late' | 'absent' | null;
}

const statusLabelMap: Record<string, '근무 중' | '지각' | '결근'> = {
  working: '근무 중',
  late: '지각',
  absent: '결근',
};

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
};

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default function WorkStatusSheet({
  isOpen,
  onClose,
  apiStatus,
}: WorkStatusSheetProps) {
  const [employees, setEmployees] = useState<DashboardEmployee[]>([]);
  const [phoneModal, setPhoneModal] = useState<DashboardEmployee | null>(null);
  const currentStore = useStoreStore((s) => s.currentStore);

  useEffect(() => {
    if (!isOpen || !apiStatus || !currentStore) return;
    getDashboardDetail(currentStore.storeId, apiStatus)
      .then((res) => setEmployees(res.employees))
      .catch(() => setEmployees([]));
  }, [isOpen, apiStatus, currentStore]);

  const statusLabel = apiStatus ? statusLabelMap[apiStatus] : '매장 근무 현황';
  const badgeStyle =
    statusLabel !== '매장 근무 현황'
      ? statusBadgeStyles[statusLabel]
      : statusBadgeStyles['근무 중'];

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        header={
          <div className="flex items-center justify-between mb-[var(--space-6)]">
            <span className="text-[length:var(--text-lg)] font-bold text-[color:var(--color-text-primary)]">
              {statusLabel}
            </span>
            <span className="text-[length:var(--text-base)] text-[color:var(--color-text-placeholder)] font-medium">
              총 {employees.length}명
            </span>
          </div>
        }
      >
        <div className="px-[var(--space-7)] pb-[var(--space-7)]">
          <div className="flex flex-col gap-[var(--space-3)]">
            {employees.map((employee) => (
              <div
                key={employee.employeeId}
                className="flex items-center gap-[var(--space-4)] bg-[var(--color-bg-card)] rounded-[var(--radius-md)] px-[var(--space-6)] py-[14px]"
              >
                {/* 아바타 */}
                <div
                  className={`shrink-0 rounded-full border-2 p-[1px] overflow-hidden ${badgeStyle.border} ${badgeStyle.avatarBg}`}
                >
                  <Avatar name={employee.userName} size={34} variant="beam" />
                </div>

                {/* 이름 + 시간 */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]">
                    {employee.userName}
                  </span>
                  <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-placeholder)]">
                    {formatTime(employee.scheduledStartTime)} -{' '}
                    {formatTime(employee.scheduledEndTime)}
                  </span>
                </div>

                {/* 상태 뱃지 */}
                <span
                  className={`flex items-center gap-[5px] text-[length:var(--text-xs)] font-bold text-[color:var(--color-text-secondary)] px-[var(--space-3)] py-[2px] rounded-full shrink-0 border-[1.5px] ${badgeStyle.bg} ${badgeStyle.border}`}
                >
                  <span
                    className={`size-[6px] rounded-full ${badgeStyle.dot}`}
                  />
                  {statusLabel}
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

      {phoneModal && (
        <PhoneCallModal
          isOpen={!!phoneModal}
          onClose={() => setPhoneModal(null)}
          name={phoneModal.userName}
          phone={phoneModal.phone}
        />
      )}
    </>
  );
}
