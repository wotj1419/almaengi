import { MapPin } from 'lucide-react';

type Props = {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  hasCoords: boolean;
};

export default function KakaoMapPreview({ mapContainerRef, hasCoords }: Props) {
  return (
    <div className="relative mt-[var(--space-4)] h-48 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)]">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!hasCoords && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-white)] text-[var(--color-text-muted)]">
          <div className="inline-flex items-center gap-[var(--space-2)]">
            <MapPin size={18} strokeWidth={2} />
            <span className="text-[length:var(--text-sm)] font-medium">
              지도 미리보기
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
