import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import TransferAgreementModal from '../components/TransferAgreementModal';
import MonthNavigator from '../components/MonthNavigator';
import PayrollSummaryCard from '../components/PayrollSummaryCard';
import PayrollEmployeeCard from '../components/PayrollEmployeeCard';
import { mockPayrolls } from '../data/mockPayroll';
import { ROUTES } from '@/constants/routes';

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

  const targetMonthStr = `${year}-${String(month).padStart(2, '0')}-01`;

  const monthlyPayrolls = useMemo(
    () => mockPayrolls.filter((p) => p.target_month === targetMonthStr),
    [targetMonthStr]
  );

  const totalNetPay = useMemo(
    () => monthlyPayrolls.reduce((sum, p) => sum + p.net_pay, 0),
    [monthlyPayrolls]
  );

  const totalWorkMinutes = useMemo(
    () => monthlyPayrolls.reduce((sum, p) => sum + p.total_work_minutes, 0),
    [monthlyPayrolls]
  );

  const nightWorkMinutes = useMemo(
    () => monthlyPayrolls.reduce((sum, p) => sum + p.night_work_minutes, 0),
    [monthlyPayrolls]
  );

  // 지급 상태 판별 (하드코딩: 급여일 21일)
  const PAY_DAY = 21;
  const isPaid = (() => {
    const payDate = new Date(year, month, PAY_DAY); // 다음달 21일
    return today >= payDate;
  })();

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
                employeeCount={monthlyPayrolls.length}
                totalWorkMinutes={totalWorkMinutes}
                nightWorkMinutes={nightWorkMinutes}
                overtimeMinutes={480}
                isPaid={isPaid}
                isAutoTransferOn={isAutoTransferOn}
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
                    const payslipId = `payslip-${year}-${String(month).padStart(2, '0')}-${payroll.employee_id}`;
                    navigate(
                      ROUTES.DOCUMENTS_PAYSLIP_DETAIL.replace(
                        ':payslipId',
                        payslipId
                      ),
                      { state: { year, month, from: 'payroll' } }
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
        employeeCount={monthlyPayrolls.length}
        totalNetPay={totalNetPay}
        onConfirm={() => setTransferModalOpen(false)}
        onClose={() => setTransferModalOpen(false)}
      />
      {/* 예약 이체 활성화 확인 모달 */}
      <TransferAgreementModal
        isOpen={autoTransferModalOpen}
        type="auto"
        employeeCount={monthlyPayrolls.length}
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
