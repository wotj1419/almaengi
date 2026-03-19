import dayjs from 'dayjs';
import type { AuctionDto } from '@/api/auction.types';
import type { AuctionItem } from '../components/AuctionItemCard';

/**
 * API의 AuctionDto → UI의 AuctionItem 변환
 */
export function toAuctionItem(dto: AuctionDto): AuctionItem {
  const targetDate = dayjs(dto.targetDate);
  const startTime = dto.targetStartTime.slice(0, 5); // "18:00:00" → "18:00"
  const endTime = dto.targetEndTime.slice(0, 5);

  const startMinutes = timeToMinutes(dto.targetStartTime);
  const endMinutes = timeToMinutes(dto.targetEndTime);
  const workHours = Math.max(0, Math.round((endMinutes - startMinutes) / 60));

  const isClosed = dto.status === 'CLOSED';
  const deadline = dayjs(dto.deadline);
  const now = dayjs();
  const isExpired = !deadline.isAfter(now);

  let status: 'inProgress' | 'completed';
  let statusLabel: string;
  let isAwarded: boolean;

  if (isClosed) {
    status = 'completed';
    statusLabel = '낙찰 완료';
    isAwarded = true;
  } else if (isExpired) {
    status = 'completed';
    statusLabel = '낙찰 미완료';
    isAwarded = false;
  } else {
    status = 'inProgress';
    const diff = deadline.diff(now, 'second');
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    statusLabel = `${pad(h)}:${pad(m)}:${pad(s)} 남음`;
    isAwarded = false;
  }

  return {
    id: dto.auctionId,
    status,
    statusLabel,
    isAwarded,
    registeredDate: targetDate.format('YYYY-MM-DD'),
    workDate: targetDate.format('YYYY년 MM월 DD일'),
    staffCount: dto.recruitCount,
    startTime,
    endTime,
    workHours,
    minWage: dto.minWage.toLocaleString(),
    maxWage: dto.maxWage.toLocaleString(),
  };
}

function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
