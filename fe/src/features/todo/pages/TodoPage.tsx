import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Pencil } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';
import TodoActionBar from '../components/TodoActionBar';
import TodoCard from '../components/TodoCard';
import { useTodoStore } from '@/stores/useTodoStore';
import type { Todo } from '@/features/todo/types';

type Tab = '진행중' | '미완료' | '완료';
const TABS: Tab[] = ['진행중', '미완료', '완료'];

function parseDueAt(due_at: string): number {
  if (!due_at) return Infinity;
  return new Date(due_at).getTime();
}

export default function TodoPage() {
  const navigate = useNavigate();
  const todos = useTodoStore((s) => s.todos);
  const updateTodosStatus = useTodoStore((s) => s.updateTodosStatus);
  const deleteTodos = useTodoStore((s) => s.deleteTodos);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as Tab) ?? '진행중';

  const setActiveTab = (tab: Tab) => {
    setSearchParams({ tab });
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [confirmType, setConfirmType] = useState<'delete' | null>(null);

  const filteredTodos = todos
    .filter((todo) => todo.status === activeTab)
    .sort((a, b) => parseDueAt(a.due_at) - parseDueAt(b.due_at));

  useEffect(() => {
    const checkOverdue = () => {
      const now = Date.now();
      const overdueIds = todos
        .filter(
          (t) => t.status === '진행중' && t.due_at && parseDueAt(t.due_at) < now
        )
        .map((t) => t.task_id);
      if (overdueIds.length > 0) {
        updateTodosStatus(overdueIds, '미완료');
      }
    };
    checkOverdue();
    const interval = setInterval(checkOverdue, 60000);
    return () => clearInterval(interval);
  }, [todos, updateTodosStatus]);

  const isAllSelected =
    filteredTodos.length > 0 &&
    filteredTodos.every((t) => selectedIds.has(t.task_id));

  const handleTap = (todo: Todo) => {
    if (isSelectionMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(todo.task_id)) next.delete(todo.task_id);
        else next.add(todo.task_id);
        return next;
      });
    } else {
      navigate(ROUTES.TODO_DETAIL.replace(':id', todo.task_id.toString()));
    }
  };

  const handleLongPress = (id: number) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTodos.map((t) => t.task_id)));
    }
  };

  const handleCancel = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    deleteTodos([...selectedIds]);
    setConfirmType(null);
    handleCancel();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title="할 일 관리"
        onBack={() => navigate(ROUTES.HOME)}
        rightIcon={
          <Pencil size={20} color="var(--color-text-primary)" strokeWidth={2} />
        }
        onRightClick={() => navigate(ROUTES.TODO_NEW)}
      />

      {/* 탭 */}
      <div className="bg-[var(--color-bg-white)] flex border-b border-[var(--color-border-light)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-[var(--space-3)] cursor-pointer border-b-4 ${activeTab === tab ? 'border-[var(--color-action-todo)]' : 'border-transparent'}`}
            onClick={() => setActiveTab(tab)}
          >
            <span
              className={`text-[length:var(--text-md)] leading-5 ${activeTab === tab ? 'font-bold text-[color:var(--color-text-primary)]' : 'font-medium text-[color:var(--color-text-sub)]'}`}
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
            className="flex items-center gap-2 cursor-pointer"
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
            <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-sub)] font-medium leading-5">
              전체 선택
            </span>
          </button>
          <button onClick={handleCancel} className="ml-auto cursor-pointer">
            <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-sub)] font-medium leading-5">
              취소
            </span>
          </button>
        </div>
      )}

      {/* 콘텐츠 */}
      <main
        className={`flex-1 flex flex-col px-[var(--space-5)] py-[var(--space-5)] ${isSelectionMode ? 'pb-[220px]' : 'pb-[var(--bottom-safe)]'} ${filteredTodos.length === 0 ? 'items-center justify-center' : 'gap-[var(--space-5)]'}`}
      >
        {filteredTodos.length === 0 ? (
          <div className="flex flex-col gap-[var(--space-7)] items-center">
            <div
              className="flex items-center justify-center rounded-full w-[var(--size-empty-icon-outer)] h-[var(--size-empty-icon-outer)]"
              style={{ backgroundColor: 'var(--color-empty-icon-outer)' }}
            >
              <div className="bg-[var(--color-primary)] flex items-center justify-center rounded-full w-[var(--size-empty-icon-inner)] h-[var(--size-empty-icon-inner)] shadow-[var(--shadow-badge)]">
                <Check
                  size={28}
                  strokeWidth={3}
                  color="var(--color-text-primary)"
                />
              </div>
            </div>
            <div className="flex flex-col gap-[var(--space-2)] items-center text-center">
              <h2 className="text-[length:var(--text-xl)] text-[color:var(--color-text-primary)] font-bold tracking-[-0.5px]">
                {activeTab === '진행중'
                  ? '진행 중인 할 일이 없습니다'
                  : activeTab === '미완료'
                    ? '미완료된 할 일이 없습니다'
                    : '완료된 할 일이 없습니다'}
              </h2>
              <p className="text-[length:var(--text-md)] text-[color:var(--color-empty-text-sub)] font-medium">
                {activeTab === '완료'
                  ? '할 일을 완료하세요.'
                  : '새로운 할 일을 등록해보세요.'}
              </p>
            </div>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <TodoCard
              key={todo.task_id}
              todo={todo}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(todo.task_id)}
              onTap={() => handleTap(todo)}
              onLongPress={() => handleLongPress(todo.task_id)}
            />
          ))
        )}
      </main>

      {isSelectionMode && (
        <TodoActionBar
          secondaryLabel="삭제"
          onSecondary={() => setConfirmType('delete')}
        />
      )}

      <BottomNav />

      <ConfirmModal
        isOpen={confirmType === 'delete'}
        title="할 일을 삭제할까요?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDelete}
        onClose={() => setConfirmType(null)}
      />
    </div>
  );
}
