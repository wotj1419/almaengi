import { Download, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getContractDetail,
  getContractPdfBlob,
  mapContractStatus,
  signByOwner,
  type ContractDetail,
} from '@/api/contract';
import { getApiErrorMessage, getApiErrorMessageAsync } from '@/api/error';
import { ROUTES } from '@/constants/routes';
import ContractStatusBadge from '@/features/documents/components/ContractStatusBadge';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';
import SignaturePad from '@/features/documents/components/SignaturePad';
import useStoreStore from '@/stores/useStoreStore';

const PAGE_TEXT = {
  title: '근로계약서 상세',
  notFoundTitle: '근로계약서를 찾을 수 없습니다.',
  notFoundDescription: '목록에서 다시 선택해 주세요.',
  loading: '근로계약서를 불러오는 중입니다...',
  openInNewTab: '새 창으로 열기',
  download: '다운로드',
  preview: 'PDF 미리보기',
  noPdf: '아직 조회 가능한 계약서 PDF가 없습니다.',
  ownerSignTitle: '사장님 서명',
  ownerSignButton: '사장님 서명 완료',
  ownerSignSuccess: '사장님 서명이 완료되었습니다.',
} as const;

function formatDate(value: string | null) {
  if (!value) return '-';
  return value.slice(0, 10).replaceAll('-', '.');
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  const date = value.slice(0, 10).replaceAll('-', '.');
  const time = value.slice(11, 16);
  return `${date} ${time}`;
}

function formatTime(value: string | null) {
  if (!value) return '-';
  return value.slice(0, 5);
}

function yesNo(value: boolean) {
  return value ? '예' : '아니오';
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-[var(--space-3)]">
      <span className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className="text-right text-[length:var(--text-sm)] font-bold text-[var(--color-text-primary)]">
        {value}
      </span>
    </div>
  );
}

