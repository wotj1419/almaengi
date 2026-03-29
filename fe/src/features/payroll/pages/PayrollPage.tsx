import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import TransferAgreementModal from '../components/TransferAgreementModal';
import MonthNavigator from '../components/MonthNavigator';
import PayrollSummaryCard from '../components/PayrollSummaryCard';
import PayrollEmployeeCard from '../components/PayrollEmployeeCard';
import { useStorePayrolls } from '../hooks/usePayrollQueries';
import { approveAllPayrolls, transferPayrolls } from '@/api/payroll';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';
import type { Payroll } from '../types';

export default function PayrollPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    year?: number;
    month?: number;
  } | null;
  const today = new Date();
  const [year, setYear] = useState(locationState?.year ?? today.getFullYear());
  const [month, setMonth] = useState(
    locationState?.month ?? today.getMonth() + 1
  );
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isAutoTransferOn, setIsAutoTransferOn] = useState(false);
  const [autoTransferModalOpen, setAutoTransferModalOpen] = useState(false);

  const { activeStoreId } = useAuthStore();

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

  const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
  const { data: storePayroll, refetch } = useStorePayrolls(
    activeStoreId,
    targetMonth
  );

  const monthlyPayrolls: Payroll[] = useMemo(
    () =>
      (storePayroll?.employees ?? []).map((emp) => ({
        payroll_id: emp.payrollId,
        employee_id: emp.employeeId,
        employee_name: emp.employeeName,
        target_month: `${targetMonth}-01`,
        total_work_minutes: emp.totalWorkMinutes,
        // TODO: BE API 에 추가 (night_work_minutes, overtime_minutes)
        night_work_minutes: 0,
        overtime_minutes: 0,
        basic_pay: emp.basicPay,
        total_allowance: emp.totalAllowance,
        total_deduction: emp.totalDeduction,
        net_pay: emp.netPay,
        // TODO: BE API 에 추가 (hourly_wage)
        hourly_wage: 0,
        is_approved: emp.isApproved,
        is_transferred: emp.isTransferred,
        transferred_at: emp.transferredAt,
        approved_at: null,
        created_at: '',
        updated_at: '',
      })),
    [storePayroll, targetMonth]
  );

  const totalNetPay = storePayroll?.totalLaborCost ?? 0;
  const employeeCount = storePayroll?.employeeCount ?? 0;

  const totalWorkMinutes = useMemo(
    () => monthlyPayrolls.reduce((sum, p) => sum + p.total_work_minutes, 0),
    [monthlyPayrolls]
  );

  // BE에 nightWorkMinutes, overtimeMinutes 필드 추가 요청 예정 (현재 하드코딩)
  const nightWorkMinutes = 0;
  const overtimeMinutes = 0;

  const isAllApproved =
    (storePayroll?.employees ?? []).length > 0 &&
    (storePayroll?.employees ?? []).every((e) => e.isApproved);

  const handleApproveToggle = async () => {
    if (!activeStoreId) return;
    if (isAllApproved) {
      alert('승인 취소 기능은 준비 중입니다.');
      return;
    }
    try {
      await approveAllPayrolls(activeStoreId, targetMonth);
      await refetch();
      alert('급여명세서가 일괄 승인되었습니다.');
    } catch {
      alert('급여 승인에 실패했습니다.');
    }
  };

  // 지급 완료: 전원 이체 완료 시 true
  const isPaid =
    (storePayroll?.employees ?? []).length > 0 &&
    (storePayroll?.employees ?? []).every((e) => e.isTransferred);

  return (
    <>
      <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
        <div className="flex flex-col items-center w-full md:max-w-[var(--max-w-app)] relative overflow-x-hidden">
          <DetailHeader title="급여" onBack={() => navigate(ROUTES.HOME)} />
          <div className="w-full px-[var(--space-5)] pt-[var(--space-4)] pb-[var(--pb-content)] flex flex-col gap-[var(--space-5)]">
            <div className="w-full bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
              {/* MonthNavigator + 지급 상태 텍스트 */}
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

              <PayrollSummaryCard
                totalNetPay={totalNetPay}
                employeeCount={employeeCount}
                totalWorkMinutes={totalWorkMinutes}
                nightWorkMinutes={nightWorkMinutes}
                overtimeMinutes={overtimeMinutes}
                isPaid={isPaid}
                isAllApproved={isAllApproved}
                isAutoTransferOn={isAutoTransferOn}
                onApproveToggle={handleApproveToggle}
                onAutoTransferToggle={() => {
                  if (isAutoTransferOn) {
                    setIsAutoTransferOn(false);
                  } else {
                    setAutoTransferModalOpen(true);
                  }
                }}
                onManualTransfer={() => setTransferModalOpen(true)}
              />
            </div>
            <div className="flex flex-col gap-[var(--space-4)]">
              {monthlyPayrolls.map((payroll) => (
                <PayrollEmployeeCard
                  key={payroll.payroll_id}
                  payroll={payroll}
                  onViewStatement={() => {
                    navigate(
                      ROUTES.DOCUMENTS_PAYSLIP_DETAIL.replace(
                        ':payslipId',
                        String(payroll.payroll_id)
                      ),
                      {
                        state: {
                          year,
                          month,
                          from: 'payroll',
                          employeeName: payroll.employee_name,
                          targetMonth,
                        },
                      }
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
      {/* 수동 이체 확인 모달 */}
      <TransferAgreementModal
        isOpen={transferModalOpen}
        type="manual"
        employeeCount={employeeCount}
        totalNetPay={totalNetPay}
        onConfirm={async () => {
          if (!activeStoreId) return;
          try {
            await transferPayrolls(activeStoreId, targetMonth);
            alert('급여 이체가 완료되었습니다.');
          } catch {
            alert('급여 이체에 실패했습니다. 잔액을 확인해주세요.');
          }
          setTransferModalOpen(false);
        }}
        onClose={() => setTransferModalOpen(false)}
      />
      {/* 예약 이체 활성화 확인 모달 */}
      <TransferAgreementModal
        isOpen={autoTransferModalOpen}
        type="auto"
        employeeCount={employeeCount}
        totalNetPay={totalNetPay}
        onConfirm={() => {
          setIsAutoTransferOn(true);
          setAutoTransferModalOpen(false);
        }}
        onClose={() => setAutoTransferModalOpen(false)}
      />
    </>
  );
}
