import { CalendarDays, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/layout/DetailHeader';
import { ROUTES } from '@/constants/routes';
import {
  getEmployeeContractStatusLabel,
  listEmployeeContractRecords,
  subscribeEmployeeContractRecords,
  type EmployeeContractRecord,
} from '@/features/documents/data/mockEmployeeContracts';
import {
  listEmployeeEtcDocumentRequests,
  type EmployeeEtcDocumentRequestRecord,
} from '@/features/documents/data/mockEmployeeDocumentRequests';
import {
  EMPLOYEE_OTHER_DOCUMENTS,
  EMPLOYEE_PAYSLIP_DOCUMENTS,
  getEmployeeAvailableYears,
  groupEmployeePayslipsByMonth,
  type EmployeeDocumentCategory,
} from '@/features/documents/data/mockEmployeeDocuments';
import PayslipMonthAccordion from '@/features/documents/components/PayslipMonthAccordion';
import YearPickerModal from '@/features/documents/components/YearPickerModal';

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
} as const;

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

function EmployeeContractStatusBadge({
  status,
}: {
  status: EmployeeContractRecord['status'];
}) {
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
      {getEmployeeContractStatusLabel(status)}
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
  const [selectedTab, setSelectedTab] =
    useState<EmployeeDocumentCategory>('PAYSLIP');
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [contractRecords, setContractRecords] = useState<
    EmployeeContractRecord[]
  >(() => listEmployeeContractRecords());
  const [etcRequestRecords] = useState<EmployeeEtcDocumentRequestRecord[]>(() =>
    listEmployeeEtcDocumentRequests()
  );

  const availableYears = useMemo(
    () => getEmployeeAvailableYears(EMPLOYEE_PAYSLIP_DOCUMENTS),
    []
  );
  const yearOptions =
    availableYears.length > 0 ? availableYears : [new Date().getFullYear()];
  const [selectedYear, setSelectedYear] = useState<number>(yearOptions[0]);
  const [draftYear, setDraftYear] = useState<number>(yearOptions[0]);

  useEffect(() => {
    return subscribeEmployeeContractRecords(() => {
      setContractRecords(listEmployeeContractRecords());
    });
  }, []);

  const monthlyPayslips = useMemo(
    () =>
      groupEmployeePayslipsByMonth(EMPLOYEE_PAYSLIP_DOCUMENTS, selectedYear),
    [selectedYear]
  );

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader title={PAGE_TEXT.title} />

        <section className="border-b border-[var(--color-border-light)] bg-[var(--color-bg-white)] px-[var(--space-5)] pt-[var(--space-3)]">
          <div className="flex items-center justify-center gap-[var(--space-5)]">
            {TABS.map((tab) => {
              const isActive = selectedTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedTab(tab.key)}
                  className={`border-b-2 pb-[var(--space-2)] text-[length:var(--text-md2)] font-bold ${
                    isActive
                      ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]'
                      : 'border-transparent text-[var(--color-text-placeholder)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {selectedTab === 'PAYSLIP' && (
            <div className="pb-[var(--space-4)] pt-[var(--space-3)]">
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
          {selectedTab === 'PAYSLIP' && (
            <PayslipMonthAccordion
              year={selectedYear}
              groups={monthlyPayslips}
              onSelectPayslip={(payslipId) =>
                navigate(
                  ROUTES.WORKER_DOCUMENTS_PAYSLIP_DETAIL.replace(
                    ':payslipId',
                    payslipId
                  )
                )
              }
            />
          )}

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
                          item.id
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
