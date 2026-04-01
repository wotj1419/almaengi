import { CalendarDays, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getContracts,
  mapContractStatus,
  type UIContractStatus,
} from '@/api/contract';
import { getApiErrorMessage } from '@/api/error';
import { getStorePayrolls } from '@/api/payroll';
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
  DOCUMENT_TAB_OPTIONS,
  OTHER_DOCUMENTS,
  type DocumentCategory,
  type PayslipMonthGroup,
} from '@/features/documents/data/mockDocuments';
import useStoreStore from '@/stores/useStoreStore';

// API 기반 ContractRecord 타입
export interface ContractRecord {
  id: number;
  title: string;
  status: UIContractStatus;
  createdAt: string;
}

interface PayslipMeta {
  employeeName: string;
  targetMonth: string;
}

function buildYearOptions(range = 5) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, idx) => currentYear - idx);
}

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
  const currentStore = useStoreStore((s) => s.currentStore);

  const [selectedTab, setSelectedTab] = useState<DocumentCategory>(() =>
    getInitialTab(searchParams.get('tab'))
  );
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const [contractRecords, setContractRecords] = useState<ContractRecord[]>([]);
  const [etcRequestRecords, setEtcRequestRecords] = useState<
    EtcDocumentRequestRecord[]
  >(() => listEtcDocumentRequests());
  const [monthlyPayslips, setMonthlyPayslips] = useState<PayslipMonthGroup[]>(
    []
  );
  const [payslipMetaById, setPayslipMetaById] = useState<
    Record<string, PayslipMeta>
  >({});
  const [isPayslipLoading, setIsPayslipLoading] = useState(false);
  const [payslipError, setPayslipError] = useState<string | null>(null);

  const yearOptions = useMemo(() => buildYearOptions(5), []);
  const [selectedYear, setSelectedYear] = useState<number>(yearOptions[0]);
  const [draftYear, setDraftYear] = useState<number>(yearOptions[0]);

  useEffect(() => {
    setSelectedTab(getInitialTab(searchParams.get('tab')));
  }, [searchParams]);

  // API에서 근로계약서 목록 조회
  useEffect(() => {
    const fetchContracts = async () => {
      if (!currentStore) return;
      try {
        const contracts = await getContracts(currentStore.storeId);
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

    void fetchContracts();
  }, [currentStore]);

  useEffect(() => {
    return subscribeEtcDocumentRequests(() => {
      setEtcRequestRecords(listEtcDocumentRequests());
    });
  }, []);

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

      if (cancelled) return;
      setIsPayslipLoading(true);
      setPayslipError(null);

      const months = Array.from({ length: 12 }, (_, idx) => idx + 1);
      const targets = months.map((month) => {
        const paddedMonth = String(month).padStart(2, '0');
        return {
          month,
          targetMonth: `${selectedYear}-${paddedMonth}`,
        };
      });

      const results = await Promise.allSettled(
        targets.map((target) =>
          getStorePayrolls(currentStore.storeId, target.targetMonth).then(
            (response) => ({ ...target, response })
          )
        )
      );

      const nextMeta: Record<string, PayslipMeta> = {};
      const groups: PayslipMonthGroup[] = [];
      let rejectedCount = 0;

      results.forEach((result) => {
        if (result.status === 'rejected') {
          rejectedCount += 1;
          return;
        }

        const { month, response } = result.value;
        const items = response.employees.map((employee) => {
          const id = String(employee.payrollId);
          nextMeta[id] = {
            employeeName: employee.employeeName,
            targetMonth: response.targetMonth,
          };
          return {
            id,
            year: selectedYear,
            month,
            employeeName: employee.employeeName,
            issuedAt: '-',
            title: `${employee.employeeName} ${response.targetMonth} 급여명세서`,
            pdfUrl: '',
            status: '확정' as const,
          };
        });

        if (items.length > 0) {
          groups.push({ month, items });
        }
      });

      groups.sort((a, b) => b.month - a.month);
      if (cancelled) return;
      setMonthlyPayslips(groups);
      setPayslipMetaById(nextMeta);

      if (rejectedCount > 0) {
        setPayslipError(
          '일부 급여명세서를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
        );
      }

      setIsPayslipLoading(false);
    };

    void fetchPayslips();

    return () => {
      cancelled = true;
    };
  }, [currentStore, selectedYear]);

  const etcDocuments = useMemo(
    () => OTHER_DOCUMENTS.filter((item) => item.category === 'ETC'),
    []
  );

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.title}
      mainClassName="flex flex-1 flex-col pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))]"
    >
      <section className="bg-[var(--color-bg-white)]">
        <div className="flex border-b border-[var(--color-border-light)]">
          {DOCUMENT_TAB_OPTIONS.map((tab) => {
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
              {selectedYear}
              {PAGE_TEXT.yearSuffix}
              <CalendarDays size={16} color="var(--color-text-muted)" />
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-1 flex-col px-[var(--space-5)] py-[var(--space-4)]">
        {selectedTab === 'PAYSLIP' &&
          (isPayslipLoading ? (
            <div className="flex h-full min-h-[320px] flex-1 items-center justify-center text-[length:var(--text-md2)] font-medium text-[var(--color-text-muted)]">
              급여명세서를 불러오는 중입니다...
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
                    ROUTES.DOCUMENTS_PAYSLIP_DETAIL.replace(
                      ':payslipId',
                      payslipId
                    ),
                    {
                      state: {
                        employeeName: meta?.employeeName,
                        targetMonth: meta?.targetMonth,
                        from: 'documents',
                      },
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
                      ROUTES.DOCUMENTS_CONTRACT_DETAIL.replace(
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
