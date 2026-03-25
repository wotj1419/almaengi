import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import DetailHeader from '@/components/common/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import useAuthStore from '@/stores/useAuthStore';
import { getStore, type StoreInfo } from '@/api/store';
import NoStoreCard from '@/components/common/NoStoreCard';

export default function QrManagePage() {
  const navigate = useNavigate();
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeStoreId) return;
    getStore(activeStoreId)
      .then(setStore)
      .catch(() => setError(true));
  }, [activeStoreId]);

  const handleSave = async () => {
    if (!cardRef.current || !store) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdfW = canvas.width / 2;
      const pdfH = canvas.height / 2;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pdfW, pdfH],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${store.storeName}_QR.pdf`);
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  return (
    <div
      className={`flex justify-center min-h-screen ${activeStoreId ? 'bg-[var(--color-action-todo)]' : 'bg-[var(--color-bg-base)]'}`}
    >
      <div
        className={`w-full md:max-w-[600px] min-h-screen flex flex-col ${activeStoreId ? 'bg-[var(--color-action-todo)]' : 'bg-[var(--color-bg-base)]'}`}
      >
        <DetailHeader
          title="출퇴근 QR 코드"
          onBack={() => navigate(ROUTES.STORE)}
          rightIcon={
            store ? (
              <Download
                size={22}
                color="var(--color-text-primary)"
                strokeWidth={2}
              />
            ) : undefined
          }
          onRightClick={() => setModalOpen(true)}
        />

        <main
          className={`flex-1 flex flex-col items-center justify-center gap-[var(--space-6)] pb-[calc(var(--height-bottom-nav)+env(safe-area-inset-bottom,0px))] -mt-[var(--space-9)] ${activeStoreId ? 'px-[var(--space-5)]' : ''}`}
        >
          {!activeStoreId ? (
            <div className="w-full">
              <NoStoreCard
                description={
                  <>
                    새로운 매장을 등록하고
                    <br />
                    편리하게 직원을 관리해보세요
                  </>
                }
              />
            </div>
          ) : error ? (
            <p className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text-muted)]">
              QR 코드를 불러오지 못했어요.
            </p>
          ) : !store ? (
            <p className="text-[length:var(--text-md2)] text-[var(--color-text-muted)]">
              불러오는 중...
            </p>
          ) : (
            <div className="flex flex-col items-center gap-[var(--space-9)]">
              <div className="text-center">
                <p className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text-primary)]">
                  {store.storeName}
                </p>
                <p className="mt-[var(--space-1)] text-[length:var(--text-md2)] text-[var(--color-text-muted)]">
                  QR 코드를 스캔하여 출퇴근을 인증합니다.
                </p>
              </div>
              <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] p-[var(--space-8)] aspect-square flex items-center justify-center">
                <QRCodeSVG value={store.qrCode} size={220} />
              </div>
            </div>
          )}
        </main>

        <BottomNav activeTab="store" />
      </div>

      {/* PDF 캡처용 숨김 영역 */}
      {store && (
        <div className="absolute -left-[9999px]">
          <div
            ref={cardRef}
            className="bg-[var(--color-action-todo)] rounded-[var(--radius-lg)] p-[var(--space-8)] flex flex-col items-center gap-[var(--space-6)]"
          >
            <div className="text-center">
              <p className="text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)]">
                {store.storeName}
              </p>
              <p className="mt-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--color-text-muted)] whitespace-nowrap">
                QR 코드를 스캔하여 출퇴근을 인증합니다.
              </p>
            </div>
            <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] p-[var(--space-6)] flex items-center justify-center">
              <QRCodeCanvas value={store.qrCode} size={180} />
            </div>
          </div>
        </div>
      )}

      {store && (
        <ConfirmModal
          isOpen={modalOpen}
          title="QR 코드 저장"
          confirmText={loading ? '저장 중...' : 'PDF 저장'}
          cancelText="닫기"
          showCloseButton
          onConfirm={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