export default function ContractDetailPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const numericContractId = useMemo(() => Number(contractId), [contractId]);

  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [ownerSignature, setOwnerSignature] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOwnerSigning, setIsOwnerSigning] = useState(false);

  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const handleBack = () =>
    navigate(`${ROUTES.DOCUMENTS_MY}?tab=CONTRACT`, { replace: true });

  useEffect(() => {
    let cancelled = false;
    let currentObjectUrl: string | null = null;

    const fetchContract = async () => {
      if (!currentStore) {
        setErrorMessage('매장 정보가 없어 근로계약서를 조회할 수 없습니다.');
        setIsLoading(false);
        return;
      }

      if (!Number.isInteger(numericContractId) || numericContractId <= 0) {
        setErrorMessage(PAGE_TEXT.notFoundTitle);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setPdfErrorMessage(null);
      setPdfObjectUrl(null);
      setPdfFileName('');

      try {
        const contractDetail = await getContractDetail(
          currentStore.storeId,
          numericContractId
        );
        if (cancelled) return;

        setDetail(contractDetail);

        try {
          const pdfResponse = await getContractPdfBlob(
            currentStore.storeId,
            numericContractId,
            false
          );
          if (cancelled) return;

          currentObjectUrl = URL.createObjectURL(pdfResponse.blob);
          setPdfObjectUrl(currentObjectUrl);
          setPdfFileName(pdfResponse.fileName);
          setPdfErrorMessage(null);
        } catch (pdfError) {
          if (cancelled) return;
          const parsedMessage = await getApiErrorMessageAsync(
            pdfError,
            PAGE_TEXT.noPdf
          );
          setPdfErrorMessage(parsedMessage);
          setPdfObjectUrl(null);
          setPdfFileName('');
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          getApiErrorMessage(error, '근로계약서 조회에 실패했습니다.')
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchContract();

    return () => {
      cancelled = true;
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    };
  }, [currentStore, numericContractId, reloadKey]);

  const handleOwnerSign = async () => {
    if (!currentStore || !detail) return;

    if (!ownerSignature) {
      toast.error('서명을 먼저 입력해 주세요.');
      return;
    }

    try {
      setIsOwnerSigning(true);
      const signed = await signByOwner(
        currentStore.storeId,
        detail.contractId,
        {
          signature: ownerSignature,
        }
      );
      setDetail(signed);
      setOwnerSignature('');
      setReloadKey((prev) => prev + 1);
      toast.success(PAGE_TEXT.ownerSignSuccess);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, '사장님 서명 처리에 실패했습니다.')
      );
    } finally {
      setIsOwnerSigning(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (!pdfObjectUrl) return;
    window.open(pdfObjectUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    if (!currentStore || !detail) return;

    try {
      setIsDownloading(true);
      const pdfResponse = await getContractPdfBlob(
        currentStore.storeId,
        detail.contractId,
        true
      );
      const downloadUrl = URL.createObjectURL(pdfResponse.blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download =
        pdfResponse.fileName || `contract-${detail.contractId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const parsedMessage = await getApiErrorMessageAsync(
        error,
        '근로계약서 다운로드에 실패했습니다.'
      );
      toast.error(parsedMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isLoading && (!detail || !!errorMessage)) {
    return (
      <DocumentsPageLayout
        title={PAGE_TEXT.title}
        onBack={handleBack}
        mainClassName="px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)]"
      >
        <section className="flex min-h-[60dvh] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-6)] text-center shadow-[var(--shadow-form-card)]">
          <p className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            {PAGE_TEXT.notFoundTitle}
          </p>
          <p className="mt-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
            {errorMessage ?? PAGE_TEXT.notFoundDescription}
          </p>
        </section>
      </DocumentsPageLayout>
    );
  }

  if (isLoading) {
    return (
      <DocumentsPageLayout
        title={PAGE_TEXT.title}
        onBack={handleBack}
        mainClassName="px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)]"
      >
        <section className="flex min-h-[60dvh] items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-muted)] shadow-[var(--shadow-form-card)]">
          {PAGE_TEXT.loading}
        </section>
      </DocumentsPageLayout>
    );
  }

  const contract = detail!;
  const title = `${contract.employeeName} 근로계약서`;

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.title}
      onBack={handleBack}
      mainClassName="px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)]"
    >
      <section className="space-y-[var(--space-4)]">
        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
          <div className="flex items-start justify-between gap-[var(--space-2)]">
            <div>
              <h1 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
                {title}
              </h1>
              <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                작성일 {formatDate(contract.createdAt)}
              </p>
            </div>
            <ContractStatusBadge status={mapContractStatus(contract.status)} />
          </div>
        </article>

        <article className="space-y-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
          <InfoRow
            label="근로계약 기간"
            value={`${formatDate(contract.contractStartDate)} ~ ${formatDate(contract.contractEndDate)}`}
          />
          <InfoRow label="근무 장소" value={contract.workplace || '-'} />
          <InfoRow label="업무 내용" value={contract.jobDescription} />
          <InfoRow
            label="소정근로시간"
            value={`${formatTime(contract.workStartTime)} ~ ${formatTime(contract.workEndTime)}`}
          />
          <InfoRow
            label="휴게시간"
            value={`${formatTime(contract.breakStartTime)} ~ ${formatTime(contract.breakEndTime)}`}
          />
          <InfoRow
            label="주 근무일수"
            value={`${contract.workDaysPerWeek}일`}
          />
          <InfoRow label="주휴일" value={contract.weeklyHoliday} />
          <InfoRow label="임금유형" value={contract.wageType} />
          <InfoRow
            label="임금"
            value={`${contract.wageAmount.toLocaleString()}원`}
          />
          <InfoRow label="상여금" value={yesNo(contract.hasBonus)} />
          <InfoRow
            label="상여금 금액"
            value={
              contract.bonusAmount === null
                ? '-'
                : `${contract.bonusAmount.toLocaleString()}원`
            }
          />
          <InfoRow label="기타급여" value={yesNo(contract.hasOtherAllowance)} />
          <InfoRow
            label="기타급여 상세"
            value={contract.otherAllowanceDetails ?? '-'}
          />
          <InfoRow label="임금 지급일" value={contract.payDayDescription} />
          <InfoRow
            label="사회보험"
            value={`고용:${yesNo(contract.employmentInsurance)}, 산재:${yesNo(contract.industrialAccidentInsurance)}, 국민연금:${yesNo(contract.nationalPension)}, 건강:${yesNo(contract.healthInsurance)}`}
          />
          <InfoRow label="근로자 이름" value={contract.employeeName} />
          <InfoRow label="근로자 연락처" value={contract.employeePhone} />
          <InfoRow label="근로자 주소" value={contract.employeeAddress} />
          <InfoRow
            label="사장님 서명 여부"
            value={yesNo(contract.ownerSigned)}
          />
          <InfoRow
            label="사장님 서명 시각"
            value={formatDateTime(contract.ownerSignedAt)}
          />
          <InfoRow
            label="직원 서명 여부"
            value={yesNo(contract.employeeSigned)}
          />
          <InfoRow
            label="직원 서명 시각"
            value={formatDateTime(contract.employeeSignedAt)}
          />
        </article>

        {contract.status === 'DRAFT' && (
          <article className="space-y-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
            <h2 className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
              {PAGE_TEXT.ownerSignTitle}
            </h2>
            <SignaturePad
              label={PAGE_TEXT.ownerSignTitle}
              value={ownerSignature}
              onChange={setOwnerSignature}
            />
            <button
              type="button"
              onClick={handleOwnerSign}
              disabled={isOwnerSigning || !ownerSignature}
              className="h-12 w-full rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PAGE_TEXT.ownerSignButton}
            </button>
          </article>
        )}

        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
          <p className="text-[length:var(--text-xs)] font-bold text-[var(--color-text-muted)]">
            파일명 {pdfFileName || '-'}
          </p>
          <div className="mt-[var(--space-3)] flex gap-[var(--space-2)]">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              disabled={!pdfObjectUrl}
              className="inline-flex h-10 items-center gap-[var(--space-1)] rounded-[var(--radius-md)] border border-[var(--color-border-muted)] px-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PAGE_TEXT.openInNewTab}
              <ExternalLink size={14} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex h-10 items-center gap-[var(--space-1)] rounded-[var(--radius-md)] bg-[var(--color-primary)] px-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PAGE_TEXT.download}
              <Download size={14} />
            </button>
          </div>
        </article>

        <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)]">
          <div className="border-b border-[var(--color-border-light)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
            {PAGE_TEXT.preview}
          </div>
          {pdfObjectUrl ? (
            <iframe
              title={title}
              src={pdfObjectUrl}
              className="h-[65dvh] w-full bg-[var(--color-bg-surface)]"
            />
          ) : (
            <div className="flex h-[65dvh] w-full items-center justify-center bg-[var(--color-bg-surface)] px-[var(--space-4)] text-center text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
              {pdfErrorMessage ?? PAGE_TEXT.noPdf}
            </div>
          )}
        </article>
      </section>
    </DocumentsPageLayout>
  );
}
