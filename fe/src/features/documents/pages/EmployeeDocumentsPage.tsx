import { CalendarDays, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  getMyContracts,
  mapContractStatus,
  type UIContractStatus,
} from '@/api/contract';
import { getApiErrorMessage } from '@/api/error';
import { fetchMyPayroll } from '@/api/payroll';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/layout/DetailHeader';
import { ROUTES } from '@/constants/routes';
import PayslipMonthAccordion from '@/features/documents/components/PayslipMonthAccordion';
import YearPickerModal from '@/features/documents/components/YearPickerModal';
import {
  listEmployeeEtcDocumentRequests,
  type EmployeeEtcDocumentRequestRecord,
} from '@/features/documents/data/mockEmployeeDocumentRequests';
import {
  EMPLOYEE_OTHER_DOCUMENTS,
  type EmployeeDocumentCategory,
} from '@/features/documents/data/mockEmployeeDocuments';
import type { PayslipMonthGroup } from '@/features/documents/data/mockDocuments';
import useAuthStore from '@/stores/useAuthStore';
import useStoreStore from '@/stores/useStoreStore';

export interface EmployeeContractRecord {
  id: number;
  title: string;
  status: UIContractStatus;
  createdAt: string;
}

interface EmployeePayslipMeta {
  targetMonth: string;
}

const TABS: Array<{ key: EmployeeDocumentCategory; label: string }> = [
  { key: 'PAYSLIP', label: '급여명세서' },
  { key: 'CONTRACT', label: '근로계약서' },
  { key: 'ETC', label: '기타' },
];

const PAGE_TEXT = {
  title: '문서함',
  contractEmpty: '등록된 근로계약서가 없습니다.',
  etcEmpty: '선택한 조건에 맞는 문서가 없습니다.',
  requestedAt: '요청일',
  dueDate: '제출기한',
  submittedAt: '제출일',
  loadingPayslip: '급여명세서를 불러오는 중입니다...',
  payslipError:
    '일부 급여명세서를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
} as const;

function buildYearOptions(range = 5) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, idx) => currentYear - idx);
}

function formatDate(value: string) {
  return value.slice(0, 10).replaceAll('-', '.');
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[320px] flex-1 flex-col items-center justify-center text-center">
      <div className="mb-[var(--space-4)] inline-flex h-[var(--size-empty-icon-inner)] w-[var(--size-empty-icon-inner)] items-center justify-center rounded-full bg-[var(--color-empty-icon-outer)]">
        <FileText size={28} color="var(--color-icon-muted)" />
      </div>
      <p className="text-[length:var(--text-md2)] font-medium text-[var(--color-empty-text-sub)]">
        {message}
      </p>
    </div>
  );
}

const CONTRACT_STATUS_LABEL: Record<UIContractStatus, string> = {
  REQUESTING: '요청중',
  PENDING_APPROVAL: '승인 대기',
  APPROVED: '승인 완료',
};

function EmployeeContractStatusBadge({ status }: { status: UIContractStatus }) {
  const className =
    status === 'REQUESTING'
      ? 'bg-[var(--color-status-orange-bg)] text-[var(--color-status-orange-dot)]'
      : status === 'PENDING_APPROVAL'
        ? 'bg-[var(--color-status-purple-bg)] text-[var(--color-status-purple-dot)]'
        : 'bg-[var(--color-status-green-bg)] text-[var(--color-status-green-dot)]';

  return (
    <span
      className={`rounded-full px-[var(--space-2)] py-[var(--space-1)] text-[length:var(--text-xs)] font-bold ${className}`}
    >
      {CONTRACT_STATUS_LABEL[status]}
    </span>
  );
}

function ContractCard({
  item,
  onClick,
}: {
  item: EmployeeContractRecord;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-4)] text-left shadow-[var(--shadow-form-card)]"
    >
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
          {item.title}
        </p>
        <EmployeeContractStatusBadge status={item.status} />
      </div>
      <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        {PAGE_TEXT.requestedAt} {formatDate(item.createdAt)}
      </p>
    </button>
  );
}

function EtcRequestCard({ item }: { item: EmployeeEtcDocumentRequestRecord }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-4)] shadow-[var(--shadow-form-card)]">
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
          {item.documentName}
        </p>
        <span className="rounded-full bg-[var(--color-status-orange-bg)] px-[var(--space-2)] py-[var(--space-1)] text-[length:var(--text-xs)] font-bold text-[var(--color-status-orange-dot)]">
          제출요청
        </span>
      </div>
      <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        {PAGE_TEXT.dueDate} {item.dueDate}
      </p>
    </article>
  );
}

