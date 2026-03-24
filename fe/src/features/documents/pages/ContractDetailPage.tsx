import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import ContractPdfViewer from '@/features/documents/components/ContractPdfViewer';
import ContractStatusBadge from '@/features/documents/components/ContractStatusBadge';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';
import SignaturePad from '@/features/documents/components/SignaturePad';
import {
  approveContract,
  getContractRecordById,
  submitEmployeeContract,
  subscribeContractRecords,
  type ContractRecord,
} from '@/features/documents/data/mockContracts';

const PAGE_TEXT = {
  title: '근로계약서 상세',
  notFoundTitle: '근로계약서를 찾을 수 없습니다.',
  notFoundDescription: '내 문서 목록에서 다시 선택해주세요.',
  ownerInfo: '사장님 작성 정보',
  requestMeta: '요청 메타 정보',
  employeeMockSection: '직원 제출 정보 (목업)',
  employeeMockDescription:
    '직원 화면이 연결되기 전까지는 이 영역에서 직원 제출을 목업으로 확인합니다.',
  employeeSubmittedSection: '직원 제출 완료',
  requestedAt: '요청 생성',
  updatedAt: '최종 변경',
  approvedAt: '확인 완료일',
  period: '근로계약 기간',
  workPlace: '근무 장소',
  workDescription: '업무 내용',
  workTime: '소정근로시간',
  breakTime: '휴게시간',
  weeklyWorkDays: '주 근무일수',
  weeklyHoliday: '주휴일',
  hourlyWage: '시급',
  bonus: '상여금',
  otherPay: '기타급여',
  payday: '임금 지급일',
  insurance: '사회보험',
  writtenDate: '작성일',
  businessName: '사업체명',
  businessAddress: '사업체 주소',
  representativeName: '대표자',
  businessPhone: '전화번호',
  employeeName: '성명',
  employeeAddress: '주소',
  employeePhone: '연락처',
  submittedAt: '제출일',
  ownerSignature: '사장님 서명',
  employeeSignature: '직원 서명',
  none: '없음',
  mockReceiveButton: '직원 제출 수신(목업)',
  approveButton: '확인',
  inputRequiredError: '직원 입력 항목과 서명을 모두 채워 주세요.',
  mockReceiveSuccess:
    '직원 제출을 수신했습니다. 상태가 확인대기로 변경됐습니다.',
  approveSuccess: '근로계약서 확인이 완료됐습니다.',
} as const;

