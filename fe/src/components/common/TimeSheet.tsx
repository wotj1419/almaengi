import { useEffect, useRef, useState } from 'react';

interface TimePickerModalProps {
  isOpen: boolean;
  selectedHour: number;
  selectedMinute: number;
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 44; // 각 항목 높이
const VISIBLE_ITEMS = 5; // 보이는 항목 수

function WheelColumn({
  items,
  selectedIndex,
  onChange,
}: {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isScrollingRef.current) {
      containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    }
  }, [selectedIndex]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;

    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

    if (clampedIndex !== selectedIndex) {
      onChange(clampedIndex);
    }
  };

  const handleScrollEnd = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

    containerRef.current.scrollTo({
      top: clampedIndex * ITEM_HEIGHT,
      behavior: 'smooth',
    });
    isScrollingRef.current = false;
  };

  // 상하 패딩용 빈 항목 (선택 영역을 가운데로)
  const paddingCount = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onMouseUp={handleScrollEnd}
      onTouchEnd={handleScrollEnd}
      className="relative z-10 flex-1 overflow-y-auto"
      style={{
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* 상단 패딩 */}
      {Array.from({ length: paddingCount }).map((_, i) => (
        <div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
      ))}

      {items.map((item, i) => {
        const isSelected = i === selectedIndex;
        return (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: 'center',
            }}
          >
            <span
              className={
                isSelected
                  ? 'text-[color:var(--color-text-dark)] text-xl font-bold leading-7'
                  : 'text-slate-300 text-base font-medium leading-7'
              }
            >
              {item}
            </span>
          </div>
        );
      })}

      {/* 하단 패딩 */}
      {Array.from({ length: paddingCount }).map((_, i) => (
        <div key={`pad-bot-${i}`} style={{ height: ITEM_HEIGHT }} />
      ))}
    </div>
  );
}

export default function TimePickerModal({
  isOpen,
  selectedHour,
  selectedMinute,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const [tempHour, setTempHour] = useState(selectedHour);
  const [tempMinute, setTempMinute] = useState(selectedMinute);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0')
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-80 mx-4 bg-white rounded-[var(--radius-lg)] shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 pt-[18px] pb-3 flex justify-center">
          <span className="text-slate-800 text-lg font-bold leading-7">
            시간 선택
          </span>
        </div>

        {/* 드럼롤 영역 */}
        <div
          className="relative flex justify-center items-center overflow-hidden"
          style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
        >
          {/* 선택 하이라이트 바 */}
          <div
            className="absolute left-6 right-6 bg-[var(--color-bg-base)] rounded-lg border border-gray-200 pointer-events-none"
            style={{
              height: ITEM_HEIGHT,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />

          {/* 시 */}
          <WheelColumn
            items={hours}
            selectedIndex={tempHour}
            onChange={setTempHour}
          />

          {/* : */}
          <div className="relative z-10 px-2 flex items-center">
            <span className="text-black text-lg font-bold leading-7">:</span>
          </div>

          {/* 분 */}
          <WheelColumn
            items={minutes}
            selectedIndex={tempMinute}
            onChange={setTempMinute}
          />
        </div>

        {/* 하단 버튼 */}
        <div className="px-4 py-3.5 bg-[var(--color-bg-base)] flex justify-end items-start gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-white rounded-[var(--radius-lg)] flex justify-center items-center"
          >
            <span className="text-slate-500 text-lg font-medium leading-5">
              취소
            </span>
          </button>
          <button
            onClick={() => onConfirm(tempHour, tempMinute)}
            className="flex-1 px-6 py-2.5 bg-[var(--color-action-todo)] rounded-[var(--radius-lg)] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)] flex justify-center items-center"
          >
            <span className="text-slate-900 text-lg font-bold leading-5">
              확인
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
