import dayjs from 'dayjs';
import type { AuctionDto } from '@/api/auction.types';
import type { AuctionItem } from '../components/AuctionItemCard';

export function toAuctionItem(dto: AuctionDto): AuctionItem {
  const targetDate = dayjs(dto.targetDate);
  const startTime = dto.targetStartTime.slice(0, 5);
  const endTime = dto.targetEndTime.slice(0, 5);
  const createdAt = dto.createdAt ? dayjs(dto.createdAt) : targetDate;

  const startMinutes = timeToMinutes(dto.targetStartTime);
  const endMinutes = timeToMinutes(dto.targetEndTime);
  const workHours = Math.max(0, Math.round((endMinutes - startMinutes) / 60));

  const deadline = dayjs(dto.deadline);
  const now = dayjs();

  if (dto.status === 'CLOSED') {
    return {
      id: dto.auctionId,
      status: 'completed',
      displayStatus: 'closed',
      statusLabel: '낙찰 완료',
      isAwarded: true,
      registeredDate: createdAt.format('YYYY-MM-DD'),
      workDate: targetDate.format('YYYY.MM.DD'),
      staffCount: dto.recruitCount,
      startTime,
      endTime,
      workHours,
      minWage: dto.minWage.toLocaleString(),
      maxWage: dto.maxWage.toLocaleString(),
      primaryAction: 'viewResult',
      primaryActionLabel: '경매 결과 보기',
    };
  }

  if (dto.status === 'CANCELLED') {
    return {
      id: dto.auctionId,
      status: 'completed',
      displayStatus: 'cancelled',
      statusLabel: '중단됨',
      isAwarded: false,
      registeredDate: createdAt.format('YYYY-MM-DD'),
      workDate: targetDate.format('YYYY.MM.DD'),
      staffCount: dto.recruitCount,
      startTime,
      endTime,
      workHours,
      minWage: dto.minWage.toLocaleString(),
      maxWage: dto.maxWage.toLocaleString(),
      primaryAction: 'viewDetail',
      primaryActionLabel: '경매 상세 보기',
    };
  }

  const isExpired = dto.status === 'IN_PROGRESS' && !deadline.isAfter(now);

  if (isExpired) {
    return {
      id: dto.auctionId,
      status: 'completed',
      displayStatus: 'expired',
      statusLabel: '마감됨',
      isAwarded: false,
      registeredDate: createdAt.format('YYYY-MM-DD'),
      workDate: targetDate.format('YYYY.MM.DD'),
      staffCount: dto.recruitCount,
      startTime,
      endTime,
      workHours,
      minWage: dto.minWage.toLocaleString(),
      maxWage: dto.maxWage.toLocaleString(),
      primaryAction: 'viewDetail',
      primaryActionLabel: '입찰 현황 보기',
    };
  }

  const diff = deadline.diff(now, 'second');
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  return {
    id: dto.auctionId,
    status: 'inProgress',
    displayStatus: 'active',
    statusLabel: `${pad(h)}:${pad(m)}:${pad(s)}`,
    isAwarded: false,
    registeredDate: createdAt.format('YYYY-MM-DD'),
    workDate: targetDate.format('YYYY.MM.DD'),
    staffCount: dto.recruitCount,
    startTime,
    endTime,
    workHours,
    minWage: dto.minWage.toLocaleString(),
    maxWage: dto.maxWage.toLocaleString(),
    primaryAction: 'viewDetail',
    primaryActionLabel: '입찰 현황 보기',
  };
}

function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
