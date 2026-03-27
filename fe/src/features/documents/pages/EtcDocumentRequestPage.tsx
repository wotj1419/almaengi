import dayjs, { type Dayjs } from 'dayjs';
import { Calendar, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DatePickerModal from '@/components/common/DateSheet';
import { ROUTES } from '@/constants/routes';
import DocumentEmployeeSearchModal from '@/features/documents/components/DocumentEmployeeSearchModal';
import DocumentRequestSwitchBar from '@/features/documents/components/DocumentRequestSwitchBar';
import DocumentSelect from '@/features/documents/components/DocumentSelect';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';
import {
  RequestPickerField,
  RequestSection,
  RequestTextArea,
  RequestTextInput,
} from '@/features/documents/components/RequestFormPrimitives';
import {
  createEtcDocumentRequest,
  type EtcDocumentRequestRecord,
} from '@/features/documents/data/mockDocumentRequests';
import useStoreStore from '@/stores/useStoreStore';

type EtcRequestForm = {
  employeeName: string;
  documentName: string;
  documentCategory: string;
  dueDate: string;
  requestMemo: string;
};

const PAGE_TEXT = {
  pageTitle: '문서 요청',
  sectionTitle: '기타 문서 요청 정보',
  employeeName: '직원 이름',
  employeePlaceholder: '직원 선택',
  documentName: '문서명',
  documentNamePlaceholder: '예: 보건증',
  documentCategory: '문서 분류',
  documentCategoryPlaceholder: '문서 분류 선택',
  dueDate: '제출 기한',
  datePlaceholder: '날짜 선택',
  requestMemo: '요청 메모',
  requestMemoPlaceholder: '예: 이번 주까지 제출 부탁드립니다.',
  submit: '직원에게 전송',
  requiredError: '필수 항목을 먼저 입력해 주세요.',
  success: '기타 문서 요청을 전송했습니다.',
  defaultRequesterName: '사장님',
  defaultBusinessName: '우리 매장',
} as const;

const INITIAL_FORM: EtcRequestForm = {
  employeeName: '',
  documentName: '',
  documentCategory: '',
  dueDate: '',
  requestMemo: '',
};

const CATEGORY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '신분증 사본', value: '신분증 사본' },
  { label: '통장 사본', value: '통장 사본' },
  { label: '근로계약서 서명', value: '근로계약서 서명' },
  { label: '보건증', value: '보건증' },
  { label: '법정대리인 동의서', value: '법정대리인 동의서' },
];

function hasRequiredValues(form: EtcRequestForm) {
  return Boolean(
    form.employeeName.trim() &&
    form.documentName.trim() &&
    form.documentCategory.trim() &&
    form.dueDate.trim() &&
    form.requestMemo.trim()
  );
}

export default function EtcDocumentRequestPage() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const [form, setForm] = useState<EtcRequestForm>(INITIAL_FORM);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );

  const canSubmit = useMemo(
    () => hasRequiredValues(form) && selectedEmployeeId !== null,
    [form, selectedEmployeeId]
  );

  const patchForm = <K extends keyof EtcRequestForm>(
    key: K,
    value: EtcRequestForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateConfirm = (date: Dayjs) => {
    setSelectedDate(date);
    patchForm('dueDate', date.format('YYYY-MM-DD'));
    setIsDatePickerOpen(false);
  };

  const handleSubmit = () => {
    if (!canSubmit || !currentStore) {
      toast.error(PAGE_TEXT.requiredError);
      return;
    }

    createEtcDocumentRequest({
      employeeName: form.employeeName,
      documentName: form.documentName,
      documentCategory: form.documentCategory,
      dueDate: form.dueDate,
      requestMemo: form.requestMemo,
      requesterName: PAGE_TEXT.defaultRequesterName,
      businessName: PAGE_TEXT.defaultBusinessName,
    } satisfies Omit<
      EtcDocumentRequestRecord,
      'id' | 'createdAt' | 'status' | 'requestType'
    >);

    toast.success(PAGE_TEXT.success);
    navigate(`${ROUTES.DOCUMENTS_MY}?tab=ETC`);
  };

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.pageTitle}
      mainClassName="pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))]"
    >
      <div className="space-y-[var(--space-4)] px-[var(--space-5)] pt-[var(--space-5)]">
        <DocumentRequestSwitchBar active="ETC" />

        <RequestSection title={PAGE_TEXT.sectionTitle}>
          <RequestPickerField
            label={PAGE_TEXT.employeeName}
            value={form.employeeName}
            placeholder={PAGE_TEXT.employeePlaceholder}
            icon={
              <Search className="h-5 w-5 text-[var(--color-text-secondary)]" />
            }
            onClick={() => setIsEmployeeModalOpen(true)}
          />

          <div className="space-y-[var(--space-2)]">
            <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.documentName}
            </p>
            <RequestTextInput
              value={form.documentName}
              onChange={(value) => patchForm('documentName', value)}
              placeholder={PAGE_TEXT.documentNamePlaceholder}
            />
          </div>

          <DocumentSelect
            label={PAGE_TEXT.documentCategory}
            value={form.documentCategory}
            placeholder={PAGE_TEXT.documentCategoryPlaceholder}
            options={CATEGORY_OPTIONS}
            onChange={(value) => patchForm('documentCategory', value)}
          />

          <RequestPickerField
            label={PAGE_TEXT.dueDate}
            value={form.dueDate}
            placeholder={PAGE_TEXT.datePlaceholder}
            icon={
              <Calendar className="h-5 w-5 text-[var(--color-text-secondary)]" />
            }
            onClick={() => setIsDatePickerOpen(true)}
          />

          <div className="space-y-[var(--space-2)]">
            <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.requestMemo}
            </p>
            <RequestTextArea
              value={form.requestMemo}
              onChange={(value) => patchForm('requestMemo', value)}
              placeholder={PAGE_TEXT.requestMemoPlaceholder}
            />
          </div>
        </RequestSection>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-14 w-full rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {PAGE_TEXT.submit}
        </button>

        <DatePickerModal
          isOpen={isDatePickerOpen}
          selectedDate={form.dueDate ? dayjs(form.dueDate) : selectedDate}
          onConfirm={handleDateConfirm}
          onClose={() => setIsDatePickerOpen(false)}
        />

        <DocumentEmployeeSearchModal
          isOpen={isEmployeeModalOpen}
          storeId={currentStore?.storeId || 0}
          selectedEmployeeId={selectedEmployeeId}
          selectedEmployeeName={form.employeeName}
          onClose={() => setIsEmployeeModalOpen(false)}
          onApply={({ employeeId, employeeName }) => {
            setSelectedEmployeeId(employeeId);
            patchForm('employeeName', employeeName);
          }}
        />
      </div>
    </DocumentsPageLayout>
  );
}
