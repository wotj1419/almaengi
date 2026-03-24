import { ExternalLink } from 'lucide-react';

interface ContractPdfViewerProps {
  title: string;
  pdfUrl: string;
  downloadName: string;
}

export default function ContractPdfViewer({
  title,
  pdfUrl,
  downloadName,
}: ContractPdfViewerProps) {
  return (
    <section className="space-y-[var(--space-4)]">
      <article className="rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
        <h2 className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
          계약서 PDF
        </h2>
        <div className="mt-[var(--space-4)] flex gap-[var(--space-2)]">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-[var(--space-1)] rounded-[var(--radius-md)] border border-[var(--color-border-muted)] px-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]"
          >
            새 창으로 열기
            <ExternalLink size={14} />
          </a>
          <a
            href={pdfUrl}
            download={downloadName}
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-primary)]"
          >
            다운로드
          </a>
        </div>
      </article>

      <article className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)]">
        <div className="border-b border-[var(--color-border-light)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
          PDF 미리보기
        </div>
        <iframe
          title={title}
          src={pdfUrl}
          className="h-[65dvh] w-full bg-[var(--color-bg-surface)]"
        />
      </article>
    </section>
  );
}
