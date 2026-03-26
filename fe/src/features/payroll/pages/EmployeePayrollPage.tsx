import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import MonthNavigator from '../components/MonthNavigator';
import useAuthStore from '@/stores/useAuthStore';
import { useMyPayroll } from '../hooks/usePayrollQueries';
import { ROUTES } from '@/constants/routes';
import { mockMyPayroll } from '../data/mockPayroll';

// ─── 포매팅 헬퍼 ─────────────────────────────────────────────────────────────

/**
 * 금액을 한국 원화 형식으로 변환
 * 예: 1200370 → '1,200,370원'
 */
function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

/**
 * 분(minutes)을 시간/분 객체로 변환
 * 예: 5040분 → { hours: 84, mins: 0 }
 */
function formatWorkTime(minutes: number): { hours: number; mins: number } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return { hours, mins };
}

// ─── 공통 레이아웃 래퍼 ───────────────────────────────────────────────────────
// 모든 상태(로딩/에러/빈/정상)에서 동일한 외부 컨테이너 구조 재사용
function PageShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
        <DetailHeader title="급여" onBack={() => navigate(ROUTES.HOME)} />
        <main className="flex-1 w-full px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--pb-content)] flex flex-col gap-[var(--space-5)]">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}

// ─── 페이지 컴포넌트 ──────────────────────────────────────────────────────────

/**
 * 알바생 급여 페이지
 *
 * [기능]
 * - 로그인한 알바생 본인의 월별 급여 조회
 * - 월 네비게이터로 조회 월 변경 → React Query가 자동 리페치
 * - 확정 / 승인 상태 배지 표시
 * - 기본급 · 수당 · 공제 항목별 상세 내역 및 계산식 표시
 * - 급여 명세서 문서 페이지로 이동 버튼
 *
 * [렌더링 분기]
 * 1. isLoading → 스켈레톤 로딩 UI
 * 2. error     → 에러 메시지 UI
 * 3. payrollId === null → 급여 미생성 빈 상태 UI
 * 4. 정상       → 요약 카드 + 내역 카드 + 명세서 버튼
 */
