import { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import Avatar from 'boring-avatars';
import { ChevronDown, FileText, Phone } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DetailHeader from '@/components/common/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { ROUTES } from '@/constants/routes';
import EmployeeRangeDateModal from '@/features/employee/components/EmployeeRangeDateModal';
import {
  getEmployeeDetailById,
  type EmployeeAttendanceStats,
  type EmployeeDetail,
  type EmployeeSummary,
} from '@/features/employee/data/mockEmployee';

// 직원 목록에서 navigate 시 state로 전달되는 요약 정보 타입
type EmployeeDetailLocationState = {
  employee?: EmployeeSummary;
};

// mock 데이터에 없는 직원 ID일 때 사용하는 기본값 생성 (state로 전달된 요약 정보 우선 활용)
function buildFallbackDetail(
  employeeId: number | undefined,
  employeeSummary?: EmployeeSummary
): EmployeeDetail {
  return {
    id: employeeId ?? -1,
    name: employeeSummary?.name ?? '미등록 직원',
    avatarSeed: employeeSummary?.avatarSeed ?? 'employee-fallback',
    part: '미등록',
    birthDate: '미등록',
    phone: '연락처 미등록',
    defaultWorkTime: employeeSummary?.workSummary ?? '근무 정보 미등록',
    contractSigned: false,
    stats: {
      periodLabel: '기간 정보 없음',
      totalDays: 0,
      totalHours: 0,
      normalAttendance: 0,
      absentCount: 0,
      lateCount: 0,
      overtimeHours: 0,
    },
  };
}

// 전화번호 문자열에서 숫자만 추출하여 tel: 링크 생성 (10자리 미만이면 undefined)
function toTelHref(phone: string): string | undefined {
  const onlyNumber = phone.replace(/\D/g, '');
  if (onlyNumber.length < 10) return undefined;
  return `tel:${onlyNumber}`;
}

// 날짜 범위를 사용자에게 보여줄 라벨로 변환 (같은 연도/월이면 중복 생략)
function formatRangeLabel(startDate: Dayjs, endDate: Dayjs): string {
  if (startDate.year() !== endDate.year()) {
    return `${startDate.format('YYYY년 M월 D일')} - ${endDate.format('YYYY년 M월 D일')}`;
  }
  if (startDate.month() !== endDate.month()) {
    return `${startDate.format('YYYY년 M월 D일')} - ${endDate.format('M월 D일')}`;
  }
  return `${startDate.format('YYYY년 M월 D일')} - ${endDate.format('D일')}`;
}

// periodLabel 문자열("2026년 2월 1일 - 27일")에서 시작일/종료일을 파싱, 실패 시 이번 달 기본 범위 반환
function parseDefaultRange(periodLabel: string): { start: Dayjs; end: Dayjs } {
  const numbers = periodLabel.match(/\d+/g);
  if (numbers && numbers.length >= 4) {
    const [year, month, startDay, endDay] = numbers;
    const start = dayjs(`${year}-${month}-${startDay}`).startOf('day');
    const end = dayjs(`${year}-${month}-${endDay}`).startOf('day');
    if (start.isValid() && end.isValid() && !end.isBefore(start, 'day')) {
      return { start, end };
    }
  }

  const fallbackStart = dayjs().startOf('month');
  const fallbackEnd = fallbackStart.add(26, 'day');
  return { start: fallbackStart, end: fallbackEnd };
}

// 선택한 날짜 범위에 맞춰 기본 통계를 비율 기반으로 스케일링하여 근태 통계 산출
function getRangeStats(
  baseStats: EmployeeAttendanceStats,
  startDate: Dayjs,
  endDate: Dayjs
): EmployeeAttendanceStats {
  const start = startDate.startOf('day');
  const end = endDate.startOf('day');
  const baseRange = parseDefaultRange(baseStats.periodLabel);

  const selectedPeriodDays = end.diff(start, 'day') + 1;
  const basePeriodDays = Math.max(
    1,
    baseRange.end.diff(baseRange.start, 'day') + 1
  );
  const workdayRatio = Math.min(1, baseStats.totalDays / basePeriodDays);
  const scaledWorkdays = Math.max(
    0,
    Math.round(selectedPeriodDays * workdayRatio)
  );

  const absentRate = baseStats.absentCount / Math.max(1, baseStats.totalDays);
  const lateRate = baseStats.lateCount / Math.max(1, baseStats.totalDays);
  const hoursPerWorkday =
    baseStats.totalHours / Math.max(1, baseStats.totalDays);
  const overtimePerWorkday =
    baseStats.overtimeHours / Math.max(1, baseStats.totalDays);

  const absentCount = Math.min(
    scaledWorkdays,
    Math.round(scaledWorkdays * absentRate)
  );
  const lateCount = Math.min(
    scaledWorkdays - absentCount,
    Math.round(scaledWorkdays * lateRate)
  );
  const normalAttendance = Math.max(
    0,
    scaledWorkdays - absentCount - lateCount
  );

  return {
    periodLabel: formatRangeLabel(start, end),
    totalDays: scaledWorkdays,
    totalHours: Math.max(0, Math.round(scaledWorkdays * hoursPerWorkday)),
    normalAttendance,
    absentCount,
    lateCount,
    overtimeHours: Math.max(0, Math.round(scaledWorkdays * overtimePerWorkday)),
  };
}

// 프로필 섹션에서 라벨-값 쌍을 한 줄로 표시하는 공통 행 컴포넌트
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

// 직원 상세 정보 페이지 - 프로필 카드 + 날짜 범위별 근태 통계 표시
export default function EmployeeDetailPage() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const location = useLocation();
  const routeState = location.state as EmployeeDetailLocationState | null;

  // URL 파라미터에서 직원 ID 추출 → mock 데이터 조회, 없으면 fallback 사용
  const parsedEmployeeId = employeeId ? Number(employeeId) : undefined;
  const detailById =
    parsedEmployeeId !== undefined && Number.isFinite(parsedEmployeeId)
      ? getEmployeeDetailById(parsedEmployeeId)
      : undefined;

  const detail =
    detailById ?? buildFallbackDetail(parsedEmployeeId, routeState?.employee);
  const callHref = toTelHref(detail.phone);
  const contractRoute = ROUTES.EMPLOYEE_CONTRACT.replace(
    ':employeeId',
    String(detail.id)
  );

  const defaultRange = useMemo(
    () => parseDefaultRange(detail.stats.periodLabel),
    [detail.stats.periodLabel]
  );

  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState(defaultRange.start);
  const [rangeEnd, setRangeEnd] = useState(defaultRange.end);

  const selectedStats = useMemo(
    () => getRangeStats(detail.stats, rangeStart, rangeEnd),
    [detail.stats, rangeStart, rangeEnd]
  );

  // 우측 요약: 실근무일(정상출근+지각), 실근무시간(평균근무시간*실근무일 + 연장근무)
  const workedSummary = useMemo(() => {
    const workedDays = selectedStats.normalAttendance + selectedStats.lateCount;
    const hoursPerDay =
      selectedStats.totalHours / Math.max(selectedStats.totalDays, 1);
    const workedHours = Math.max(
      0,
      Math.round(workedDays * hoursPerDay + selectedStats.overtimeHours)
    );

    return { workedDays, workedHours };
  }, [selectedStats]);

  // 근태 통계 항목별 표시 설정 (라벨, 값, 색상 dot, 텍스트 색상)
  const statRows = [
    {
      label: '정상 출근',
      value: `${selectedStats.normalAttendance}회`,
      dotClass: 'bg-[var(--color-status-blue-dot)]',
      valueClass: 'text-white',
    },
    {
      label: '결근',
      value: `${selectedStats.absentCount}회`,
      dotClass: 'bg-[var(--color-danger)]',
      valueClass: 'text-[var(--color-danger)]',
    },
    {
      label: '지각',
      value: `${selectedStats.lateCount}회`,
      dotClass: 'bg-[var(--color-status-orange-dot)]',
      valueClass: 'text-[var(--color-status-orange-dot)]',
    },
    {
      label: '연장 근무',
      value: `${selectedStats.overtimeHours}시간`,
      dotClass: 'bg-[var(--color-status-purple-dot)]',
      valueClass: 'text-white',
    },
  ];

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader title="직원 상세 정보" />

        <main className="flex flex-1 flex-col gap-[var(--space-6)] px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-9)+env(safe-area-inset-bottom,0px))] pt-[var(--space-4)]">
          <section className="rounded-[var(--radius-xl)] bg-[var(--color-bg-white)] px-[var(--space-6)] py-[var(--space-6)] shadow-[var(--shadow-form-card)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-[var(--space-4)]">
              <div className="flex min-w-0 items-center gap-[var(--space-3)]">
                <Avatar size={44} name={detail.avatarSeed} variant="beam" />
                <div className="min-w-0">
                  <h1 className="truncate text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
                    {detail.name}
                  </h1>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(contractRoute)}
                className="inline-flex items-center gap-[var(--space-1-5)] rounded-[var(--radius-sm)] bg-[var(--color-badge-green-bg)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-xs)] font-bold text-[var(--color-status-green-dot)]"
              >
                <FileText size={12} />
                근로계약서
              </button>
            </div>

            <div className="mt-[var(--space-4)] space-y-[var(--space-3)]">
              <InfoRow label="생년월일" value={detail.birthDate} />
              <div className="flex items-center justify-between gap-[var(--space-4)]">
                <span className="text-[length:var(--text-xs)] font-medium text-[var(--color-text-placeholder)]">
                  휴대전화
                </span>
                <div className="flex items-center gap-[var(--space-2)]">
                  {callHref && (
                    <a
                      href={callHref}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]"
                      aria-label="전화 걸기"
                    >
                      <Phone size={14} />
                    </a>
                  )}
                  <span className="text-[length:var(--text-base)] font-bold text-[var(--color-text-secondary)]">
                    {detail.phone}
                  </span>
                </div>
              </div>
              <InfoRow label="근무시간" value={detail.defaultWorkTime} />
            </div>
          </section>

          <section className="rounded-[var(--radius-xl)] bg-[var(--color-bg-dark)] px-[var(--space-6)] py-[var(--space-6)] shadow-[var(--shadow-card)]">
            <div className="mb-[var(--space-5)] flex items-start justify-between gap-[var(--space-4)]">
              <div>
                <button
                  type="button"
                  onClick={() => setIsRangeModalOpen(true)}
                  className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-white"
                >
                  {selectedStats.periodLabel}
                  <ChevronDown size={14} color="var(--color-text-light)" />
                </button>
                <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-light)]">
                  근무 통계
                </p>
              </div>
              <div className="text-right">
                <p className="text-[length:var(--text-3xl)] font-black leading-none text-[var(--color-primary)]">
                  {workedSummary.workedDays}일
                </p>
                <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-light)]">
                  총 {workedSummary.workedHours}시간 근무
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

      <EmployeeRangeDateModal
        key={`employee-range-${isRangeModalOpen}-${rangeStart.valueOf()}-${rangeEnd.valueOf()}`}
        isOpen={isRangeModalOpen}
        startDate={rangeStart}
        endDate={rangeEnd}
        onClose={() => setIsRangeModalOpen(false)}
        onConfirm={(startDate, endDate) => {
          setRangeStart(startDate);
          setRangeEnd(endDate);
          setIsRangeModalOpen(false);
        }}
      />
    </div>
  );
}
