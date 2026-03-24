import { useEffect, useRef, type PointerEvent } from 'react';

interface SignaturePadProps {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  readOnly?: boolean;
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  event: PointerEvent<HTMLCanvasElement>
) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export default function SignaturePad({
  label,
  value,
  onChange,
  readOnly = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    if (readOnly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const context = canvas.getContext('2d');
    if (!context) return;

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    canvas.width = Math.floor(displayWidth * ratio);
    canvas.height = Math.floor(displayHeight * ratio);

    context.scale(ratio, ratio);
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#111827';

    if (value) {
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, displayWidth, displayHeight);
        context.drawImage(image, 0, 0, displayWidth, displayHeight);
      };
      image.src = value;
    } else {
      context.clearRect(0, 0, displayWidth, displayHeight);
    }
  }, [readOnly, value]);

  if (readOnly) {
    return (
      <div className="space-y-[var(--space-2)]">
        <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
          {label}
        </p>
        <div className="h-32 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-bg-white)]">
          {value ? (
            <img
              src={value}
              alt={`${label} 서명`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
              서명이 없습니다
            </div>
          )}
        </div>
      </div>
    );
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);

    const point = getCanvasPoint(canvas, event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const point = getCanvasPoint(canvas, event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    onChange('');
  };

  return (
    <div className="space-y-[var(--space-2)]">
      <div className="flex items-center justify-between">
        <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
          {label}
        </p>
        <button
          type="button"
          onClick={handleClear}
          className="text-[length:var(--text-xs)] font-bold text-[var(--color-text-muted)]"
        >
          지우기
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="h-32 w-full touch-none rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-bg-white)]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerLeave={finishDrawing}
      />
    </div>
  );
}
