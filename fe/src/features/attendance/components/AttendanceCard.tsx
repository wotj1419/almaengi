import { AlarmClock, Check, Clock, LogOut, Sun, Zap } from 'lucide-react';
import Avatar from 'boring-avatars';
import { type AttendanceRequest } from '@/features/attendance/data/mockAttendance';
import { STATUS_STYLES, type Tab } from '../types';

function formatDate(dateStr: string) {
  const [, month, day] = dateStr.split('-');
  return `${parseInt(month)}월 ${parseInt(day)}일`;
}

function formatTimestamp(ts: string) {
  const time = ts.includes('T') ? ts.split('T')[1] : ts;
  const [h, m] = time.split(':');
  return `${h}:${m}`;
}

function formatRequestedAt(ts: string) {
  const [datePart, timePart] = ts.split('T');
  const [, month, day] = datePart.split('-');
  const [h, m] = timePart.split(':');
  return `${parseInt(month)}월 ${parseInt(day)}일 ${h}:${m}`;
}

function getWorkBadges(req: AttendanceRequest) {
  const badges: Array<'overtime' | 'late' | 'early' | 'earlyLeave'> = [];
  if (req.overtime) badges.push('overtime');
  const [ciH, ciM] = formatTimestamp(req.clock_in).split(':').map(Number);
  const [scH, scM] = req.scheduled_start_time.split(':').map(Number);
  const inDiff = ciH * 60 + ciM - (scH * 60 + scM);
  if (inDiff > 0) badges.push('late');
  else if (inDiff < 0) badges.push('early');
  const [coH, coM] = formatTimestamp(req.clock_out).split(':').map(Number);
  const [seH, seM] = req.scheduled_end_time.split(':').map(Number);
  const outDiff = coH * 60 + coM - (seH * 60 + seM);
  if (outDiff < 0) badges.push('earlyLeave');
  return badges;
}

interface Props {
  req: AttendanceRequest;
  isSelectionMode: boolean;
  isSelected: boolean;
  activeTab: Tab;
  onTap: (id: number) => void;
  onTouchStart: (id: number) => void;
  onTouchEnd: () => void;
  onAction: (label: string, action: () => void) => void;
  onUpdateStatus: (ids: number[], status: Tab) => void;
  onDelete: (ids: number[]) => void;
}

