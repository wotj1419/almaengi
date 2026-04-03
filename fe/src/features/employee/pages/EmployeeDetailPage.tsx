import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Avatar from 'boring-avatars';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getMonthlyAttendanceReport,
  mapEmployeeMonthlyAttendanceSummary,
  type EmployeeMonthlyAttendanceSummaryView,
} from '@/api/attendance';
import { getApiErrorMessage } from '@/api/error';
import { getEmployees } from '@/api/store';
import { getEmployeeSchedules, type ScheduleDto } from '@/api/schedule';
import DetailHeader from '@/components/common/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { ROUTES } from '@/constants/routes';
import MonthSelector from '@/features/report/components/MonthSelector';
import useStoreStore from '@/stores/useStoreStore';

type EmployeeDetailLocationState = {
  employee?: {
    id: number;
    name: string;
    avatarSeed: string;
    workSummary?: string;
  };
};

interface EmployeeProfileView {
  id: number;
  name: string;
  avatarSeed: string;
  phone: string;
  defaultWorkTime: string;
}

const DEFAULT_PROFILE: EmployeeProfileView = {
  id: -1,
  name: '미등록 직원',
  avatarSeed: 'employee-fallback',
  phone: '-',
  defaultWorkTime: '근무 정보 미등록',
};

function padMonth(month: number): string {
  return String(month).padStart(2, '0');
}

function toTargetMonth(year: number, month: number): string {
  return `${year}-${padMonth(month)}`;
}

function formatTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function formatWorkTimeSummary(schedules: ScheduleDto[]): string {
  if (schedules.length === 0) {
    return '근무 정보 미등록';
  }

  const dayCount = new Set(schedules.map((schedule) => schedule.dayOfWeek))
    .size;
  const uniqueSlots = new Set(
    schedules.map(
      (schedule) =>
        `${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}`
    )
  );

  if (uniqueSlots.size === 1) {
    const [slot] = Array.from(uniqueSlots);
    const [start, end] = slot.split('-');
    return `주 ${dayCount}일 / ${start} - ${end}`;
  }

  return `주 ${dayCount}일 / 요일별 변동`;
}

