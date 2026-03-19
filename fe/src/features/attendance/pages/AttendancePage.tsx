import { useState, useRef } from 'react';
import { AlarmClock, Check, Clock, LogOut, Sun, Zap } from 'lucide-react';
import Avatar from 'boring-avatars';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/layout/DetailHeader';
import ConfirmModal from '@/components/common/ConfirmModal';
import {
  attendanceMockData,
  type AttendanceRequest,
} from '@/features/attendance/data/mockAttendance';

type Tab = '대기' | '승인' | '거절';
const TABS: Tab[] = ['대기', '승인', '거절'];

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

const STATUS_ORDER: Record<string, number> = { 대기: 0, 승인: 1, 거절: 2 };

const STATUS_STYLES: Record<string, { border: string; avatarBg: string }> = {
  대기: {
    border: 'border-[var(--color-status-purple-border)]',
    avatarBg: 'bg-[var(--color-status-purple-border)]',
  },
  승인: {
    border: 'border-[var(--color-status-green-border)]',
    avatarBg: 'bg-[var(--color-status-green-border)]',
  },
  거절: {
    border: 'border-[var(--color-status-orange-border)]',
    avatarBg: 'bg-[var(--color-status-orange-border)]',
  },
};

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('대기');
  const [localRequests, setLocalRequests] =
    useState<AttendanceRequest[]>(attendanceMockData);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    label: string;
    action: () => void;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateStatus = (ids: number[], status: Tab) => {
    setLocalRequests((prev) =>
      prev.map((req) =>
        ids.includes(req.attendance_id) ? { ...req, status } : req
      )
    );
  };

  const deleteRequests = (ids: number[]) => {
    setLocalRequests((prev) =>
      prev.filter((req) => !ids.includes(req.attendance_id))
    );
  };

  const handleCancel = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleTap = (id: number) => {
    if (!isSelectionMode) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLongPress = (id: number) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const handleTouchStart = (id: number) => {
    longPressTimer.current = setTimeout(() => handleLongPress(id), 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const filteredRequests = localRequests
    .filter((req) => req.status === activeTab)
    .sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      return (
        new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
      );
    });

  const isAllSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((r) => selectedIds.has(r.attendance_id));

  const handleSelectAll = () => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredRequests.map((r) => r.attendance_id)));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader title="출퇴근 변경 요청" />

      {/* 탭 */}
      <div className="bg-[var(--color-bg-white)] flex border-b border-[var(--color-border-light)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-[var(--space-3)] cursor-pointer border-b-4 ${activeTab === tab ? 'border-[var(--color-primary)]' : 'border-transparent'}`}
            onClick={() => {
              setActiveTab(tab);
              handleCancel();
            }}
          >
            <span
              className={`text-[length:var(--text-md)] leading-[var(--leading-normal)] ${activeTab === tab ? 'font-bold text-[color:var(--color-text-primary)]' : 'font-medium text-[color:var(--color-text-sub)]'}`}
            >
              {tab}
            </span>
          </button>
        ))}
      </div>

      {/* 선택 모드 바 */}
      {isSelectionMode && (
        <div className="flex items-center px-[var(--space-5)] py-[var(--space-3)] bg-[var(--color-bg-base)]">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-[var(--space-2)] cursor-pointer"
          >
            <div
              className={`w-[var(--size-checkbox)] h-[var(--size-checkbox)] rounded-full border flex items-center justify-center ${
                isAllSelected
                  ? 'border-[var(--color-text-sub)] bg-[var(--color-select-all-checked-bg)]'
                  : 'border-[var(--color-text-sub)] bg-[var(--color-bg-white)]'
              }`}
            >
              {isAllSelected && (
                <Check size={9} strokeWidth={3} color="var(--color-text-sub)" />
              )}
            </div>
            <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-sub)] font-medium leading-[var(--leading-normal)]">
              전체 선택
            </span>
          </button>
          <button onClick={handleCancel} className="ml-auto cursor-pointer">
            <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-sub)] font-medium leading-[var(--leading-normal)]">
              취소
            </span>
          </button>
        </div>
      )}

      <main
        className={`flex-1 flex flex-col ${isSelectionMode ? 'pb-[var(--pb-content-selection)]' : 'pb-[var(--pb-content)]'} ${
          filteredRequests.length === 0
            ? 'items-center justify-center'
            : 'px-[var(--space-5)] py-[var(--space-5)] gap-[var(--space-5)]'
        }`}
      >
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col gap-[var(--space-7)] items-center">
            <div
              className="flex items-center justify-center rounded-full w-[var(--size-empty-outer)] h-[var(--size-empty-outer)]"
              style={{ backgroundColor: 'var(--color-empty-icon-outer)' }}
            >
              <div
                className="flex items-center justify-center rounded-full w-[var(--size-empty-middle)] h-[var(--size-empty-middle)]"
                style={{ backgroundColor: 'var(--color-empty-icon-outer)' }}
              >
                <div className="bg-[var(--color-primary)] flex items-center justify-center rounded-full w-[var(--size-empty-inner)] h-[var(--size-empty-inner)] shadow-[var(--shadow-badge)]">
                  <Check
                    size={28}
                    strokeWidth={3}
                    color="var(--color-text-primary)"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-[var(--space-2)] items-center text-center">
              <h2 className="text-[length:var(--text-xl)] text-[color:var(--color-text-dark)] font-bold tracking-[var(--tracking-tighter)]">
                출퇴근 변경 요청이 없습니다
              </h2>
              <p className="text-[length:var(--text-md)] text-[color:var(--color-empty-text-sub)] font-medium">
                출퇴근 변경 요청이 들어오면 여기에 표시됩니다.
              </p>
            </div>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.attendance_id}
              className="flex items-start gap-[var(--space-3)]"
              onClick={() => handleTap(req.attendance_id)}
              onMouseDown={() => handleTouchStart(req.attendance_id)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={() => handleTouchStart(req.attendance_id)}
              onTouchEnd={handleTouchEnd}
            >
              {/* 선택 체크박스 */}
              {isSelectionMode && (
                <div className="mt-[var(--space-5)] shrink-0">
                  <div
                    className={`w-[var(--size-checkbox)] h-[var(--size-checkbox)] rounded-full border flex items-center justify-center ${
                      selectedIds.has(req.attendance_id)
                        ? 'border-[var(--color-text-sub)] bg-[var(--color-select-all-checked-bg)]'
                        : 'border-[var(--color-text-sub)] bg-[var(--color-bg-white)]'
                    }`}
                  >
                    {selectedIds.has(req.attendance_id) && (
                      <Check
                        size={9}
                        strokeWidth={3}
                        color="var(--color-text-sub)"
                      />
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-[var(--space-2)]">
                      <span className="text-[length:var(--text-md)] text-[color:var(--color-text-black)] font-bold">
                        {req.employeeName}
                      </span>
                      {/* 배지: 연장근무 / 지각 / 조기 출근 */}
                      <div className="flex items-center gap-[var(--space-1)] flex-wrap justify-end">
                        {getWorkBadges(req).map((badge) => {
                          if (badge === 'overtime')
                            return (
                              <span
                                key="overtime"
                                className="flex items-center gap-[var(--space-0-5)] px-[var(--space-2)] py-[var(--space-0-5)] rounded-full bg-[var(--color-status-orange-bg)] border border-[var(--color-status-orange-border)]"
                              >
                                <Zap
                                  size={10}
                                  className="text-[color:var(--color-status-orange-dot)]"
                                />
                                <span className="text-[length:var(--text-2xs)] font-bold text-[color:var(--color-status-orange-dot)]">
                                  연장근무
                                </span>
                              </span>
                            );
                          if (badge === 'late')
                            return (
                              <span
                                key="late"
                                className="flex items-center gap-[var(--space-0-5)] px-[var(--space-2)] py-[var(--space-0-5)] rounded-full bg-[var(--color-status-purple-bg)] border border-[var(--color-status-purple-border)]"
                              >
                                <AlarmClock
                                  size={10}
                                  className="text-[color:var(--color-status-purple-dot)]"
                                />
                                <span className="text-[length:var(--text-2xs)] font-bold text-[color:var(--color-status-purple-dot)]">
                                  지각
                                </span>
                              </span>
                            );
                          if (badge === 'early')
                            return (
                              <span
                                key="early"
                                className="flex items-center gap-[var(--space-0-5)] px-[var(--space-2)] py-[var(--space-0-5)] rounded-full bg-[var(--color-status-green-bg)] border border-[var(--color-status-green-border)]"
                              >
                                <Sun
                                  size={10}
                                  className="text-[color:var(--color-status-green-dot)]"
                                />
                                <span className="text-[length:var(--text-2xs)] font-bold text-[color:var(--color-status-green-dot)]">
                                  조기출근
                                </span>
                              </span>
                            );
                          return (
                            <span
                              key="earlyLeave"
                              className="flex items-center gap-[var(--space-0-5)] px-[var(--space-2)] py-[var(--space-0-5)] rounded-full bg-[var(--color-status-grey-bg)] border border-[var(--color-status-grey-border)]"
                            >
                              <LogOut
                                size={10}
                                className="text-[color:var(--color-status-grey-dot)]"
                              />
                              <span className="text-[length:var(--text-2xs)] font-bold text-[color:var(--color-status-grey-dot)]">
                                조기퇴근
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)] font-medium">
                      {formatRequestedAt(req.created_at)} 요청
                    </span>
                  </div>
                </div>

                {/* 날짜 제목 */}
                <h3 className="text-[length:var(--text-lg)] text-[color:var(--color-text-black)] font-bold tracking-[var(--tracking-tight)]">
                  {formatDate(req.target_date)} 근무 변경 요청
                </h3>

                {/* 사유 */}
                <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)] font-medium">
                  {req.message}
                </p>

                {/* 출퇴근 시간 비교 */}
                <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] p-[var(--space-4)] flex flex-col gap-[var(--space-3)]">
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
                      {formatTimestamp(req.clock_in)} ~{' '}
                      {formatTimestamp(req.clock_out)}
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
                            setPendingAction({
                              label: '거절',
                              action: () =>
                                updateStatus([req.attendance_id], '거절'),
                            });
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
                            setPendingAction({
                              label: '승인',
                              action: () =>
                                updateStatus([req.attendance_id], '승인'),
                            });
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
                            setPendingAction({
                              label: '삭제',
                              action: () => deleteRequests([req.attendance_id]),
                            });
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
                            setPendingAction({
                              label: '거절',
                              action: () =>
                                updateStatus([req.attendance_id], '거절'),
                            });
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
                            setPendingAction({
                              label: '삭제',
                              action: () => deleteRequests([req.attendance_id]),
                            });
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
                            setPendingAction({
                              label: '승인',
                              action: () =>
                                updateStatus([req.attendance_id], '승인'),
                            });
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
          ))
        )}
      </main>

      {/* 선택 모드 액션 바 */}
      {isSelectionMode && (
        <div className="fixed bottom-[var(--height-bottom-nav)] left-0 right-0 z-[var(--z-nav)] flex justify-center">
          <div className="w-full max-w-[var(--max-w-app)] px-[var(--space-5)] py-[var(--space-3)] flex gap-[var(--space-4)]">
            {activeTab === '대기' && (
              <>
                <button
                  onClick={() =>
                    setPendingAction({
                      label: '거절',
                      action: () => {
                        updateStatus([...selectedIds], '거절');
                        handleCancel();
                      },
                    })
                  }
                  className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-status-orange-bg)] border border-[var(--color-status-orange-border)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
                >
                  <span className="text-[length:var(--text-lg)] text-[color:var(--color-status-orange-dot)] font-bold">
                    거절
                  </span>
                </button>
                <button
                  onClick={() =>
                    setPendingAction({
                      label: '승인',
                      action: () => {
                        updateStatus([...selectedIds], '승인');
                        handleCancel();
                      },
                    })
                  }
                  className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-status-green-bg)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
                >
                  <span className="text-[length:var(--text-lg)] text-[color:var(--color-status-green-dot)] font-bold">
                    승인
                  </span>
                </button>
              </>
            )}
            {activeTab === '승인' && (
              <>
                <button
                  onClick={() =>
                    setPendingAction({
                      label: '삭제',
                      action: () => {
                        deleteRequests([...selectedIds]);
                        handleCancel();
                      },
                    })
                  }
                  className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-border-light)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
                >
                  <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-dark)] font-bold">
                    삭제
                  </span>
                </button>
                <button
                  onClick={() =>
                    setPendingAction({
                      label: '거절',
                      action: () => {
                        updateStatus([...selectedIds], '거절');
                        handleCancel();
                      },
                    })
                  }
                  className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-status-orange-bg)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
                >
                  <span className="text-[length:var(--text-lg)] text-[color:var(--color-status-orange-dot)] font-bold">
                    거절
                  </span>
                </button>
              </>
            )}
            {activeTab === '거절' && (
              <>
                <button
                  onClick={() =>
                    setPendingAction({
                      label: '삭제',
                      action: () => {
                        deleteRequests([...selectedIds]);
                        handleCancel();
                      },
                    })
                  }
                  className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-border-light)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
                >
                  <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-dark)] font-bold">
                    삭제
                  </span>
                </button>
                <button
                  onClick={() =>
                    setPendingAction({
                      label: '승인',
                      action: () => {
                        updateStatus([...selectedIds], '승인');
                        handleCancel();
                      },
                    })
                  }
                  className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-status-green-bg)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
                >
                  <span className="text-[length:var(--text-lg)] text-[color:var(--color-status-green-dot)] font-bold">
                    승인
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />

      <ConfirmModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={() => {
          pendingAction?.action();
          setPendingAction(null);
        }}
        title={`${pendingAction?.label} 하시겠습니까?`}
        cancelText="취소"
        confirmText="네"
      />
    </div>
  );
}
