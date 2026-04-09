import { FileText, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  approveEmployee,
  generateInviteCode,
  getEmployees,
  getEmployeesByStatus,
} from '@/api/store';
import { getEmployeeSchedules, type ScheduleDto } from '@/api/schedule';
import { getApiErrorMessage } from '@/api/error';
import DetailHeader from '@/components/common/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { ROUTES } from '@/constants/routes';
import EmployeeListItem from '@/features/employee/components/EmployeeListItem';
import EmployeeInviteCodeModal from '@/features/employee/components/EmployeeInviteCodeModal';
import EmployeePendingInviteItem from '@/features/employee/components/EmployeePendingInviteItem';
import EmployeeQuickActionCard from '@/features/employee/components/EmployeeQuickActionCard';
import EmployeeSectionCard from '@/features/employee/components/EmployeeSectionCard';
import {
  EMPLOYEE_PAGE_TEXT,
  STAFF_GROUP_EMPTY_MESSAGE,
} from '@/features/employee/constants/ui';
import { type EmployeeSummary } from '@/features/employee/data/mockEmployee';
import type {
  EmployeeRecord,
  UIEmployeeStatus,
} from '@/features/employee/types/employeeRecord';
import { WORKING_STATUS_GROUP } from '@/features/employee/types/employeeRecord';
import useStoreStore from '@/stores/useStoreStore';