function createEmptySummary(
  employeeId: number,
  employeeName: string,
  targetMonth: string
): EmployeeMonthlyAttendanceSummaryView {
  return {
    employeeId,
    employeeName,
    periodLabel: targetMonth,
    workedDays: 0,
    workedHours: 0,
    normalAttendance: 0,
    lateCount: 0,
    absentCount: 0,
    overtimeHours: '-',
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[var(--space-4)]">
      <span className="text-[length:var(--text-xs)] font-medium text-[var(--color-text-placeholder)]">
        {label}
      </span>
      <span className="text-[length:var(--text-base)] font-bold text-[var(--color-text-secondary)]">
        {value}
      </span>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const location = useLocation();
  const currentStore = useStoreStore((state) => state.currentStore);
  const routeState = location.state as EmployeeDetailLocationState | null;

  const parsedEmployeeId = Number(employeeId);
  const hasValidEmployeeId =
    Number.isFinite(parsedEmployeeId) && parsedEmployeeId > 0;

  const today = dayjs();
  const [year, setYear] = useState(today.year());
  const [month, setMonth] = useState(today.month() + 1);

  const targetMonth = useMemo(() => toTargetMonth(year, month), [year, month]);

  const [profile, setProfile] = useState<EmployeeProfileView>({
    ...DEFAULT_PROFILE,
    id: hasValidEmployeeId ? parsedEmployeeId : -1,
    name: routeState?.employee?.name ?? DEFAULT_PROFILE.name,
    avatarSeed: routeState?.employee?.avatarSeed ?? DEFAULT_PROFILE.avatarSeed,
    defaultWorkTime:
      routeState?.employee?.workSummary ?? DEFAULT_PROFILE.defaultWorkTime,
  });

  const [summary, setSummary] = useState<EmployeeMonthlyAttendanceSummaryView>(
    createEmptySummary(
      hasValidEmployeeId ? parsedEmployeeId : -1,
      routeState?.employee?.name ?? DEFAULT_PROFILE.name,
      targetMonth
    )
  );

  const disableNextMonth = year === today.year() && month === today.month() + 1;
  const contractRoute = ROUTES.EMPLOYEE_CONTRACT.replace(
    ':employeeId',
    String(hasValidEmployeeId ? parsedEmployeeId : profile.id)
  );

  useEffect(() => {
    if (!currentStore || !hasValidEmployeeId) return;

    let isCancelled = false;

    const fetchProfile = async () => {
      try {
        const [schedules, employees] = await Promise.all([
          getEmployeeSchedules(currentStore.storeId, parsedEmployeeId),
          getEmployees(currentStore.storeId),
        ]);

        if (isCancelled) return;

        const employeeName = routeState?.employee?.name ?? DEFAULT_PROFILE.name;
        const avatarSeed =
          routeState?.employee?.avatarSeed ?? `employee-${parsedEmployeeId}`;
        const matchedEmployee = employees.find(
          (employee) => employee.employeeId === parsedEmployeeId
        );

        setProfile({
          id: parsedEmployeeId,
          name: employeeName,
          avatarSeed,
          phone: matchedEmployee?.phone ?? '-',
          defaultWorkTime: formatWorkTimeSummary(schedules),
        });
      } catch (error) {
        if (isCancelled) return;

        toast.error(
          getApiErrorMessage(error, '근무시간 정보를 불러오지 못했습니다.')
        );
        setProfile((prev) => ({
          ...prev,
          id: parsedEmployeeId,
          phone: '-',
          defaultWorkTime: DEFAULT_PROFILE.defaultWorkTime,
        }));
      }
    };

    void fetchProfile();

    return () => {
      isCancelled = true;
    };
  }, [
    currentStore,
    hasValidEmployeeId,
    parsedEmployeeId,
    routeState?.employee?.avatarSeed,
    routeState?.employee?.name,
  ]);

  useEffect(() => {
    if (!currentStore || !hasValidEmployeeId) return;

    let isCancelled = false;

    const fetchMonthlySummary = async () => {
      try {
        const report = await getMonthlyAttendanceReport(
          currentStore.storeId,
          targetMonth
        );

        if (isCancelled) return;

        setSummary(
          mapEmployeeMonthlyAttendanceSummary(
            report,
            parsedEmployeeId,
            profile.name || DEFAULT_PROFILE.name
          )
        );
      } catch (error) {
        if (isCancelled) return;

        toast.error(
          getApiErrorMessage(error, '직원 근태 통계를 불러오지 못했습니다.')
        );
        setSummary(
          createEmptySummary(
            parsedEmployeeId,
            profile.name || DEFAULT_PROFILE.name,
            targetMonth
          )
        );
      }
    };

    void fetchMonthlySummary();

    return () => {
      isCancelled = true;
    };
  }, [
    currentStore,
    hasValidEmployeeId,
    parsedEmployeeId,
    profile.name,
    targetMonth,
  ]);

  const statRows = [
    {
      label: '지각',
      value: `${summary.lateCount}일`,
      dotClass: 'bg-[var(--color-status-orange-dot)]',
      valueClass: 'text-[var(--color-status-orange-dot)]',
    },
    {
      label: '결근',
      value: `${summary.absentCount}일`,
      dotClass: 'bg-[var(--color-danger)]',
      valueClass: 'text-[var(--color-danger)]',
    },
    {
      label: '정상출근',
      value: `${summary.normalAttendance}일`,
      dotClass: 'bg-[var(--color-status-blue-dot)]',
      valueClass: 'text-white',
    },
    {
      label: '연장 근무',
      value: summary.overtimeHours,
      dotClass: 'bg-[var(--color-status-purple-dot)]',
      valueClass: 'text-white',
    },
  ];

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((prev) => prev - 1);
      setMonth(12);
      return;
    }

    setMonth((prev) => prev - 1);
  };

  const handleNextMonth = () => {
    if (disableNextMonth) return;

    if (month === 12) {
      setYear((prev) => prev + 1);
      setMonth(1);
      return;
    }

    setMonth((prev) => prev + 1);
  };

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader title="직원 상세 정보" />

        <main className="flex flex-1 flex-col gap-[var(--space-6)] px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-9)+env(safe-area-inset-bottom,0px))] pt-[var(--space-4)]">
          <section className="rounded-[var(--radius-xl)] bg-[var(--color-bg-white)] px-[var(--space-6)] py-[var(--space-6)] shadow-[var(--shadow-form-card)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-[var(--space-4)]">
              <div className="flex min-w-0 items-center gap-[var(--space-3)]">
                <Avatar size={44} name={profile.avatarSeed} variant="beam" />
                <div className="min-w-0">
                  <h1 className="truncate text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
                    {profile.name}
                  </h1>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(contractRoute)}
                className="inline-flex items-center gap-[var(--space-1-5)] rounded-[var(--radius-sm)] bg-[var(--color-badge-green-bg)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-xs)] font-bold text-[var(--color-status-green-dot)]"
              >
                <FileText size={12} />
                {'근로계약서'}
              </button>
            </div>

            <div className="mt-[var(--space-4)] space-y-[var(--space-3)]">
              <InfoRow label={'전화번호'} value={profile.phone} />
              <InfoRow label={'근무시간'} value={profile.defaultWorkTime} />
            </div>
          </section>

          <section className="rounded-[var(--radius-xl)] bg-[var(--color-bg-dark)] px-[var(--space-6)] py-[var(--space-6)] shadow-[var(--shadow-card)]">
            <MonthSelector
              year={year}
              month={month}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              disableNext={disableNextMonth}
              variant="darkCard"
            />

            <div className="mb-[var(--space-5)] flex items-start justify-between gap-[var(--space-4)]">
              <div>
                <p className="text-[length:var(--text-lg)] font-bold text-white">
                  {summary.periodLabel}
                </p>
                <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-light)]">
                  {'월간 근태'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[length:var(--text-3xl)] font-black leading-none text-[var(--color-primary)]">
                  {`출근 ${summary.workedDays}일`}
                </p>
                <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-light)]">
                  {`총 ${summary.workedHours}시간 근무`}
                </p>
              </div>
            </div>

            <ul>
              {statRows.map((stat, index) => (
                <li
                  key={stat.label}
                  className={`flex items-center justify-between py-[var(--space-4)] ${
                    index !== statRows.length - 1
                      ? 'border-b border-white/10'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-[var(--space-3)]">
                    <span className={`h-2 w-2 rounded-full ${stat.dotClass}`} />
                    <span className="text-[length:var(--text-md2)] font-medium text-slate-200">
                      {stat.label}
                    </span>
                  </div>
                  <span
                    className={`text-[length:var(--text-md2)] font-bold ${stat.valueClass}`}
                  >
                    {stat.value}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      <BottomNav activeTab="staff" />
    </div>
  );
}