function EtcDocumentCard({
  title,
  issuedAt,
}: {
  title: string;
  issuedAt: string;
}) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-4)] shadow-[var(--shadow-form-card)]">
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
          {title}
        </p>
        <span className="rounded-full bg-[var(--color-status-green-bg)] px-[var(--space-2)] py-[var(--space-1)] text-[length:var(--text-xs)] font-bold text-[var(--color-status-green-dot)]">
          제출완료
        </span>
      </div>
      <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        {PAGE_TEXT.submittedAt} {issuedAt}
      </p>
    </article>
  );
}

export default function EmployeeDocumentsPage() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const userName = useAuthStore((s) => s.user?.name ?? '나');

  const [selectedTab, setSelectedTab] =
    useState<EmployeeDocumentCategory>('PAYSLIP');
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [contractRecords, setContractRecords] = useState<
    EmployeeContractRecord[]
  >([]);
  const [etcRequestRecords] = useState<EmployeeEtcDocumentRequestRecord[]>(() =>
    listEmployeeEtcDocumentRequests()
  );
  const [monthlyPayslips, setMonthlyPayslips] = useState<PayslipMonthGroup[]>(
    []
  );
  const [payslipMetaById, setPayslipMetaById] = useState<
    Record<string, EmployeePayslipMeta>
  >({});
  const [isPayslipLoading, setIsPayslipLoading] = useState(false);
  const [payslipError, setPayslipError] = useState<string | null>(null);

  const yearOptions = useMemo(() => buildYearOptions(5), []);
  const [selectedYear, setSelectedYear] = useState<number>(yearOptions[0]);
  const [draftYear, setDraftYear] = useState<number>(yearOptions[0]);

  useEffect(() => {
    const fetchMyContracts = async () => {
      if (!currentStore) return;
      try {
        const contracts = await getMyContracts(currentStore.storeId);
        const records = contracts.map((contract) => ({
          id: contract.contractId,
          title: `${contract.employeeName} 근로계약서`,
          status: mapContractStatus(contract.status),
          createdAt: contract.createdAt,
        }));
        setContractRecords(records);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, '근로계약서 목록 조회에 실패했습니다.')
        );
      }
    };

    void fetchMyContracts();
  }, [currentStore]);

  useEffect(() => {
    let cancelled = false;

    const fetchPayslips = async () => {
      if (!currentStore) {
        if (cancelled) return;
        setMonthlyPayslips([]);
        setPayslipMetaById({});
        setPayslipError(null);
        setIsPayslipLoading(false);
        return;
      }

      setIsPayslipLoading(true);
      setPayslipError(null);

      const months = Array.from({ length: 12 }, (_, idx) => idx + 1);
      const targets = months.map((month) => ({
        month,
        targetMonth: `${selectedYear}-${String(month).padStart(2, '0')}`,
      }));

      const results = await Promise.allSettled(
        targets.map((target) =>
          fetchMyPayroll(currentStore.storeId, target.targetMonth).then(
            (response) => ({ ...target, response })
          )
        )
      );

      if (cancelled) return;

      const nextMeta: Record<string, EmployeePayslipMeta> = {};
      const monthMap = new Map<number, PayslipMonthGroup['items']>();
      let rejectedCount = 0;

      results.forEach((result) => {
        if (result.status === 'rejected') {
          rejectedCount += 1;
          return;
        }

        const { month, response } = result.value;
        if (!response.payrollId) return;

        const id = String(response.payrollId);
        nextMeta[id] = { targetMonth: response.targetMonth };

        const current = monthMap.get(month) ?? [];
        current.push({
          id,
          year: selectedYear,
          month,
          employeeName: userName,
          issuedAt: '-',
          title: `${response.targetMonth} 급여명세서`,
          pdfUrl: '',
          status: '확정',
        });
        monthMap.set(month, current);
      });

      const groups: PayslipMonthGroup[] = [...monthMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, items]) => ({ month, items }));

      setMonthlyPayslips(groups);
      setPayslipMetaById(nextMeta);
      setPayslipError(rejectedCount > 0 ? PAGE_TEXT.payslipError : null);
      setIsPayslipLoading(false);
    };

    void fetchPayslips();

    return () => {
      cancelled = true;
    };
  }, [currentStore, selectedYear, userName]);

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader
          title={PAGE_TEXT.title}
          onBack={() => navigate(ROUTES.HOME, { replace: true })}
        />

        <section className="bg-[var(--color-bg-white)]">
          <div className="flex border-b border-[var(--color-border-light)]">
            {TABS.map((tab) => {
              const isActive = selectedTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedTab(tab.key)}
                  className={`flex-1 cursor-pointer border-b-4 py-[var(--space-3)] ${
                    isActive
                      ? 'border-[var(--color-primary)]'
                      : 'border-transparent'
                  }`}
                >
                  <span
                    className={`text-[length:var(--text-md)] leading-5 ${
                      isActive
                        ? 'font-bold text-[var(--color-text-primary)]'
                        : 'font-medium text-[var(--color-text-placeholder)]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedTab === 'PAYSLIP' && (
            <div className="px-[var(--space-5)] pb-[var(--space-4)] pt-[var(--space-3)]">
              <button
                type="button"
                onClick={() => {
                  setDraftYear(selectedYear);
                  setIsYearPickerOpen(true);
                }}
                className="inline-flex h-9 items-center gap-[var(--space-1)] px-[var(--space-1)] text-[length:var(--text-md)] font-bold text-[var(--color-text-secondary)]"
              >
                {selectedYear}년
                <CalendarDays size={16} color="var(--color-text-muted)" />
              </button>
            </div>
          )}
        </section>

        <main className="flex flex-1 flex-col px-[var(--space-5)] py-[var(--space-4)] pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))]">
          {selectedTab === 'PAYSLIP' &&
            (isPayslipLoading ? (
              <div className="flex h-full min-h-[320px] flex-1 items-center justify-center text-[length:var(--text-md2)] font-medium text-[var(--color-text-muted)]">
                {PAGE_TEXT.loadingPayslip}
              </div>
            ) : (
              <div className="space-y-[var(--space-3)]">
                {payslipError ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-status-orange-dot)] bg-[var(--color-status-orange-bg)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[var(--color-status-orange-dot)]">
                    {payslipError}
                  </div>
                ) : null}

                <PayslipMonthAccordion
                  year={selectedYear}
                  groups={monthlyPayslips}
                  onSelectPayslip={(payslipId) => {
                    const meta = payslipMetaById[payslipId];
                    navigate(
                      ROUTES.WORKER_DOCUMENTS_PAYSLIP_DETAIL.replace(
                        ':payslipId',
                        payslipId
                      ),
                      {
                        state: { targetMonth: meta?.targetMonth },
                      }
                    );
                  }}
                />
              </div>
            ))}

          {selectedTab === 'CONTRACT' &&
            (contractRecords.length > 0 ? (
              <div className="space-y-[var(--space-3)]">
                {contractRecords.map((item) => (
                  <ContractCard
                    key={item.id}
                    item={item}
                    onClick={() =>
                      navigate(
                        ROUTES.WORKER_DOCUMENTS_CONTRACT_SIGN.replace(
                          ':contractId',
                          String(item.id)
                        )
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState message={PAGE_TEXT.contractEmpty} />
            ))}

          {selectedTab === 'ETC' &&
            (EMPLOYEE_OTHER_DOCUMENTS.length > 0 ||
            etcRequestRecords.length > 0 ? (
              <div className="space-y-[var(--space-3)]">
                {etcRequestRecords.map((request) => (
                  <EtcRequestCard key={request.id} item={request} />
                ))}
                {EMPLOYEE_OTHER_DOCUMENTS.map((item) => (
                  <EtcDocumentCard
                    key={item.id}
                    title={item.title}
                    issuedAt={item.issuedAt}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message={PAGE_TEXT.etcEmpty} />
            ))}
        </main>
      </div>

      <BottomNav activeTab="documents" />

      <YearPickerModal
        isOpen={isYearPickerOpen}
        draftYear={draftYear}
        yearOptions={yearOptions}
        onChangeDraftYear={setDraftYear}
        onClose={() => setIsYearPickerOpen(false)}
        onConfirm={() => {
          setSelectedYear(draftYear);
          setIsYearPickerOpen(false);
        }}
      />
    </div>
  );
}
