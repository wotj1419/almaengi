import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { recordAttendance } from '@/api/attendance';
import { ROUTES } from '@/constants/routes';
import ConfirmModal from '@/components/common/ConfirmModal';

type GpsState = 'loading' | 'ready' | 'denied';
type ScanState = 'idle' | 'processing' | 'success' | 'error';

const QR_ELEMENT_ID = 'qr-reader';
export const ATTENDANCE_STORAGE_KEY = 'almaengi_attendance';

const ERROR_MESSAGES: Record<string, string> = {
  A201: '유효하지 않은 QR 코드입니다.',
  A202: '매장 반경 100m 이내에서만 인증 가능합니다.',
  A203: '이미 퇴근 처리가 완료되었습니다.',
  S002: '해당 매장의 직원 정보를 찾을 수 없습니다.',
};

function getStoredAttendanceStatus(): string {
  try {
    const stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!stored) return 'WAITING';
    const { status, date } = JSON.parse(stored);
    if (date !== new Date().toDateString()) return 'WAITING';
    return status ?? 'WAITING';
  } catch {
    return 'WAITING';
  }
}

export default function AttendanceCheckPage() {
  const navigate = useNavigate();

  const [headerTitle] = useState(() => {
    const status = getStoredAttendanceStatus();
    return ['WORKING', 'LATE'].includes(status) ? '퇴근하기' : '출근하기';
  });
  const scanPrompt =
    headerTitle === '퇴근하기'
      ? '퇴근 인증 QR을 스캔해주세요.'
      : '출근 인증 QR을 스캔해주세요.';

  const [gpsState, setGpsState] = useState<GpsState>(() =>
    navigator.geolocation ? 'loading' : 'denied'
  );
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);

  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const isProcessingRef = useRef(false);
  const scannerStartedRef = useRef(false);
  const pendingQrTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coordsRef.current = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setGpsState('ready');
      },
      () => setGpsState('denied')
    );
  }, []);

  const handleClockOutSuccess = (
    data: { status?: string; clockIn?: string | null } | null
  ) => {
    const today = new Date().toDateString();
    localStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify({ status: 'DONE', date: today, clockInTime: null })
    );
    setResultMessage(
      data?.status ? '퇴근이 기록되었습니다.' : '인증이 완료되었습니다.'
    );
    setScanState('success');
  };

  const handleOvertimeConfirm = async (confirm: boolean) => {
    const qrToken = pendingQrTokenRef.current;
    if (!qrToken) return;

    setShowOvertimeModal(false);
    setScanState('processing');
    try {
      const res = await recordAttendance({
        qrToken,
        latitude: coordsRef.current?.lat ?? 0,
        longitude: coordsRef.current?.lon ?? 0,
        overtimeConfirm: confirm,
      });
      handleClockOutSuccess(res.data);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { status?: string } } })
        ?.response?.data?.status;
      setResultMessage(
        ERROR_MESSAGES[code ?? ''] ?? '인증에 실패했습니다. 다시 시도해주세요.'
      );
      setScanState('error');
    }
  };

  useEffect(() => {
    if (scannerStartedRef.current) return;
    scannerStartedRef.current = true;

    const container = document.getElementById(QR_ELEMENT_ID);
    if (container) container.innerHTML = '';

    const scanner = new Html5Qrcode(QR_ELEMENT_ID);

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10 },
        async (qrToken) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          setScanState('processing');

          try {
            await scanner.stop();
          } catch {
            /* ignore stop errors */
          }

          try {
            const res = await recordAttendance({
              qrToken,
              latitude: coordsRef.current?.lat ?? 0,
              longitude: coordsRef.current?.lon ?? 0,
            });

            if (res.data?.overtime && !res.data?.clockOut) {
              pendingQrTokenRef.current = qrToken;
              setShowOvertimeModal(true);
              setScanState('idle');
              return;
            }

            const today = new Date().toDateString();
            if (res.data?.type === 'CLOCK_OUT') {
              handleClockOutSuccess(res.data);
            } else {
              localStorage.setItem(
                ATTENDANCE_STORAGE_KEY,
                JSON.stringify({
                  status: res.data?.status ?? 'WORKING',
                  date: today,
                  clockInTime: res.data?.clockIn ?? null,
                  scheduledEndTime: res.data?.scheduledEndTime ?? null,
                })
              );
              setResultMessage(res.data?.message ?? '인증이 완료되었습니다.');
              setScanState('success');
            }
          } catch (err: unknown) {
            const code = (err as { response?: { data?: { status?: string } } })
              ?.response?.data?.status;
            setResultMessage(
              ERROR_MESSAGES[code ?? ''] ??
                '인증에 실패했습니다. 다시 시도해주세요.'
            );
            setScanState('error');
          }
        },
        () => {
          /* ignore per-frame scan failures */
        }
      )
      .catch(() => {
        setResultMessage('카메라를 사용할 수 없습니다. 권한을 확인해주세요.');
        setScanState('error');
      });

    return () => {
      try {
        scanner.stop().catch(() => {
          /* ignore */
        });
      } catch {
        /* ignore */
      }
    };
  }, [retryKey]);

  const handleRetry = () => {
    isProcessingRef.current = false;
    scannerStartedRef.current = false;
    pendingQrTokenRef.current = null;
    setScanState('idle');
    setResultMessage('');
    setRetryKey((k) => k + 1);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
        <DetailHeader title={headerTitle} />

        <main className="flex-1 flex flex-col items-center justify-center gap-[var(--space-3)] px-[var(--space-5)] pb-[var(--pb-content)]">
          {/* QR 스캐너 + 문구 */}
          {scanState !== 'success' && (
            <>
              <p className="text-[length:var(--text-md)] font-semibold text-[color:var(--color-text-sub)] text-center">
                {gpsState === 'loading' && 'GPS 위치 가져오는 중...'}
                {gpsState === 'ready' && scanState === 'idle' && scanPrompt}
                {gpsState === 'denied' && (
                  <span className="text-[color:var(--color-danger)]">
                    위치 접근 권한이 필요합니다. 설정에서 허용해주세요.
                  </span>
                )}
              </p>
              <div
                id={QR_ELEMENT_ID}
                className="w-full rounded-[var(--radius-lg)] overflow-hidden"
              />
            </>
          )}

          {/* 처리 중 */}
          {scanState === 'processing' && (
            <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
              인증 중...
            </p>
          )}

          {/* 성공 */}
          {scanState === 'success' && (
            <div className="flex flex-col items-center gap-[var(--space-7)] pt-[var(--space-9)]">
              <p className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-status-green-dot)]">
                {resultMessage}
              </p>
              <button
                className="px-[var(--space-10)] py-[var(--space-4)] bg-[var(--color-primary)] rounded-[var(--radius-lg)] font-bold text-[length:var(--text-md)]"
                onClick={() => navigate(ROUTES.HOME, { replace: true })}
              >
                홈으로 돌아가기
              </button>
            </div>
          )}

          {/* 오류 */}
          {scanState === 'error' && (
            <div className="flex flex-col items-center gap-[var(--space-7)]">
              <p className="text-[length:var(--text-md)] font-semibold text-[color:var(--color-danger)]">
                {resultMessage}
              </p>
              <button
                className="px-[var(--space-10)] py-[var(--space-4)] bg-[var(--color-primary)] rounded-[var(--radius-lg)] font-bold text-[length:var(--text-md)]"
                onClick={handleRetry}
              >
                다시 시도하기
              </button>
            </div>
          )}
        </main>
      </div>

      <ConfirmModal
        isOpen={showOvertimeModal}
        title="예정된 퇴근 시각을 초과했습니다."
        description="연장근무로 처리할까요?"
        confirmText="연장근무 확인"
        cancelText="아니오"
        onConfirm={() => handleOvertimeConfirm(true)}
        onClose={() => handleOvertimeConfirm(false)}
      />

      <BottomNav />
    </>
  );
}
