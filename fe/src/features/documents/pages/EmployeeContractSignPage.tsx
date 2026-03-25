import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';
import SignaturePad from '@/features/documents/components/SignaturePad';
import {
  getEmployeeContractById,
  getEmployeeContractStatusLabel,
  submitEmployeeContractSign,
  subscribeEmployeeContractRecords,
  type EmployeeContractRecord,
} from '@/features/documents/data/mockEmployeeContracts';

const PAGE_TEXT = {
  title: '근로계약서',
  notFoundTitle: '근로계약서를 찾을 수 없습니다.',
  notFoundDescription: '문서함에서 다시 선택해주세요.',
  contractInfo: '계약 조건',
  workerInfo: '근로자 입력 정보',
  employeeName: '성명',
  employeePhone: '연락처',
  employeeAddress: '주소',
  employeeSignature: '근로자 서명',
  status: '상태',
  period: '근로계약 기간',
  workPlace: '근무 장소',
  workDescription: '업무 내용',
  workTime: '소정근로시간',
  breakTime: '휴게시간',
  weeklyWorkDays: '주 근무일수',
  weeklyHoliday: '주휴일',
  hourlyWage: '시급',
  payday: '임금 지급일',
  businessName: '사업체명',
  representativeName: '대표자',
  submit: '제출하기',
  waitingReview: '제출 완료되었습니다. 사장님 검토를 기다려주세요.',
  requiredError: '주소와 서명을 모두 입력해주세요.',
  submitSuccess: '근로계약서가 제출되었습니다.',
} as const;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-[var(--space-3)]">
      <span className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className="text-right text-[length:var(--text-sm)] font-bold text-[var(--color-text-primary)]">
        {value || '-'}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: EmployeeContractRecord['status'] }) {
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

export default function EmployeeContractSignPage() {
  const { contractId } = useParams();
  const [record, setRecord] = useState<EmployeeContractRecord | null>(() =>
    getEmployeeContractById(contractId)
  );
  const [employeeAddress, setEmployeeAddress] = useState('');
  const [employeeSignature, setEmployeeSignature] = useState('');

  useEffect(() => {
    setRecord(getEmployeeContractById(contractId));
  }, [contractId]);

  useEffect(() => {
    return subscribeEmployeeContractRecords(() => {
      setRecord(getEmployeeContractById(contractId));
    });
  }, [contractId]);

  useEffect(() => {
    if (!record) return;
    setEmployeeAddress(record.employeeAddress);
    setEmployeeSignature(record.employeeSignatureDataUrl);
  }, [record]);

  const canSubmit = useMemo(
    () =>
      Boolean(
        record &&
        record.status === 'REQUESTING' &&
        employeeAddress.trim() &&
        employeeSignature
      ),
    [employeeAddress, employeeSignature, record]
  );

  const handleSubmit = () => {
    if (!record) return;
    if (!canSubmit) {
      toast.error(PAGE_TEXT.requiredError);
      return;
    }

    const updated = submitEmployeeContractSign(record.id, {
      employeeAddress: employeeAddress.trim(),
      employeeSignatureDataUrl: employeeSignature,
    });

    if (!updated) return;
    toast.success(PAGE_TEXT.submitSuccess);
  };

  if (!record) {
    return (
      <DocumentsPageLayout
        title={PAGE_TEXT.title}
        mainClassName="px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)]"
      >
        <section className="flex min-h-[60dvh] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-6)] text-center shadow-[var(--shadow-form-card)]">
          <p className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            {PAGE_TEXT.notFoundTitle}
          </p>
          <p className="mt-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
            {PAGE_TEXT.notFoundDescription}
          </p>
        </section>
      </DocumentsPageLayout>
    );
  }

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.title}
      mainClassName="space-y-[var(--space-4)] px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)]"
    >
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
        <div className="flex items-center justify-between gap-[var(--space-3)]">
          <h1 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            {record.title}
          </h1>
          <StatusBadge status={record.status} />
        </div>
        <p className="mt-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
          {PAGE_TEXT.status}: {getEmployeeContractStatusLabel(record.status)}
        </p>
      </section>

      <section className="space-y-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
        <h2 className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
          {PAGE_TEXT.contractInfo}
        </h2>
        <InfoRow
          label={PAGE_TEXT.period}
          value={`${record.ownerForm.contractStartDate || '-'} ~ ${record.ownerForm.contractEndDate || '-'}`}
        />
        <InfoRow
          label={PAGE_TEXT.workPlace}
          value={record.ownerForm.workPlace}
        />
        <InfoRow
          label={PAGE_TEXT.workDescription}
          value={record.ownerForm.workDescription}
        />
        <InfoRow
          label={PAGE_TEXT.workTime}
          value={`${record.ownerForm.scheduledStartTime || '-'} ~ ${record.ownerForm.scheduledEndTime || '-'}`}
        />
        <InfoRow
          label={PAGE_TEXT.breakTime}
          value={`${record.ownerForm.breakStartTime || '-'} ~ ${record.ownerForm.breakEndTime || '-'}`}
        />
        <InfoRow
          label={PAGE_TEXT.weeklyWorkDays}
          value={`${record.ownerForm.weeklyWorkDays || '-'}일`}
        />
        <InfoRow
          label={PAGE_TEXT.weeklyHoliday}
          value={record.ownerForm.weeklyHoliday || '-'}
        />
        <InfoRow
          label={PAGE_TEXT.hourlyWage}
          value={`${record.ownerForm.hourlyWage || '-'}원`}
        />
        <InfoRow
          label={PAGE_TEXT.payday}
          value={record.ownerForm.payday || '-'}
        />
        <InfoRow
          label={PAGE_TEXT.businessName}
          value={record.ownerForm.businessName || '-'}
        />
        <InfoRow
          label={PAGE_TEXT.representativeName}
          value={record.ownerForm.representativeName || '-'}
        />
      </section>

      <section className="space-y-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
        <h2 className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
          {PAGE_TEXT.workerInfo}
        </h2>

        <div className="space-y-[var(--space-1)]">
          <label
            htmlFor="employee-name"
            className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]"
          >
            {PAGE_TEXT.employeeName}
          </label>
          <input
            id="employee-name"
            value={record.employeeName}
            readOnly
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-surface)] px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-secondary)] outline-none"
          />
        </div>

        <div className="space-y-[var(--space-1)]">
          <label
            htmlFor="employee-phone"
            className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]"
          >
            {PAGE_TEXT.employeePhone}
          </label>
          <input
            id="employee-phone"
            value={record.employeePhone}
            readOnly
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-surface)] px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-secondary)] outline-none"
          />
        </div>

        <div className="space-y-[var(--space-1)]">
          <label
            htmlFor="employee-address"
            className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]"
          >
            {PAGE_TEXT.employeeAddress}
          </label>
          <input
            id="employee-address"
            value={employeeAddress}
            onChange={(event) => setEmployeeAddress(event.target.value)}
            readOnly={record.status !== 'REQUESTING'}
            placeholder="주소를 입력해주세요"
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-primary)] outline-none read-only:bg-[var(--color-bg-surface)]"
          />
        </div>

        <SignaturePad
          label={PAGE_TEXT.employeeSignature}
          value={employeeSignature}
          onChange={setEmployeeSignature}
          readOnly={record.status !== 'REQUESTING'}
        />

        {record.status === 'REQUESTING' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-12 w-full rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PAGE_TEXT.submit}
          </button>
        ) : (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-status-purple-bg)] px-[var(--space-3)] py-[var(--space-3)] text-[length:var(--text-sm)] font-medium text-[var(--color-status-purple-dot)]">
            {PAGE_TEXT.waitingReview}
          </p>
        )}
      </section>
    </DocumentsPageLayout>
  );
}
