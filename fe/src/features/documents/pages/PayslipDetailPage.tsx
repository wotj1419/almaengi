import { Download, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';
import { findPayslipById } from '@/features/documents/data/mockDocuments';
import { ROUTES } from '@/constants/routes';

const PAGE_TEXT = {
  title: '급여명세서',
  notFoundTitle: '급여명세서를 찾을 수 없습니다.',
  notFoundDescription: '목록에서 다시 선택해주세요.',
  openInNewTab: '새 창으로 열기',
  download: '다운로드',
  preview: 'PDF 미리보기',
} as const;

export default function PayslipDetailPage() {
  const { payslipId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    year?: number;
    month?: number;
    from?: string;
  } | null;
  const payslip = useMemo(() => findPayslipById(payslipId), [payslipId]);

  const handleBack =
    locationState?.from === 'payroll' &&
    locationState.year &&
    locationState.month
      ? () =>
          navigate(ROUTES.PAYROLL, {
            state: { year: locationState.year, month: locationState.month },
          })
      : undefined;

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.title}
      onBack={handleBack}
      mainClassName="px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)]"
    >
      {!payslip ? (
        <section className="flex min-h-[60dvh] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-6)] text-center shadow-[var(--shadow-form-card)]">
          <p className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
            {PAGE_TEXT.notFoundTitle}
          </p>
          <p className="mt-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
            {PAGE_TEXT.notFoundDescription}
          </p>
        </section>
      ) : (
        <section className="space-y-[var(--space-4)]">
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
            <p className="text-[length:var(--text-xs)] font-bold text-[var(--color-text-muted)]">
              {payslip.year}년 {payslip.month}월 · 발행일 {payslip.issuedAt}
            </p>
            <h1 className="mt-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
              {payslip.title}
            </h1>
            <div className="mt-[var(--space-4)] flex gap-[var(--space-2)]">
              <a
                href={payslip.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-[var(--space-1)] rounded-[var(--radius-md)] border border-[var(--color-border-muted)] px-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]"
              >
                {PAGE_TEXT.openInNewTab}
                <ExternalLink size={14} />
              </a>
              <a
                href={payslip.pdfUrl}
                download={`${payslip.id}.pdf`}
                className="inline-flex h-10 items-center gap-[var(--space-1)] rounded-[var(--radius-md)] bg-[var(--color-primary)] px-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-primary)]"
              >
                {PAGE_TEXT.download}
                <Download size={14} />
              </a>
            </div>
          </article>

          <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)]">
            <div className="border-b border-[var(--color-border-light)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.preview}
            </div>
            <iframe
              title={payslip.title}
              src={payslip.pdfUrl}
              className="h-[65dvh] w-full bg-[var(--color-bg-surface)]"
            />
          </article>
        </section>
      )}
    </DocumentsPageLayout>
  );
}
