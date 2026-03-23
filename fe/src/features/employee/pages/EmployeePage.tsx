import { FileText, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DetailHeader from '@/components/common/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import { ROUTES } from '@/constants/routes';
import EmployeeListItem from '@/features/employee/components/EmployeeListItem';
import EmployeeInviteCodeModal from '@/features/employee/components/EmployeeInviteCodeModal';
import EmployeePendingInviteItem from '@/features/employee/components/EmployeePendingInviteItem';
import EmployeeQuickActionCard from '@/features/employee/components/EmployeeQuickActionCard';
import EmployeeSectionCard from '@/features/employee/components/EmployeeSectionCard';
import EmployeeStaffGroupTabs from '@/features/employee/components/EmployeeStaffGroupTabs';
import {
  EMPLOYEE_PAGE_TEXT,
  STAFF_GROUP_EMPTY_MESSAGE,
} from '@/features/employee/constants/ui';
import {
  employees as initialEmployees,
  pendingInvites as initialPendingInvites,
  type EmployeeSummary,
} from '@/features/employee/data/mockEmployee';
import { ownerInviteCodeMock } from '@/features/employee/data/mockInviteCode';
import type {
  EmployeeRecord,
  StaffGroupKey,
} from '@/features/employee/types/employeeRecord';
import { WORKING_STATUS_GROUP } from '@/features/employee/types/employeeRecord';
import useStoreManageStore from '@/stores/useStoreManageStore';

// 초대 대기 직원(pendingInvites)과 기존 직원(employees)을 하나의 EmployeeRecord 배열로 병합
const buildInitialEmployeeRecords = (): EmployeeRecord[] => [
  ...initialPendingInvites.map((item) => ({
    id: item.id,
    name: item.name,
    avatarSeed: item.avatarSeed,
    status: item.status,
    phone: item.phone,
    workSummary: EMPLOYEE_PAGE_TEXT.inviteWaitingSummary,
  })),
  ...initialEmployees.map((item) => ({
    id: item.id,
    name: item.name,
    avatarSeed: item.avatarSeed,
    status: item.status,
    workSummary: item.workSummary,
  })),
];

// 직원 관리 메인 페이지 - 초대 코드 발급, 초대 승인/삭제, 재직/퇴사 직원 목록 조회
export default function EmployeePage() {
  const navigate = useNavigate();
  const registeredStore = useStoreManageStore((state) => state.registeredStore);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  // 현재 직원 / 퇴사 직원 탭 전환 상태
  const [selectedStaffGroup, setSelectedStaffGroup] =
    useState<StaffGroupKey>('CURRENT');
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>(
    buildInitialEmployeeRecords
  );

  // status 기준으로 초대 대기 / 재직 / 퇴사 직원을 각각 필터링
  const invitedRecords = useMemo(
    () => employeeRecords.filter((item) => item.status === 'INVITED'),
    [employeeRecords]
  );

  const currentRecords = useMemo(
    () =>
      employeeRecords.filter((item) =>
        WORKING_STATUS_GROUP.includes(item.status)
      ),
    [employeeRecords]
  );

  const resignedRecords = useMemo(
    () => employeeRecords.filter((item) => item.status === 'RESIGNED'),
    [employeeRecords]
  );

  // 탭 선택에 따라 보여줄 직원 목록 결정
  const selectedStaffRecords =
    selectedStaffGroup === 'CURRENT' ? currentRecords : resignedRecords;

  // 매장 코드가 6자리 숫자인지 검증하여 초대 코드로 사용, 아니면 fallback mock 사용
  const ownerInviteCode = useMemo(() => {
    const rawStoreCode = registeredStore?.storeCode ?? '';
    const sixDigitStoreCode = /^\d{6}$/.test(rawStoreCode)
      ? rawStoreCode
      : ownerInviteCodeMock.code;

    return {
      storeName: registeredStore?.name ?? ownerInviteCodeMock.storeName,
      code: sixDigitStoreCode,
      expiresAt: ownerInviteCodeMock.expiresAt,
    };
  }, [registeredStore]);

  // 페이지 내 사용자 인터랙션 핸들러 모음
  const handlers = {
    openInviteModal: () => setIsInviteModalOpen(true),
    openContractPage: () => console.info('[employee] 근로계약서 작성 클릭'),
    closeInviteModal: () => setIsInviteModalOpen(false),
    // 초대 대기 직원을 목록에서 제거
    removeInvitedEmployee: (id: number) => {
      setEmployeeRecords((prev) =>
        prev.filter((item) => !(item.id === id && item.status === 'INVITED'))
      );
      console.info('[employee] 초대 직원 삭제', id);
    },
    // 초대 승인: INVITED → WORKING 상태로 변경하여 재직 직원 목록으로 이동
    approveInvitedEmployee: (id: number) => {
      setEmployeeRecords((prev) =>
        prev.map((item) =>
          item.id === id && item.status === 'INVITED'
            ? {
                ...item,
                status: 'WORKING',
                workSummary: EMPLOYEE_PAGE_TEXT.defaultWorkSummary,
              }
            : item
        )
      );
      console.info('[employee] 초대 승인 처리', id);
    },
    // 직원 상세 페이지로 이동 시 location.state에 요약 정보를 전달
    openEmployeeDetail: (item: EmployeeRecord) => {
      const employeeSummary: EmployeeSummary = {
        id: item.id,
        name: item.name,
        avatarSeed: item.avatarSeed,
        workSummary: item.workSummary ?? EMPLOYEE_PAGE_TEXT.defaultWorkSummary,
        status: item.status,
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
          {/* 퀵 액션 버튼: 신규직원 초대 / 근로계약서 작성 */}
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
            {invitedRecords.length === 0 ? (
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
            count={selectedStaffRecords.length}
          >
            <EmployeeStaffGroupTabs
              selectedGroup={selectedStaffGroup}
              currentCount={currentRecords.length}
              resignedCount={resignedRecords.length}
              onSelect={setSelectedStaffGroup}
            />

            {selectedStaffRecords.length === 0 ? (
              <div className="flex h-56 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-muted)] px-[var(--space-4)] py-[var(--space-5)] text-center text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
                {STAFF_GROUP_EMPTY_MESSAGE[selectedStaffGroup]}
              </div>
            ) : (
              <ul className="h-56 space-y-[var(--space-2)] overflow-y-auto pr-[var(--space-0-5)]">
                {selectedStaffRecords.map((item) => (
                  <li key={item.id}>
                    <EmployeeListItem
                      item={item}
                      onOpen={handlers.openEmployeeDetail}
                      isInactive={selectedStaffGroup === 'RESIGNED'}
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
        onClose={handlers.closeInviteModal}
      />

      <BottomNav activeTab="staff" />
    </div>
  );
}