function formatDate(value: string | null) {
  if (!value) return '-';
  return value.slice(0, 10).replaceAll('-', '.');
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
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

function ContractSummary({ record }: { record: ContractRecord }) {
  const { ownerForm } = record;
  const insuranceLabels = [
    ownerForm.insuranceEmployment ? '고용보험' : '',
    ownerForm.insuranceIndustrial ? '산재보험' : '',
    ownerForm.insuranceNationalPension ? '국민연금' : '',
    ownerForm.insuranceHealth ? '건강보험' : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <section className="space-y-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
      <h2 className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
        {PAGE_TEXT.ownerInfo}
      </h2>
      <InfoRow
        label={PAGE_TEXT.period}
        value={`${ownerForm.contractStartDate || '-'} ~ ${ownerForm.contractEndDate || '-'}`}
      />
      <InfoRow label={PAGE_TEXT.workPlace} value={ownerForm.workPlace} />
      <InfoRow
        label={PAGE_TEXT.workDescription}
        value={ownerForm.workDescription}
      />
      <InfoRow
        label={PAGE_TEXT.workTime}
        value={`${ownerForm.scheduledStartTime || '-'} ~ ${ownerForm.scheduledEndTime || '-'}`}
      />
      <InfoRow
        label={PAGE_TEXT.breakTime}
        value={`${ownerForm.breakStartTime || '-'} ~ ${ownerForm.breakEndTime || '-'}`}
      />
      <InfoRow
        label={PAGE_TEXT.weeklyWorkDays}
        value={`${ownerForm.weeklyWorkDays || '-'}일`}
      />
      <InfoRow
        label={PAGE_TEXT.weeklyHoliday}
        value={ownerForm.weeklyHoliday || '-'}
      />
      <InfoRow
        label={PAGE_TEXT.hourlyWage}
        value={`${ownerForm.hourlyWage || '-'}원`}
      />
      <InfoRow
        label={PAGE_TEXT.bonus}
        value={
          ownerForm.hasBonus
            ? `${ownerForm.bonusAmount || '-'}원`
            : PAGE_TEXT.none
        }
      />
      <InfoRow
        label={PAGE_TEXT.otherPay}
        value={
          ownerForm.hasOtherPay
            ? `${ownerForm.otherPayName || '-'} / ${ownerForm.otherPayAmount || '-'}원`
            : PAGE_TEXT.none
        }
      />
      <InfoRow label={PAGE_TEXT.payday} value={ownerForm.payday || '-'} />
      <InfoRow
        label={PAGE_TEXT.insurance}
        value={insuranceLabels || PAGE_TEXT.none}
      />
      <InfoRow
        label={PAGE_TEXT.writtenDate}
        value={ownerForm.writtenDate || '-'}
      />
      <InfoRow
        label={PAGE_TEXT.businessName}
        value={ownerForm.businessName || '-'}
      />
      <InfoRow
        label={PAGE_TEXT.businessAddress}
        value={ownerForm.businessAddress || '-'}
      />
      <InfoRow
        label={PAGE_TEXT.representativeName}
        value={ownerForm.representativeName || '-'}
      />
      <InfoRow
        label={PAGE_TEXT.businessPhone}
        value={ownerForm.businessPhone || '-'}
      />
      <SignaturePad
        label={PAGE_TEXT.ownerSignature}
        value={ownerForm.ownerSignatureDataUrl}
        onChange={() => {}}
        readOnly
      />
    </section>
  );
}

export default function ContractDetailPage() {
  const { contractId } = useParams();

  const [record, setRecord] = useState<ContractRecord | null>(() =>
    getContractRecordById(contractId)
  );
  const [employeeName, setEmployeeName] = useState('');
  const [employeeAddress, setEmployeeAddress] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeSignature, setEmployeeSignature] = useState('');

  useEffect(() => {
    setRecord(getContractRecordById(contractId));
  }, [contractId]);

  useEffect(() => {
    return subscribeContractRecords(() => {
      setRecord(getContractRecordById(contractId));
    });
  }, [contractId]);

  useEffect(() => {
    if (!record) return;

    if (record.employeeSubmission) {
      setEmployeeName(record.employeeSubmission.employeeName);
      setEmployeeAddress(record.employeeSubmission.employeeAddress);
      setEmployeePhone(record.employeeSubmission.employeePhone);
      setEmployeeSignature(record.employeeSubmission.employeeSignatureDataUrl);
      return;
    }

    setEmployeeName(record.ownerForm.employeeName);
  }, [record]);

  const canReceiveEmployeeSubmission = useMemo(
    () =>
      Boolean(
        employeeName && employeeAddress && employeePhone && employeeSignature
      ),
    [employeeAddress, employeeName, employeePhone, employeeSignature]
  );

  const handleMockReceive = () => {
    if (!record) return;

    if (!canReceiveEmployeeSubmission) {
      toast.error(PAGE_TEXT.inputRequiredError);
      return;
    }

    const updated = submitEmployeeContract(record.id, {
      employeeName,
      employeeAddress,
      employeePhone,
      employeeSignatureDataUrl: employeeSignature,
    });

    if (!updated) return;
    toast.success(PAGE_TEXT.mockReceiveSuccess);
  };

  const handleApprove = () => {
    if (!record) return;

    const updated = approveContract(record.id);
    if (!updated) return;

    toast.success(PAGE_TEXT.approveSuccess);
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
      <section className="space-y-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
        <div className="flex items-start justify-between gap-[var(--space-3)]">
          <div>
            <h1 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
              {record.title}
            </h1>
            <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
              작성일 {formatDate(record.createdAt)}
            </p>
          </div>
          <ContractStatusBadge status={record.status} />
        </div>

        <InfoRow
          label={PAGE_TEXT.requestedAt}
          value={formatDate(record.createdAt)}
        />
        <InfoRow
          label={PAGE_TEXT.updatedAt}
          value={formatDate(record.updatedAt)}
        />
        <InfoRow
          label={PAGE_TEXT.approvedAt}
          value={formatDate(record.approvedAt)}
        />
      </section>

      <ContractSummary record={record} />

      {record.status === 'REQUESTING' && (
        <section className="space-y-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
          <h2 className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
            {PAGE_TEXT.employeeMockSection}
          </h2>
          <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
            {PAGE_TEXT.employeeMockDescription}
          </p>
          <input
            value={employeeName}
            onChange={(event) => setEmployeeName(event.target.value)}
            placeholder={PAGE_TEXT.employeeName}
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-primary)] outline-none"
          />
          <input
            value={employeeAddress}
            onChange={(event) => setEmployeeAddress(event.target.value)}
            placeholder={PAGE_TEXT.employeeAddress}
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-primary)] outline-none"
          />
          <input
            value={employeePhone}
            onChange={(event) => setEmployeePhone(event.target.value)}
            placeholder={PAGE_TEXT.employeePhone}
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-primary)] outline-none"
          />
          <SignaturePad
            label={PAGE_TEXT.employeeSignature}
            value={employeeSignature}
            onChange={setEmployeeSignature}
          />
          <button
            type="button"
            onClick={handleMockReceive}
            disabled={!canReceiveEmployeeSubmission}
            className="h-12 w-full rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PAGE_TEXT.mockReceiveButton}
          </button>
        </section>
      )}

      {record.status === 'PENDING_APPROVAL' && (
        <section className="space-y-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
          <h2 className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
            {PAGE_TEXT.employeeSubmittedSection}
          </h2>
          {record.employeeSubmission && (
            <div className="space-y-[var(--space-2)]">
              <InfoRow
                label={PAGE_TEXT.employeeName}
                value={record.employeeSubmission.employeeName}
              />
              <InfoRow
                label={PAGE_TEXT.employeeAddress}
                value={record.employeeSubmission.employeeAddress}
              />
              <InfoRow
                label={PAGE_TEXT.employeePhone}
                value={record.employeeSubmission.employeePhone}
              />
              <InfoRow
                label={PAGE_TEXT.submittedAt}
                value={formatDate(record.employeeSubmission.submittedAt)}
              />
              <SignaturePad
                label={PAGE_TEXT.employeeSignature}
                value={record.employeeSubmission.employeeSignatureDataUrl}
                onChange={() => {}}
                readOnly
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleApprove}
            className="h-12 w-full rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)]"
          >
            {PAGE_TEXT.approveButton}
          </button>
        </section>
      )}

      {record.status === 'APPROVED' && record.pdfUrl && (
        <ContractPdfViewer
          title={record.title}
          pdfUrl={record.pdfUrl}
          downloadName={`${record.id}.pdf`}
        />
      )}
    </DocumentsPageLayout>
  );
}
