import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';
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
  const [bulkSendModalOpen, setBulkSendModalOpen] = useState(false);

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

  return (
    <>
      <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
        <div className="flex flex-col items-center w-full md:max-w-[var(--max-w-app)] relative overflow-x-hidden">
          <DetailHeader title="급여" onBack={() => navigate(ROUTES.HOME)} />
          <div className="w-full px-[var(--space-5)] pt-[var(--space-4)] pb-[var(--pb-content)] flex flex-col gap-[var(--space-7)]">
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
              <PayrollSummaryCard
                totalNetPay={totalNetPay}
                onBulkSend={() => setBulkSendModalOpen(true)}
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
      <ConfirmModal
        isOpen={bulkSendModalOpen}
        message="급여를 일괄 송금하시겠습니까?"
        confirmText="송금"
        cancelText="취소"
        onConfirm={() => setBulkSendModalOpen(false)}
        onClose={() => setBulkSendModalOpen(false)}
      />
    </>
  );
}
