import { Download, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getPayrollDetail,
  getPayslipPdfBlob,
  type PayrollDetailViewResponse,
} from '@/api/payroll';
import { getApiErrorMessage, getApiErrorMessageAsync } from '@/api/error';
import { ROUTES } from '@/constants/routes';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';
import useStoreStore from '@/stores/useStoreStore';

const PAGE_TEXT = {
  title: '급여명세서',
  notFoundTitle: '급여명세서를 찾을 수 없습니다.',
  notFoundDescription: '목록에서 다시 선택해 주세요.',
  openInNewTab: '새 창으로 열기',
  download: '다운로드',
  preview: 'PDF 미리보기',
  loading: '급여명세서를 불러오는 중입니다...',
  noPdf: '급여명세서 PDF가 아직 준비되지 않았습니다.',
} as const;

export default function EmployeePayslipDetailPage() {
  const { payslipId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentStore = useStoreStore((s) => s.currentStore);
  const locationState = location.state as {
    targetMonth?: string;
    from?: string;
  } | null;

  const payrollId = useMemo(() => Number(payslipId), [payslipId]);
  const [detail, setDetail] = useState<PayrollDetailViewResponse | null>(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let currentObjectUrl: string | null = null;

    const fetchDetailAndPdf = async () => {
      if (!currentStore) {
        setErrorMessage('매장 정보가 없어 급여명세서를 조회할 수 없습니다.');
        setIsLoading(false);
        return;
      }

      if (!Number.isInteger(payrollId) || payrollId <= 0) {
        setErrorMessage(PAGE_TEXT.notFoundTitle);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setPdfErrorMessage(null);
      setDetail(null);
      setPdfObjectUrl(null);
      setPdfFileName('');

      try {
        const detailResponse = await getPayrollDetail(
          currentStore.storeId,
          payrollId
        );
        if (cancelled) return;
        setDetail(detailResponse);

        try {
          const pdfResponse = await getPayslipPdfBlob(
            currentStore.storeId,
            payrollId,
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
            '급여명세서 PDF를 아직 조회할 수 없습니다.'
          );
          setPdfErrorMessage(parsedMessage);
          setPdfObjectUrl(null);
          setPdfFileName('');
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          getApiErrorMessage(error, '급여명세서 조회에 실패했습니다.')
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchDetailAndPdf();

    return () => {
      cancelled = true;
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    };
  }, [currentStore, payrollId]);

  const targetMonth = detail?.targetMonth ?? locationState?.targetMonth ?? '-';
  const [yearLabel, monthLabel] = targetMonth.includes('-')
    ? targetMonth.split('-')
    : ['-', '-'];
  const title = detail?.employeeName
    ? `${detail.employeeName} ${targetMonth} 급여명세서`
    : `${targetMonth} 급여명세서`;

  const handleOpenInNewTab = () => {
    if (!pdfObjectUrl) return;
    window.open(pdfObjectUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    if (!currentStore || !Number.isInteger(payrollId) || payrollId <= 0) return;

    try {
      setIsDownloading(true);
      const pdfResponse = await getPayslipPdfBlob(
        currentStore.storeId,
        payrollId,
        true
      );
      const downloadUrl = URL.createObjectURL(pdfResponse.blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = pdfResponse.fileName || `payslip-${payrollId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setPdfErrorMessage(null);
    } catch (error) {
      const parsedMessage = await getApiErrorMessageAsync(
        error,
        '급여명세서 다운로드에 실패했습니다.'
      );
      setPdfErrorMessage(parsedMessage);
      toast.error(parsedMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.title}
      onBack={() =>
        navigate(
          locationState?.from === 'payroll'
            ? ROUTES.PAYROLL
            : ROUTES.WORKER_DOCUMENTS,
          { replace: true }
        )
      }
      mainClassName="px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)]"
    >
      {!isLoading && (!detail || !!errorMessage) ? (
        <section className="flex min-h-[60dvh] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-6)] text-center shadow-[var(--shadow-form-card)]">
          <p className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            {PAGE_TEXT.notFoundTitle}
          </p>
          <p className="mt-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
            {errorMessage ?? PAGE_TEXT.notFoundDescription}
          </p>
        </section>
      ) : isLoading ? (
        <section className="flex min-h-[60dvh] items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-muted)] shadow-[var(--shadow-form-card)]">
          {PAGE_TEXT.loading}
        </section>
      ) : (
        <section className="space-y-[var(--space-4)]">
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
            <p className="text-[length:var(--text-xs)] font-bold text-[var(--color-text-muted)]">
              {yearLabel}년 {monthLabel}월 · 파일명 {pdfFileName || '-'}
            </p>
            <h1 className="mt-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
              {title}
            </h1>
            <div className="mt-[var(--space-4)] flex gap-[var(--space-2)]">
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
                disabled={isDownloading || !detail}
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
      )}
    </DocumentsPageLayout>
  );
}