export default function EmployeePayrollPage() {
  const navigate = useNavigate();
  // activeStoreId: 현재 선택된 매장 ID (null이면 API 호출 안 함)
  const { activeStoreId } = useAuthStore();

  // 현재 날짜를 기본값으로 월 상태 초기화
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // getMonth()는 0 기반이므로 +1

  // ─── 월 네비게이션 핸들러 ───────────────────────────────────────────────────
  // 1월 이전 → 작년 12월, 12월 이후 → 내년 1월로 연도 넘김
  const handlePrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const handleNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // ─── API 쿼리 파라미터 조립 ────────────────────────────────────────────────
  // 백엔드가 요구하는 YYYY-MM 포맷으로 변환 (예: 2026-03)
  const targetMonth = `${year}-${String(month).padStart(2, '0')}`;

  // ─── 급여 데이터 조회 ──────────────────────────────────────────────────────
  // API 연동 전: apiPayroll이 undefined일 때 mockMyPayroll로 폴백
  // API 연동 후: `const payroll = apiPayroll;` 로 변경
  const {
    data: apiPayroll,
    isLoading,
    error,
  } = useMyPayroll(activeStoreId, targetMonth);
  const payroll = apiPayroll ?? mockMyPayroll;

  // ─── 급여 항목 그룹화 ──────────────────────────────────────────────────────
  // details 배열을 detailType(BASE / ALLOWANCE / DEDUCTION)별로 분리
  // [수정] React Compiler 대응: 명시적 null 체크 후 변수 추출
  //        의존성: [payroll] (전체 payroll 객체)
  //        코드: null 체크 후 payroll.details 사용 (타입 안전)
  const groupedDetails = useMemo(() => {
    const details = payroll?.details;
    if (!details) return { base: [], allowance: [], deduction: [] };
    return {
      base: details.filter((d) => d.detailType === 'BASE'),
      allowance: details.filter((d) => d.detailType === 'ALLOWANCE'),
      deduction: details.filter((d) => d.detailType === 'DEDUCTION'),
    };
  }, [payroll]);

  // ─── 섹션별 소계 계산 ──────────────────────────────────────────────────────
  const subtotals = useMemo(
    () => ({
      baseSum: groupedDetails.base.reduce((s, d) => s + d.amount, 0),
      allowanceSum: groupedDetails.allowance.reduce((s, d) => s + d.amount, 0),
      deductionSum: groupedDetails.deduction.reduce((s, d) => s + d.amount, 0),
    }),
    [groupedDetails]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 렌더링 분기 1: 로딩 중 → 스켈레톤 UI
  // ═══════════════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <PageShell>
        <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--space-5)]">
          <div className="h-6 w-24 bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] animate-pulse mb-[var(--space-5)]" />
          <div className="h-8 w-40 bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] animate-pulse mb-[var(--space-3)]" />
          <div className="h-4 w-32 bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] animate-pulse" />
        </div>
        <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] border border-[var(--color-border-light)] p-[var(--space-5)] flex flex-col gap-[var(--space-4)]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] animate-pulse"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 렌더링 분기 2: API 에러 → 에러 메시지 UI
  // ═══════════════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <PageShell>
        <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--space-5)] text-center py-[var(--space-9)]">
          <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
            급여 정보를 불러올 수 없습니다.
          </p>
        </div>
      </PageShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 렌더링 분기 3: payrollId === null → 해당 월 급여 미생성 빈 상태
  // ═══════════════════════════════════════════════════════════════════════════
  if (!payroll?.payrollId) {
    return (
      <PageShell>
        {/* 빈 상태에서도 월 변경은 가능해야 하므로 MonthNavigator 유지 */}
        <div className="w-full bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
          <MonthNavigator
            year={year}
            month={month}
            onPrev={handlePrev}
            onNext={handleNext}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </div>

        {/* 빈 상태 안내 카드 */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] py-[var(--space-9)]">
          <div
            className="rounded-full mb-[var(--space-5)] flex items-center justify-center"
            style={{
              width: 'var(--size-empty-outer)',
              height: 'var(--size-empty-outer)',
              background: 'var(--color-empty-icon-outer)',
            }}
          >
            <FileText size={32} color="var(--color-primary)" strokeWidth={2} />
          </div>
          <p className="text-[length:var(--text-base)] font-bold text-[color:var(--color-text-primary)] mb-[var(--space-2)]">
            이번 달 급여 정보가 없어요
          </p>
          <p className="text-[length:var(--text-xs)] text-[color:var(--color-empty-text-sub)]">
            급여가 생성되면 여기서 확인할 수 있어요
          </p>
        </div>
      </PageShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 렌더링 분기 4: 정상 데이터 — 요약 + 내역 + 명세서 버튼
  // ═══════════════════════════════════════════════════════════════════════════

  // 총 근무 / 야간 근무 시간 포매팅
  const { hours: totalHours, mins: totalMins } = formatWorkTime(
    payroll.totalWorkMinutes
  );
  const { hours: nightHours, mins: nightMins } = formatWorkTime(
    payroll.nightWorkMinutes
  );

  return (
    <PageShell>
      {/* ════════════════════════════════════════════════════════════════════
          Card 1 : 월 선택 + 급여 요약
          - MonthNavigator: 이전/다음 월 이동 → targetMonth 갱신 → 리페치
          - 실수령액 + 상태 배지 (추정/확정, 승인여부)
          - 총 근무 / 야간 근무 시간 (야간 근무 있을 때만)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="w-full bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
        {/* 월 선택 네비게이터 */}
        <MonthNavigator
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />

        {/* 구분선 */}
        <div className="border-t border-[var(--color-border-light)]" />

        {/* 급여 요약 영역 */}
        <div className="px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
          {/* 실수령액 + 상태 배지 (좌: 금액, 우: 배지) */}
          <div className="flex items-start justify-between gap-[var(--space-3)]">
            <div className="flex flex-col gap-[var(--space-1)]">
              <span className="text-[length:var(--text-xl)] font-semibold text-[color:var(--color-text-sub)] tracking-[var(--tracking-tight)]">
                실수령액
              </span>
              <span className="text-[length:var(--text-3xl)] font-bold text-[color:var(--color-text-primary)] tracking-[var(--tracking-tighter)]">
                {formatAmount(payroll.netPay)}
              </span>
            </div>

            {/* 상태 배지 두 개 세로 배치 */}
            <div className="flex flex-col items-end gap-[var(--space-2)] pt-[var(--space-1)]">
              {/*
                추정/확정 배지
                isEstimated=true  → 주황 배지 '실시간 조회' (월 마감 전)
                isEstimated=false → 초록 배지 '확정 급여'  (월 마감 후)
              */}
              <span
                className={`px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-xs)] text-[length:var(--text-2xs)] font-bold whitespace-nowrap ${
                  payroll.isEstimated
                    ? 'bg-[var(--color-badge-orange-bg)] text-[color:var(--color-badge-orange-text)]'
                    : 'bg-[var(--color-badge-green-bg)] text-[color:var(--color-status-badge-green-text)]'
                }`}
              >
                {payroll.isEstimated ? '실시간 조회' : '확정 급여'}
              </span>

              {/*
                승인 여부 배지
                isApproved=true  → 파랑 배지 '승인 완료' (사장님 승인 완료)
                isApproved=false → 회색 배지 '승인 대기' (아직 미승인)
              */}
              <span
                className={`px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-xs)] text-[length:var(--text-2xs)] font-bold whitespace-nowrap ${
                  payroll.isApproved
                    ? 'bg-[var(--color-badge-approvable-bg)] text-[color:var(--color-badge-approvable-text)]'
                    : 'bg-[var(--color-status-grey-bg)] text-[color:var(--color-status-grey-dot)]'
                }`}
              >
                {payroll.isApproved ? '승인 완료' : '승인 대기'}
              </span>
            </div>
          </div>

          {/* 근무 시간 요약 */}
          <div className="flex flex-col gap-[var(--space-2)]">
            <div className="flex items-center justify-between">
              <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
                총 근무
              </span>
              <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
                {totalHours}시간 {totalMins > 0 ? `${totalMins}분` : ''}
              </span>
            </div>
            {/* 야간 근무가 있을 때만 표시 */}
            {payroll.nightWorkMinutes > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
                  야간 근무
                </span>
                <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
                  {nightHours}시간 {nightMins > 0 ? `${nightMins}분` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          Card 2 : 급여 내역
          - details 배열을 BASE / ALLOWANCE / DEDUCTION 순으로 렌더링
          - 각 섹션은 항목이 있을 때만 표시 (조건부 렌더링)
          - 섹션 사이에는 구분선 표시 (앞 섹션 + 뒤 섹션 모두 있을 때만)
          - 하단에 실수령액 합계 고정 표시
      ════════════════════════════════════════════════════════════════════ */}
      <div className="w-full bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-5)]">
        {/* 기본급 섹션 (detailType === 'BASE') */}
        {groupedDetails.base.length > 0 && (
          <div className="pb-[var(--space-5)]">
            {/* 섹션 헤더: 분류명 좌측, 소계 우측 */}
            <div className="flex items-center justify-between mb-[var(--space-4)] bg-[var(--color-badge-green-bg)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-1-5)]">
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-status-badge-green-text)]">
                기본급
              </span>
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-status-badge-green-text)]">
                {formatAmount(subtotals.baseSum)}
              </span>
            </div>
            {/* 상세 항목 목록 */}
            <div className="flex flex-col gap-[var(--space-4)]">
              {groupedDetails.base.map((item) => (
                <div key={item.detailId}>
                  <div className="flex items-center justify-between mb-[var(--space-1)]">
                    <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
                      {item.itemName}
                    </span>
                    <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--color-text-primary)]">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                  {/* 계산식은 있을 때만 표시 */}
                  {item.calculationFormula && (
                    <p className="text-[length:var(--text-2xs)] text-[color:var(--color-text-light)]">
                      {item.calculationFormula}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 구분선: 기본급 있고, 수당 또는 공제가 있을 때만 */}
        {groupedDetails.base.length > 0 &&
          (groupedDetails.allowance.length > 0 ||
            groupedDetails.deduction.length > 0) && (
            <div className="border-t border-[var(--color-border-light)] mb-[var(--space-5)]" />
          )}

        {/* 수당 섹션 (detailType === 'ALLOWANCE') */}
        {groupedDetails.allowance.length > 0 && (
          <div className="pb-[var(--space-5)]">
            <div className="flex items-center justify-between mb-[var(--space-4)] bg-[var(--color-badge-orange-bg)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-1-5)]">
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-badge-orange-text)]">
                수당
              </span>
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-badge-orange-text)]">
                {formatAmount(subtotals.allowanceSum)}
              </span>
            </div>
            <div className="flex flex-col gap-[var(--space-4)]">
              {groupedDetails.allowance.map((item) => (
                <div key={item.detailId}>
                  <div className="flex items-center justify-between mb-[var(--space-1)]">
                    <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
                      {item.itemName}
                    </span>
                    <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--color-text-primary)]">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                  {item.calculationFormula && (
                    <p className="text-[length:var(--text-2xs)] text-[color:var(--color-text-light)]">
                      {item.calculationFormula}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 구분선: (기본급 또는 수당) 있고, 공제도 있을 때만 */}
        {(groupedDetails.base.length > 0 ||
          groupedDetails.allowance.length > 0) &&
          groupedDetails.deduction.length > 0 && (
            <div className="border-t border-[var(--color-border-light)] mb-[var(--space-5)]" />
          )}

        {/* 공제 섹션 (detailType === 'DEDUCTION') */}
        {groupedDetails.deduction.length > 0 && (
          <div className="pb-[var(--space-5)]">
            <div className="flex items-center justify-between mb-[var(--space-4)] bg-[var(--color-status-grey-bg)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-1-5)]">
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-status-grey-dot)]">
                공제
              </span>
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-status-grey-dot)]">
                -{formatAmount(subtotals.deductionSum)}
              </span>
            </div>
            <div className="flex flex-col gap-[var(--space-4)]">
              {groupedDetails.deduction.map((item) => (
                <div key={item.detailId}>
                  <div className="flex items-center justify-between mb-[var(--space-1)]">
                    <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
                      {item.itemName}
                    </span>
                    <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--color-text-muted)]">
                      -{formatAmount(item.amount)}
                    </span>
                  </div>
                  {item.calculationFormula && (
                    <p className="text-[length:var(--text-2xs)] text-[color:var(--color-text-light)]">
                      {item.calculationFormula}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 구분선 + 실수령액 합계 (카드 하단 고정) */}
        <div className="border-t border-[var(--color-border-light)] pt-[var(--space-5)]">
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-text-primary)]">
              실수령액
            </span>
            <span className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-text-primary)]">
              {formatAmount(payroll.netPay)}
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          급여 명세서 보기 버튼
          - payrollId를 포함한 경로로 문서 페이지 이동
          - ROUTES.WORKER_DOCUMENTS_PAYSLIP_DETAIL: '/worker/documents/payslip/:payslipId'
      ════════════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => {
          // payslipId 형식: 'payslip-YYYY-MM-{payrollId}'
          const payslipId = `payslip-${year}-${String(month).padStart(2, '0')}-${payroll.payrollId}`;
          navigate(
            ROUTES.WORKER_DOCUMENTS_PAYSLIP_DETAIL.replace(
              ':payslipId',
              payslipId
            )
          );
        }}
        className="w-full py-[var(--space-4)] bg-[var(--color-primary)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] font-bold text-[color:var(--color-bg-dark)] cursor-pointer flex items-center justify-center gap-[var(--space-2)] hover:opacity-90 transition-opacity"
      >
        <FileText size={15} strokeWidth={2} />
        급여 명세서 보기
      </button>
    </PageShell>
  );
}
