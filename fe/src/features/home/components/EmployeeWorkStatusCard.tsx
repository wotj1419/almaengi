import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EmployeeWorkStatus, {
  type AttendanceStatus,
} from './EmployeeWorkStatus';
import { ROUTES } from '@/constants/routes';
import { ATTENDANCE_STORAGE_KEY } from '@/features/attendance/pages/AttendanceCheckPage';
import { getMyTodayAttendance } from '@/api/attendance';
import useStoreStore from '@/stores/useStoreStore';

interface StoredAttendance {
  status: AttendanceStatus;
  clockInTime: Date | null;
  scheduledEndTime: string | null;
}

function getStoredAttendance(): StoredAttendance | null {
  try {
    const stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!stored) return null;
    const { status, date, clockInTime, scheduledEndTime } = JSON.parse(stored);
    if (date !== new Date().toDateString()) return null;
    return {
      status: (status as AttendanceStatus) ?? 'WAITING',
      clockInTime: clockInTime ? new Date(clockInTime) : null,
      scheduledEndTime: scheduledEndTime ?? null,
    };
  } catch {
    return null;
  }
}

const buttonConfig: Record<
  AttendanceStatus,
  { label: string; color: 'green' | 'orange' | 'purple'; icon: typeof LogIn }
> = {
  WAITING: { label: '출근하기', color: 'green', icon: LogIn },
  WORKING: { label: '퇴근하기', color: 'orange', icon: LogOut },
  LATE: { label: '퇴근하기', color: 'orange', icon: LogOut },
  ABSENT: { label: '결근', color: 'purple', icon: LogOut },
  DONE: { label: '퇴근 완료', color: 'purple', icon: LogOut },
};

export default function EmployeeWorkStatusCard() {
  const currentStore = useStoreStore((s) => s.currentStore);
  const stored = getStoredAttendance();
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(
    stored?.status ?? 'WAITING'
  );
  const clockInTime = stored?.clockInTime ?? null;
  const [scheduledEndTime, setScheduledEndTime] = useState<string | null>(
    stored?.scheduledEndTime ?? null
  );

  // localStorage에 없을 때만 API 폴백
  useEffect(() => {
    if (getStoredAttendance()) return;
    if (!currentStore) return;
    getMyTodayAttendance(currentStore.storeId)
      .then((res) => {
        const status: AttendanceStatus = res.currentStatus
          ? (res.currentStatus as AttendanceStatus)
          : 'WAITING';
        setAttendanceStatus(status);
        setScheduledEndTime(res.scheduledEndTime ?? null);
      })
      .catch(() => {});
  }, [currentStore]);

  const navigate = useNavigate();

  const handleAttendanceClick = () => {
    navigate(ROUTES.ATTENDANCE_CHECK);
  };

  const btn = buttonConfig[attendanceStatus];
  const isButtonDisabled =
    attendanceStatus === 'ABSENT' || attendanceStatus === 'DONE';

  return (
    <div className="relative z-[var(--z-content)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] shrink-0 w-full">
      <div className="flex flex-col gap-[var(--space-5)] px-[var(--space-5)] py-[var(--space-5)]">
        {/* 헤더: 제목 */}
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--text-xl)] text-[color:var(--color-text-primary)] font-bold leading-tight">
            출퇴근 인증
          </span>
        </div>

        {/* 상태 뱃지 + 도넛 차트 */}
        <div className="flex gap-[9px]">
          <StatusBadge
            count={0}
            label={btn.label}
            color={btn.color}
            icon={btn.icon}
            onClick={isButtonDisabled ? undefined : handleAttendanceClick}
            compact={
              attendanceStatus !== 'WAITING' && attendanceStatus !== 'DONE'
            }
          />
          {attendanceStatus !== 'WAITING' && attendanceStatus !== 'DONE' && (
            <EmployeeWorkStatus
              status={attendanceStatus}
              clockInTime={clockInTime}
              scheduledEndTime={scheduledEndTime}
            />
          )}
        </div>
      </div>
    </div>
  );
}
