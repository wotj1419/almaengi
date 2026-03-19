import { useState, useRef } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import DetailHeader from '@/components/layout/DetailHeader';
import ConfirmModal from '@/components/common/ConfirmModal';
import {
  attendanceMockData,
  type AttendanceRequest,
} from '@/features/attendance/data/mockAttendance';
import { STATUS_ORDER, type Tab } from '../types';
import AttendanceTabBar from '../components/AttendanceTabBar';
import AttendanceSelectionBar from '../components/AttendanceSelectionBar';
import AttendanceEmptyState from '../components/AttendanceEmptyState';
import AttendanceCard from '../components/AttendanceCard';
import AttendanceActionBar from '../components/AttendanceActionBar';

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

  const handleAction = (label: string, action: () => void) => {
    setPendingAction({ label, action });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader title="출퇴근 변경 요청" />

      <AttendanceTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          handleCancel();
        }}
      />

      {isSelectionMode && (
        <AttendanceSelectionBar
          isAllSelected={isAllSelected}
          onSelectAll={handleSelectAll}
          onCancel={handleCancel}
        />
      )}

      <main
        className={`flex-1 flex flex-col ${isSelectionMode ? 'pb-[var(--pb-content-selection)]' : 'pb-[var(--pb-content)]'} ${
          filteredRequests.length === 0
            ? 'items-center justify-center'
            : 'px-[var(--space-5)] py-[var(--space-5)] gap-[var(--space-5)]'
        }`}
      >
        {filteredRequests.length === 0 ? (
          <AttendanceEmptyState />
        ) : (
          filteredRequests.map((req) => (
            <AttendanceCard
              key={req.attendance_id}
              req={req}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(req.attendance_id)}
              activeTab={activeTab}
              onTap={handleTap}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onAction={handleAction}
              onUpdateStatus={updateStatus}
              onDelete={deleteRequests}
            />
          ))
        )}
      </main>

      {isSelectionMode && (
        <AttendanceActionBar
          activeTab={activeTab}
          selectedIds={selectedIds}
          onAction={handleAction}
          onUpdateStatus={updateStatus}
          onDelete={deleteRequests}
          onCancel={handleCancel}
        />
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