export default function AttendanceCard({
  req,
  isSelectionMode,
  isSelected,
  activeTab,
  onTap,
  onTouchStart,
  onTouchEnd,
  onAction,
  onUpdateStatus,
  onDelete,
}: Props) {
  return (
    <div
      className="flex items-start gap-[var(--space-3)]"
      onClick={() => onTap(req.attendance_id)}
      onMouseDown={() => onTouchStart(req.attendance_id)}
      onMouseUp={onTouchEnd}
      onMouseLeave={onTouchEnd}
      onTouchStart={() => onTouchStart(req.attendance_id)}
      onTouchEnd={onTouchEnd}
    >
      {/* 선택 체크박스 */}
      {isSelectionMode && (
        <div className="mt-[var(--space-5)] shrink-0">
          <div
            className={`w-[var(--size-checkbox)] h-[var(--size-checkbox)] rounded-full border flex items-center justify-center ${
              isSelected
                ? 'border-[var(--color-text-sub)] bg-[var(--color-select-all-checked-bg)]'
                : 'border-[var(--color-text-sub)] bg-[var(--color-bg-white)]'
            }`}
          >
            {isSelected && (
              <Check size={9} strokeWidth={3} color="var(--color-text-sub)" />
            )}
          </div>
        </div>
      )}

      <div className="flex-1 bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] p-[var(--space-5)] shadow-[var(--shadow-card)] flex flex-col gap-[var(--space-3)]">
        {/* 헤더: 아바타 + 직원명 + 요청일시 */}
        <div className="flex items-center gap-[var(--space-3)]">
          <div
            className={`shrink-0 rounded-full border-[var(--border-avatar)] p-[var(--p-avatar)] overflow-hidden ${STATUS_STYLES[req.status].border} ${STATUS_STYLES[req.status].avatarBg}`}
          >
            <Avatar name={req.employeeName} size={32} variant="beam" />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-[var(--space-2)]">
            <span className="text-[length:var(--text-md2)] text-[color:var(--color-text-black)] font-bold">
              {req.employeeName}
            </span>
            <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)] font-medium">
              {formatRequestedAt(req.created_at)} 요청
            </span>
          </div>
        </div>

        {/* 배지: 연장근무 / 지각 / 조기 출근 */}
        <div className="flex items-center gap-[var(--space-1)] flex-wrap mt-[var(--space-2)]">
          {getWorkBadges(req).map((badge) => {
            if (badge === 'overtime')
              return (
                <span
                  key="overtime"
                  className="flex items-center gap-[var(--space-1)] px-[var(--space-3)] py-[var(--space-1)] rounded-full bg-[var(--color-status-orange-bg)] border border-[var(--color-status-orange-border)]"
                >
                  <Zap
                    size={12}
                    className="text-[color:var(--color-status-orange-dot)]"
                  />
                  <span className="text-[length:var(--text-xs)] font-bold text-[color:var(--color-status-orange-dot)]">
                    연장근무
                  </span>
                </span>
              );
            if (badge === 'late')
              return (
                <span
                  key="late"
                  className="flex items-center gap-[var(--space-1)] px-[var(--space-3)] py-[var(--space-1)] rounded-full bg-[var(--color-status-purple-bg)] border border-[var(--color-status-purple-border)]"
                >
                  <AlarmClock
                    size={12}
                    className="text-[color:var(--color-status-purple-dot)]"
                  />
                  <span className="text-[length:var(--text-xs)] font-bold text-[color:var(--color-status-purple-dot)]">
                    지각
                  </span>
                </span>
              );
            if (badge === 'early')
              return (
                <span
                  key="early"
                  className="flex items-center gap-[var(--space-1)] px-[var(--space-3)] py-[var(--space-1)] rounded-full bg-[var(--color-status-green-bg)] border border-[var(--color-status-green-border)]"
                >
                  <Sun
                    size={12}
                    className="text-[color:var(--color-status-green-dot)]"
                  />
                  <span className="text-[length:var(--text-xs)] font-bold text-[color:var(--color-status-green-dot)]">
                    조기출근
                  </span>
                </span>
              );
            return (
              <span
                key="earlyLeave"
                className="flex items-center gap-[var(--space-1)] px-[var(--space-3)] py-[var(--space-1)] rounded-full bg-[var(--color-status-grey-bg)] border border-[var(--color-status-grey-border)]"
              >
                <LogOut
                  size={12}
                  className="text-[color:var(--color-status-grey-dot)]"
                />
                <span className="text-[length:var(--text-xs)] font-bold text-[color:var(--color-status-grey-dot)]">
                  조기퇴근
                </span>
              </span>
            );
          })}
        </div>

        {/* 날짜 제목 */}
        <h3 className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
          {formatDate(req.target_date)} 근무 변경
        </h3>

        {/* 사유 */}
        <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)] font-medium">
          {req.message}
        </p>

        {/* 출퇴근 시간 비교 */}
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-card)] p-[var(--space-4)] flex flex-col gap-[var(--space-3)]">
          <div className="flex items-center gap-[var(--space-2)]">
            <Clock
              size={16}
              className="shrink-0 text-[color:var(--color-text-sub)]"
            />
            <span className="text-[length:var(--text-md)] font-semibold text-[color:var(--color-text-sub)] w-[var(--size-time-label)] shrink-0">
              변경 전
            </span>
            <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-medium">
              {req.scheduled_start_time} ~ {req.scheduled_end_time}
            </span>
          </div>
          <div className="flex items-center gap-[var(--space-2)]">
            <Clock
              size={16}
              className="shrink-0 text-[color:var(--color-status-orange-dot)]"
            />
            <span className="text-[length:var(--text-md)] font-semibold text-[color:var(--color-status-orange-dot)] w-[var(--size-time-label)] shrink-0">
              변경 후
            </span>
            <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-medium">
              {formatTimestamp(req.clock_in)} ~ {formatTimestamp(req.clock_out)}
            </span>
          </div>
        </div>

        {/* 개별 액션 버튼 (선택 모드 아닐 때만) */}
        {!isSelectionMode && (
          <div className="flex gap-[var(--space-3)] mt-[var(--space-1)]">
            {activeTab === '대기' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('거절', () =>
                      onUpdateStatus([req.attendance_id], '거절')
                    );
                  }}
                  className="flex-1 py-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--color-status-orange-bg)] border border-[var(--color-status-orange-border)] cursor-pointer"
                >
                  <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-status-orange-dot)]">
                    거절
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('승인', () =>
                      onUpdateStatus([req.attendance_id], '승인')
                    );
                  }}
                  className="flex-1 py-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--color-status-green-bg)] border border-[var(--color-status-green-border)] cursor-pointer"
                >
                  <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-status-green-dot)]">
                    승인
                  </span>
                </button>
              </>
            )}
            {activeTab === '승인' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('삭제', () => onDelete([req.attendance_id]));
                  }}
                  className="flex-1 py-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--color-border-light)] cursor-pointer"
                >
                  <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-dark)]">
                    삭제
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('거절', () =>
                      onUpdateStatus([req.attendance_id], '거절')
                    );
                  }}
                  className="flex-1 py-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--color-status-orange-bg)] border border-[var(--color-status-orange-border)] cursor-pointer"
                >
                  <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-status-orange-dot)]">
                    거절
                  </span>
                </button>
              </>
            )}
            {activeTab === '거절' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('삭제', () => onDelete([req.attendance_id]));
                  }}
                  className="flex-1 py-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--color-border-light)] cursor-pointer"
                >
                  <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-dark)]">
                    삭제
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('승인', () =>
                      onUpdateStatus([req.attendance_id], '승인')
                    );
                  }}
                  className="flex-1 py-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--color-status-green-bg)] border border-[var(--color-status-green-border)] cursor-pointer"
                >
                  <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-status-green-dot)]">
                    승인
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
