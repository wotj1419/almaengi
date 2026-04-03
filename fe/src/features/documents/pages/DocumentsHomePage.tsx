import { Calendar, Files, Inbox, Upload, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';

interface SectionCardProps {
  title: string;
  children: ReactNode;
}

interface ActionCardProps {
  title: string;
  icon: ReactNode;
  onClick: () => void;
  bgClassName: string;
  titleClassName?: string;
  className?: string;
}

const PAGE_TEXT = {
  pageTitle: '문서함',
  preparing: '준비 중인 기능입니다.',
  documentSectionTitle: '문서 관리',
  storeDataSectionTitle: '매장 데이터',
  myDocuments: '내 문서',
  requestDocuments: '근로계약서 작성',
  registerDocuments: '문서 등록',
  timesheet: '근무표',
  payrollLedger: '급여대장',
} as const;

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-card)]">
      <h2 className="mb-[var(--space-4)] px-[var(--space-1)] text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ActionCard({
  title,
  icon,
  onClick,
  bgClassName,
  titleClassName = '',
  className = '',
}: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${bgClassName} h-[110px] w-full cursor-pointer rounded-[var(--radius-lg)] p-[var(--space-7)] text-left shadow-[var(--shadow-card)] ${className}`.trim()}
    >
      <div className="flex h-full flex-col justify-between">
        <p
          className={`text-[length:var(--text-xl)] font-bold leading-tight text-[var(--color-text-primary)] ${titleClassName}`.trim()}
        >
          {title}
        </p>
        <div className="flex justify-end">{icon}</div>
      </div>
    </button>
  );
}

export default function DocumentsHomePage() {
  const navigate = useNavigate();
  const showPreparingToast = () => toast(PAGE_TEXT.preparing);

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.pageTitle}
      mainClassName="flex flex-1 flex-col gap-[var(--space-8)] px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-9)+env(safe-area-inset-bottom,0px))] pt-[var(--space-5)]"
    >
      <SectionCard title={PAGE_TEXT.documentSectionTitle}>
        <div className="grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-4)]">
          <ActionCard
            title={PAGE_TEXT.myDocuments}
            bgClassName="col-span-2 bg-[var(--color-action-board)]"
            icon={
              <Files
                size={24}
                color="var(--color-icon-muted)"
                strokeWidth={1.9}
              />
            }
            onClick={() => navigate(ROUTES.DOCUMENTS_MY)}
          />
          <ActionCard
            title={PAGE_TEXT.requestDocuments}
            bgClassName="bg-[var(--color-action-attendance)]"
            icon={
              <Inbox
                size={24}
                color="var(--color-icon-muted)"
                strokeWidth={1.9}
              />
            }
            onClick={() => navigate(ROUTES.DOCUMENTS_REQUEST)}
          />
          <ActionCard
            title={PAGE_TEXT.registerDocuments}
            bgClassName="bg-[var(--color-action-todo)]"
            icon={
              <Upload
                size={24}
                color="var(--color-icon-dark)"
                strokeWidth={1.9}
              />
            }
            onClick={showPreparingToast}
          />
        </div>
      </SectionCard>

      <SectionCard title={PAGE_TEXT.storeDataSectionTitle}>
        <div className="grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-4)]">
          <ActionCard
            title={PAGE_TEXT.timesheet}
            bgClassName="bg-[var(--color-action-schedule)]"
            titleClassName="text-[var(--color-action-schedule-text)]"
            icon={
              <Calendar
                size={24}
                color="var(--color-icon-light)"
                strokeWidth={1.9}
              />
            }
            onClick={showPreparingToast}
          />
          <ActionCard
            title={PAGE_TEXT.payrollLedger}
            bgClassName="bg-[var(--color-status-blue-bg)]"
            icon={
              <Wallet
                size={24}
                color="var(--color-status-blue-dot)"
                strokeWidth={1.9}
              />
            }
            onClick={showPreparingToast}
          />
        </div>
      </SectionCard>
    </DocumentsPageLayout>
  );
}
