import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { recordAttendance } from '@/api/attendance';
import { ROUTES } from '@/constants/routes';

type GpsState = 'loading' | 'ready' | 'denied';
type ScanState = 'idle' | 'processing' | 'success' | 'error';

const QR_ELEMENT_ID = 'qr-reader';

// 백엔드 ErrorCode와 동일
const ERROR_MESSAGES: Record<string, string> = {
  A201: '유효하지 않은 QR 코드입니다.',
  A202: '매장 반경 100m 이내에서만 인증 가능합니다.',
  A203: '이미 퇴근 처리가 완료되었습니다.',
  S002: '해당 매장의 직원 정보를 찾을 수 없습니다.',
};

export default function AttendanceCheckPage() {
  const navigate = useNavigate();

  const [gpsState, setGpsState] = useState<GpsState>(() =>
    navigator.geolocation ? 'loading' : 'denied'
  );
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [resultMessage, setResultMessage] = useState('');

  // GPS 좌표를 ref로 관리 — QR 스캔 콜백에서 최신값 참조
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const isProcessingRef = useRef(false);
  // StrictMode 이중 실행 방지 — 컴포넌트 인스턴스 내에서만 유지됨
  const scannerStartedRef = useRef(false);

  // GPS 취득
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

  // QR 스캐너 시작 (마운트 시 1회)
  useEffect(() => {
    // React StrictMode의 두 번째 실행 차단
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
            setResultMessage(res.data?.message ?? '인증이 완료되었습니다.');
            setScanState('success');
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
  }, []);

  const handleRetry = () => {
    navigate(ROUTES.ATTENDANCE_CHECK, { replace: true });
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
        <DetailHeader title="출근하기" />

        <main className="flex-1 flex flex-col items-center justify-center gap-[var(--space-3)] px-[var(--space-5)] pb-[var(--pb-content)]">
          {/* QR 스캐너 + 문구 */}
          {scanState !== 'success' && (
            <>
              {/* GPS 상태 — QR 바로 위 */}
              <p className="text-[length:var(--text-md)] font-semibold text-[color:var(--color-text-sub)] text-center">
                {gpsState === 'loading' && 'GPS 위치 가져오는 중...'}
                {gpsState === 'ready' &&
                  scanState === 'idle' &&
                  '출근 인증 QR을 스캔해주세요.'}
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
                className="px-8 py-3 bg-[var(--color-primary)] rounded-full font-bold text-[length:var(--text-md)]"
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
                className="px-8 py-3 bg-[var(--color-primary)] rounded-full font-bold text-[length:var(--text-md)]"
                onClick={handleRetry}
              >
                다시 시도하기
              </button>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
