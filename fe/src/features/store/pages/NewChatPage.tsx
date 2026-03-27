import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from 'boring-avatars';
import { Check } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import useAuthStore from '@/stores/useAuthStore';
import { getEmployees, type Employee } from '@/api/store';
import { useChatStore } from '@/stores/useChatStore';

export default function NewChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const createDirectRoom = useChatStore((s) => s.createDirectRoom);
  const createGroupRoom = useChatStore((s) => s.createGroupRoom);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (!storeId) return;
    getEmployees(storeId).then(setEmployees).catch(console.error);
  }, [storeId]);

  const toggleSelect = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0 || !storeId) return;

    if (selectedIds.size === 1) {
      // 1명 선택 → DM 방 생성/재사용
      const targetUserId = [...selectedIds][0];
      const roomId = await createDirectRoom(storeId, targetUserId);
      navigate(ROUTES.STORE_CHAT_ROOM.replace(':chatRoomId', String(roomId)), {
        state: location.state,
      });
    } else {
      // 2명 이상 선택 → 참여자 이름으로 그룹방 생성
      const selectedUserIds = [...selectedIds];
      const groupName = employees
        .filter((e) => selectedIds.has(e.userId))
        .map((e) => e.name)
        .join(', ');
      const roomId = await createGroupRoom(storeId, groupName, selectedUserIds);
      navigate(ROUTES.STORE_CHAT_ROOM.replace(':chatRoomId', String(roomId)), {
        state: location.state,
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title="대화 상대 선택"
        onBack={() =>
          navigate(`${ROUTES.STORE_COMMUNITY}?tab=chat`, {
            state: location.state,
          })
        }
        rightIcon={
          selectedIds.size > 0 ? (
            <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)] relative top-[-2px]">
              {selectedIds.size} 확인
            </span>
          ) : undefined
        }
        onRightClick={selectedIds.size > 0 ? handleConfirm : undefined}
      />

      <main className="flex-1 flex flex-col">
        {employees.map((employee) => {
          const isSelected = selectedIds.has(employee.userId);

          return (
            <button
              key={employee.employeeId}
              className="flex items-center gap-[var(--space-5)] w-full px-[var(--space-7)] py-[var(--space-7)] bg-[var(--color-bg-white)] cursor-pointer text-left"
              onClick={() => toggleSelect(employee.userId)}
            >
              <div className="shrink-0 w-[48px] h-[48px] rounded-full overflow-hidden">
                <Avatar size={48} name={employee.name} variant="beam" />
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]">
                  {employee.name}
                </span>
                <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
                  {employee.position}
                </span>
              </div>
              {/* 선택 원 */}
              <div
                className={`shrink-0 w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                    : 'border-[var(--color-border-muted)] bg-[var(--color-bg-white)]'
                }`}
              >
                {isSelected && (
                  <Check
                    size={14}
                    color="var(--color-text-primary)"
                    strokeWidth={3}
                  />
                )}
              </div>
            </button>
          );
        })}
      </main>
    </div>
  );
}