export default function EmployeePage() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const inviteCodes = useStoreStore((s) => s.inviteCodes);
  const setInviteCodeStore = useStoreStore((s) => s.setInviteCode);

  const currentEntry = currentStore ? inviteCodes[currentStore.storeId] : null;
  const storedInviteCode = currentEntry?.code ?? null;
  const storedExpiredAt = currentEntry?.expiredAt ?? null;

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isReissuing, setIsReissuing] = useState(false);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>([]);
  const [invitedRecords, setInvitedRecords] = useState<EmployeeRecord[]>([]);
  const [employeeLoadError, setEmployeeLoadError] = useState(false);
  const [pendingLoadError, setPendingLoadError] = useState(false);

  const employeeErrorToastShownRef = useRef(false);
  const pendingErrorToastShownRef = useRef(false);

  const fetchInviteCode = useCallback(
    async (storeId: number) => {
      setIsReissuing(true);
      try {
        const result = await generateInviteCode(storeId);
        setInviteCodeStore(storeId, result.inviteCode, result.expiredAt);
      } catch (error) {
        toast.error(getApiErrorMessage(error, '초대코드 발급에 실패했어요.'));
      } finally {
        setIsReissuing(false);
      }
    },
    [setInviteCodeStore]
  );

  const fetchEmployees = useCallback(async (storeId: number) => {
    try {
      const employees = await getEmployees(storeId);
      const records = await Promise.all(
        employees.map(async (emp): Promise<EmployeeRecord> => {
          let workSummary: string = EMPLOYEE_PAGE_TEXT.defaultWorkSummary;

          try {
            const schedules = await getEmployeeSchedules(
              storeId,
              emp.employeeId
            );
            workSummary = formatWorkTimeSummary(schedules);
          } catch {
            workSummary = EMPLOYEE_PAGE_TEXT.defaultWorkSummary;
          }

          return {
            id: emp.employeeId,
            name: emp.name,
            avatarSeed: `employee-${emp.userId}`,
            status: emp.status as UIEmployeeStatus,
            position: emp.position,
            hourlyWage: emp.hourlyWage,
            workSummary,
          };
        })
      );

      setEmployeeRecords(records);
      setEmployeeLoadError(false);
      employeeErrorToastShownRef.current = false;
    } catch (error) {
      setEmployeeRecords([]);
      setEmployeeLoadError(true);
      if (!employeeErrorToastShownRef.current) {
        toast.error(
          getApiErrorMessage(error, '직원 목록을 불러올 수 없습니다.')
        );
        employeeErrorToastShownRef.current = true;
      }
    }
  }, []);

  const fetchPendingEmployees = useCallback(async (storeId: number) => {
    try {
      const pendingEmployees = await getEmployeesByStatus(storeId, 'WAITING');
      const records: EmployeeRecord[] = pendingEmployees.map((emp) => ({
        id: emp.employeeId,
        name: emp.name,
        avatarSeed: `employee-${emp.userId}`,
        status: 'INVITED',
      }));

      setInvitedRecords(records);
      setPendingLoadError(false);
      pendingErrorToastShownRef.current = false;
    } catch (error) {
      setInvitedRecords([]);
      setPendingLoadError(true);
      if (!pendingErrorToastShownRef.current) {
        toast.error(
          getApiErrorMessage(error, '대기 직원 목록을 불러올 수 없습니다.')
        );
        pendingErrorToastShownRef.current = true;
      }
    }
  }, []);

  useEffect(() => {
    if (!currentStore) return;

    void fetchEmployees(currentStore.storeId);
    void fetchPendingEmployees(currentStore.storeId);

    const isExpired =
      !storedInviteCode ||
      !storedExpiredAt ||
      new Date() >= new Date(storedExpiredAt);

    if (isExpired) void fetchInviteCode(currentStore.storeId);
  }, [
    currentStore,
    fetchEmployees,
    fetchPendingEmployees,
    fetchInviteCode,
    storedInviteCode,
    storedExpiredAt,
  ]);

  const currentRecords = useMemo(
    () =>
      employeeRecords.filter((item) =>
        WORKING_STATUS_GROUP.includes(item.status)
      ),
    [employeeRecords]
  );

  const ownerInviteCode = useMemo(
    () => ({
      storeName: currentStore?.storeName ?? '',
      code: storedInviteCode ?? '',
      expiresAt: storedExpiredAt ?? '',
    }),
    [currentStore, storedInviteCode, storedExpiredAt]
  );

  const handlers = {
    openInviteModal: () => setIsInviteModalOpen(true),
    openContractPage: () => navigate(ROUTES.DOCUMENTS_REQUEST),
    closeInviteModal: () => setIsInviteModalOpen(false),
    regenerateCode: () => {
      if (currentStore && !isReissuing) {
        void fetchInviteCode(currentStore.storeId);
      }
    },
    removeInvitedEmployee: () => {
      toast('요청 거절 기능은 아직 준비 중입니다.');
    },
    approveInvitedEmployee: async (employeeId: number) => {
      if (!currentStore) return;

      try {
        await approveEmployee(currentStore.storeId, employeeId);
        toast.success('직원 합류를 승인했어요.');
        await Promise.all([
          fetchEmployees(currentStore.storeId),
          fetchPendingEmployees(currentStore.storeId),
        ]);
      } catch (error) {
        toast.error(getApiErrorMessage(error, '직원 승인에 실패했어요.'));
      }
    },
    openEmployeeDetail: (item: EmployeeRecord) => {
      const employeeSummary: EmployeeSummary = {
        id: item.id,
        name: item.name,
        avatarSeed: item.avatarSeed,
        workSummary:
          item.position ??
          item.workSummary ??
          EMPLOYEE_PAGE_TEXT.defaultWorkSummary,
        status: item.status as
          | 'INVITED'
          | 'WORKING'
          | 'RESIGNED'
          | 'ON_LEAVE'
          | 'BEST',
      };

      navigate(ROUTES.EMPLOYEE_DETAIL.replace(':employeeId', String(item.id)), {
        state: { employee: employeeSummary },
      });
    },
  };

  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="mx-auto flex w-full max-w-[var(--max-w-app)] flex-col">
        <DetailHeader title={EMPLOYEE_PAGE_TEXT.pageTitle} />

        <main className="flex flex-1 flex-col gap-[var(--space-5)] px-[var(--space-5)] pb-[calc(var(--height-bottom-nav)+var(--space-9)+env(safe-area-inset-bottom,0px))] pt-[var(--space-4)]">
          <section className="grid grid-cols-2 gap-[var(--space-3)]">
            <EmployeeQuickActionCard
              label={EMPLOYEE_PAGE_TEXT.inviteAction}
              icon={<UserPlus size={16} />}
              onClick={handlers.openInviteModal}
              iconColorClassName="text-[var(--color-status-green-dot)]"
              iconBackgroundClassName="bg-[var(--color-badge-green-bg)]"
            />
            <EmployeeQuickActionCard
              label={EMPLOYEE_PAGE_TEXT.contractAction}
              icon={<FileText size={16} />}
              onClick={handlers.openContractPage}
              iconColorClassName="text-[var(--color-status-blue-dot)]"
              iconBackgroundClassName="bg-[var(--color-status-blue-bg)]"
            />
          </section>

          <EmployeeSectionCard
            title={EMPLOYEE_PAGE_TEXT.invitedSectionTitle}
            count={invitedRecords.length}
          >
            {pendingLoadError ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-muted)] bg-[var(--color-bg-surface)] px-[var(--space-4)] py-[var(--space-5)] text-center text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
                {'대기 직원 목록을 불러올 수 없어 기능이 제한됩니다.'}
              </div>
            ) : invitedRecords.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-muted)] px-[var(--space-4)] py-[var(--space-5)] text-center text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
                {EMPLOYEE_PAGE_TEXT.invitedEmptyMessage}
              </div>
            ) : (
              <ul className="max-h-56 space-y-[var(--space-2)] overflow-y-auto pr-[var(--space-0-5)]">
                {invitedRecords.map((item) => (
                  <EmployeePendingInviteItem
                    key={item.id}
                    item={item}
                    onApprove={handlers.approveInvitedEmployee}
                    onDelete={handlers.removeInvitedEmployee}
                  />
                ))}
              </ul>
            )}
          </EmployeeSectionCard>

          <EmployeeSectionCard
            title={EMPLOYEE_PAGE_TEXT.staffSectionTitle}
            count={currentRecords.length}
          >
            {employeeLoadError ? (
              <div className="flex h-72 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-muted)] bg-[var(--color-bg-surface)] px-[var(--space-4)] py-[var(--space-5)] text-center text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
                {'직원 목록을 불러올 수 없어 기능이 제한됩니다.'}
              </div>
            ) : currentRecords.length === 0 ? (
              <div className="flex h-72 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-muted)] px-[var(--space-4)] py-[var(--space-5)] text-center text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
                {STAFF_GROUP_EMPTY_MESSAGE.CURRENT}
              </div>
            ) : (
              <ul className="h-72 space-y-[var(--space-2)] overflow-y-auto pr-[var(--space-0-5)]">
                {currentRecords.map((item) => (
                  <li key={item.id}>
                    <EmployeeListItem
                      item={item}
                      onOpen={handlers.openEmployeeDetail}
                      isInactive={false}
                    />
                  </li>
                ))}
              </ul>
            )}
          </EmployeeSectionCard>
        </main>
      </div>

      <EmployeeInviteCodeModal
        isOpen={isInviteModalOpen}
        inviteCode={ownerInviteCode}
        isReissuing={isReissuing}
        onClose={handlers.closeInviteModal}
        onRegenerate={handlers.regenerateCode}
        isRegenerating={isReissuing}
      />

      <BottomNav activeTab="staff" />
    </div>
  );
}
const formatScheduleTime = (value: string): string =>
  value.length >= 5 ? value.slice(0, 5) : value;

const formatWorkTimeSummary = (schedules: ScheduleDto[]): string => {
  if (schedules.length === 0) return EMPLOYEE_PAGE_TEXT.defaultWorkSummary;

  const dayCount = new Set(schedules.map((schedule) => schedule.dayOfWeek))
    .size;
  const uniqueSlots = new Set(
    schedules.map(
      (schedule) =>
        `${formatScheduleTime(schedule.startTime)}-${formatScheduleTime(schedule.endTime)}`
    )
  );

  if (uniqueSlots.size === 1) {
    const [slot] = Array.from(uniqueSlots);
    const [start, end] = slot.split('-');
    return `주 ${dayCount}일 / ${start} - ${end}`;
  }

  return `주 ${dayCount}일 / 요일별 변동`;
};
