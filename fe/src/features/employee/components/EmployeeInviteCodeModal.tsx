import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Link2, RefreshCw, Send, X } from 'lucide-react';
import type { OwnerInviteCode } from '@/features/employee/data/mockInviteCode';

interface EmployeeInviteCodeModalProps {
  isOpen: boolean;
  inviteCode: OwnerInviteCode;
  onClose: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

// 직원 초대 코드 모달 - 매장 코드를 표시하고, 복사/공유/재발급 기능을 제공한다
export default function EmployeeInviteCodeModal({
  isOpen,
  inviteCode,
  onClose,
  onRegenerate,
  isRegenerating = false,
}: EmployeeInviteCodeModalProps) {
  // 복사/공유 결과를 1.8초간 토스트 메시지로 표시
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const showFeedback = (message: string) => setFeedbackMessage(message);
  const handleClose = useCallback(() => {
    setFeedbackMessage('');
    onClose();
  }, [onClose]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleEscClose);
    return () => window.removeEventListener('keydown', handleEscClose);
  }, [isOpen, handleClose]);

  // 공유 시 전달할 안내 문구 (매장명 + 초대 코드 + 가입 안내)
  const shareText = useMemo(
    () =>
      `${inviteCode.storeName} 직원 초대 코드입니다.\n코드: ${inviteCode.code}\n코드 입력 후 등록 시 사장님 승인 대기로 전달됩니다.`,
    [inviteCode]
  );

  // 피드백 메시지 1.8초 후 자동 소멸
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = window.setTimeout(() => setFeedbackMessage(''), 1800);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  // 클립보드 복사 공통 유틸 - 성공/실패에 따라 토스트 메시지 표시
  const copyToClipboardWithFeedback = async (
    text: string,
    successMessage: string,
    failMessage: string
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      showFeedback(successMessage);
    } catch {
      showFeedback(failMessage);
    }
  };

  const handleCopyCode = () =>
    copyToClipboardWithFeedback(
      inviteCode.code,
      '매장 코드를 복사했어요.',
      '복사 권한이 없어 복사하지 못했어요.'
    );

  // Web Share API 우선 시도 → 미지원 또는 취소 시 클립보드 복사로 fallback
  const handleShareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${inviteCode.storeName} 직원 초대`,
          text: shareText,
        });
        showFeedback('초대 코드를 공유했어요.');
        return;
      } catch {
        // 공유를 취소했거나 실패하면 복사 fallback으로 이어진다.
      }
    }

    await copyToClipboardWithFeedback(
      shareText,
      '공유 기능이 없어 안내 문구를 복사했어요.',
      '공유/복사를 진행하지 못했어요.'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center">
      <button
        type="button"
        aria-label="초대 코드 모달 닫기"
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      <section className="relative mx-[var(--space-5)] w-full max-w-[420px] rounded-[var(--radius-lg)] bg-[var(--color-bg-white)] shadow-[var(--shadow-card)]">
        <header className="flex items-center justify-between border-b border-[var(--color-border-light)] px-[var(--space-5)] py-[var(--space-4)]">
          <div>
            <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
              직원 초대 코드
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-[var(--space-4)] px-[var(--space-5)] py-[var(--space-5)]">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-[var(--space-4)] py-[var(--space-4)]">
            <p className="text-[length:var(--text-xs)] font-medium text-[var(--color-text-muted)]">
              매장명
            </p>
            <p className="mt-[var(--space-1)] text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
              {inviteCode.storeName}
            </p>

            <p className="mt-[var(--space-3)] text-[length:var(--text-xs)] font-medium text-[var(--color-text-muted)]">
              매장 코드
            </p>
            <div className="mt-[var(--space-1)] rounded-[var(--radius-sm)] border border-[var(--color-border-muted)] bg-[var(--color-bg-white)] px-[var(--space-4)] py-[var(--space-3)]">
              <p className="text-center font-mono text-[length:var(--text-xl)] font-bold tracking-[0.12em] text-[var(--color-danger)]">
                {inviteCode.code}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-badge-green-bg)] px-[var(--space-3)] py-[var(--space-3)]">
            <Send
              size={14}
              className="mt-[2px] text-[var(--color-status-green-dot)]"
            />
            <p className="text-[length:var(--text-xs)] font-medium text-[var(--color-status-green-dot)]">
              직원이 코드로 가입/등록하면
              <br />
              사장님 승인 대기 목록으로 전달됩니다.
            </p>
          </div>
        </div>

        <footer className="space-y-[var(--space-2)] border-t border-[var(--color-border-light)] px-[var(--space-5)] py-[var(--space-4)]">
          <div className="grid grid-cols-2 gap-[var(--space-2)]">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex h-11 items-center justify-center gap-[var(--space-1-5)] rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]"
            >
              <Copy size={14} />
              코드 복사
            </button>
            <button
              type="button"
              onClick={handleShareCode}
              className="inline-flex h-11 items-center justify-center gap-[var(--space-1-5)] rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-[length:var(--text-sm)] font-bold text-[var(--color-text-primary)]"
            >
              <Link2 size={14} />
              공유하기
            </button>
          </div>
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex h-10 w-full items-center justify-center gap-[var(--space-1-5)] rounded-[var(--radius-sm)] border border-[var(--color-border-muted)] text-[length:var(--text-sm)] font-medium text-[var(--color-text-muted)] disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={isRegenerating ? 'animate-spin' : ''}
              />
              {isRegenerating ? '발급 중...' : '코드 재발급'}
            </button>
          )}
          {feedbackMessage && (
            <p className="text-center text-[length:var(--text-xs)] font-medium text-[var(--color-status-green-dot)]">
              {feedbackMessage}
            </p>
          )}
        </footer>
      </section>
    </div>
  );
}
