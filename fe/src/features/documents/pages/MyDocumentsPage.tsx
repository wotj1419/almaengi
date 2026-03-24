import { CalendarDays, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import ContractStatusBadge from '@/features/documents/components/ContractStatusBadge';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';
import PayslipMonthAccordion from '@/features/documents/components/PayslipMonthAccordion';
import YearPickerModal from '@/features/documents/components/YearPickerModal';
import {
  listEtcDocumentRequests,
  subscribeEtcDocumentRequests,
  type DocumentRequestStatus,
  type EtcDocumentRequestRecord,
} from '@/features/documents/data/mockDocumentRequests';
import {
  listContractRecords,
  subscribeContractRecords,
  type ContractRecord,
} from '@/features/documents/data/mockContracts';
import {
  DOCUMENT_TAB_OPTIONS,
  OTHER_DOCUMENTS,
  PAYSLIP_DOCUMENTS,
  getAvailableYears,
  groupPayslipsByMonth,
  type DocumentCategory,
} from '@/features/documents/data/mockDocuments';

const PAGE_TEXT = {
  title: '내 문서',
  payslipEmpty: (year: number) => `${year}년 급여명세서가 없습니다.`,
  contractEmpty: '등록된 근로계약서가 없습니다.',
  etcEmpty: '선택한 조건에 맞는 문서가 없습니다.',
  requestedAt: '요청일',
  dueDate: '제출기한',
  yearSuffix: '년',
} as const;

function getInitialTab(tabParam: string | null): DocumentCategory {
  if (tabParam === 'PAYSLIP' || tabParam === 'CONTRACT' || tabParam === 'ETC') {
    return tabParam;
  }
  return 'PAYSLIP';
}

function formatDate(value: string) {
  return value.slice(0, 10).replaceAll('-', '.');
}

function getEtcRequestStatusLabel(status: DocumentRequestStatus) {
  if (status === 'REQUESTING') return '요청중';
  return '요청중';
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

function ContractCard({
  item,
  onClick,
}: {
  item: ContractRecord;
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
        <ContractStatusBadge status={item.status} />
      </div>
      <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        {PAGE_TEXT.requestedAt} {formatDate(item.createdAt)}
      </p>
    </button>
  );
}

function EtcRequestCard({ item }: { item: EtcDocumentRequestRecord }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-4)] shadow-[var(--shadow-form-card)]">
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
          {item.documentName}
        </p>
        <span className="rounded-full bg-[var(--color-status-orange-bg)] px-[var(--space-2)] py-[var(--space-1)] text-[length:var(--text-xs)] font-bold text-[var(--color-status-orange-dot)]">
          {getEtcRequestStatusLabel(item.status)}
        </span>
      </div>
      <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        {item.employeeName} · {PAGE_TEXT.dueDate} {item.dueDate}
      </p>
    </article>
  );
}

function EtcDocumentCard({
  title,
  employeeName,
  issuedAt,
}: {
  title: string;
  employeeName: string;
  issuedAt: string;
}) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-4)] shadow-[var(--shadow-form-card)]">
      <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
        {title}
      </p>
      <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        {employeeName} · {issuedAt}
      </p>
    </article>
  );
}

export default function MyDocumentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedTab, setSelectedTab] = useState<DocumentCategory>(() =>
    getInitialTab(searchParams.get('tab'))
  );
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const [contractRecords, setContractRecords] = useState<ContractRecord[]>(() =>
    listContractRecords()
  );
  const [etcRequestRecords, setEtcRequestRecords] = useState<
    EtcDocumentRequestRecord[]
  >(() => listEtcDocumentRequests());

  const availableYears = useMemo(
    () => getAvailableYears(PAYSLIP_DOCUMENTS),
    []
  );
  const yearOptions =
    availableYears.length > 0 ? availableYears : [new Date().getFullYear()];
  const [selectedYear, setSelectedYear] = useState<number>(yearOptions[0]);
  const [draftYear, setDraftYear] = useState<number>(yearOptions[0]);

  useEffect(() => {
    setSelectedTab(getInitialTab(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    return subscribeContractRecords(() => {
      setContractRecords(listContractRecords());
    });
  }, []);

  useEffect(() => {
    return subscribeEtcDocumentRequests(() => {
      setEtcRequestRecords(listEtcDocumentRequests());
    });
  }, []);

  const monthlyPayslips = useMemo(
    () => groupPayslipsByMonth(PAYSLIP_DOCUMENTS, selectedYear),
    [selectedYear]
  );

  const etcDocuments = useMemo(
    () => OTHER_DOCUMENTS.filter((item) => item.category === 'ETC'),
    []
  );

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.title}
      mainClassName="flex flex-1 flex-col pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))]"
    >
      <section className="border-b border-[var(--color-border-light)] bg-[var(--color-bg-white)] px-[var(--space-5)] pt-[var(--space-3)]">
        <div className="flex items-center justify-center gap-[var(--space-5)]">
          {DOCUMENT_TAB_OPTIONS.map((tab) => {
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
              {selectedYear}
              {PAGE_TEXT.yearSuffix}
              <CalendarDays size={16} color="var(--color-text-muted)" />
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-1 flex-col px-[var(--space-5)] py-[var(--space-4)]">
        {selectedTab === 'PAYSLIP' && (
          <PayslipMonthAccordion
            year={selectedYear}
            groups={monthlyPayslips}
            onSelectPayslip={(payslipId) =>
              navigate(
                ROUTES.DOCUMENTS_PAYSLIP_DETAIL.replace(':payslipId', payslipId)
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
                      ROUTES.DOCUMENTS_CONTRACT_DETAIL.replace(
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
          (etcDocuments.length > 0 || etcRequestRecords.length > 0 ? (
            <div className="space-y-[var(--space-3)]">
              {etcRequestRecords.map((request) => (
                <EtcRequestCard key={request.id} item={request} />
              ))}

              {etcDocuments.map((item) => (
                <EtcDocumentCard
                  key={item.id}
                  title={item.title}
                  employeeName={item.employeeName}
                  issuedAt={item.issuedAt}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={PAGE_TEXT.etcEmpty} />
          ))}
      </section>

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
    </DocumentsPageLayout>
  );
}
