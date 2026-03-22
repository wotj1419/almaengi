import { useState, useRef, useEffect } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Calendar, Clock, Search, X, Check } from 'lucide-react';
import Avatar from 'boring-avatars';
import TodoDatePicker from '@/features/todo/components/TodoDatePicker';
import TimePickerModal from '@/components/common/TimeSheet';
import { EMPLOYEES } from '@/features/todo/data/mockTodo';

type Props = {
  title: string;
  onTitleChange: (v: string) => void;
  assigneeEmployeeIds: number[];
  onAssigneeChange: (ids: number[]) => void;
  selectedDate: Dayjs | null;
  onDateChange: (v: Dayjs | null) => void;
  selectedTime: { hour: number; minute: number } | null;
  onTimeChange: (v: { hour: number; minute: number } | null) => void;
  titleError?: string;
  assigneeError?: string;
  dateError?: string;
};

export default function TodoInfoSection({
  title,
  onTitleChange,
  assigneeEmployeeIds,
  onAssigneeChange,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  titleError,
  assigneeError,
  dateError,
}: Props) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const filteredEmployees = EMPLOYEES.filter((e) =>
    e.name.includes(searchQuery)
  );
  const isAllSelected = filteredEmployees.every((e) =>
    tempSelectedIds.includes(e.id)
  );

  const openSearch = () => {
    setTempSelectedIds([...assigneeEmployeeIds]);
    setSearchQuery('');
    setIsSearchOpen(true);
  };

  const handleToggleTemp = (id: number) => {
    setTempSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      setTempSelectedIds((prev) =>
        prev.filter((id) => !filteredEmployees.some((e) => e.id === id))
      );
    } else {
      const newIds = filteredEmployees.map((e) => e.id);
      setTempSelectedIds((prev) => [...new Set([...prev, ...newIds])]);
    }
  };

  const handleApply = () => {
    onAssigneeChange(tempSelectedIds);
    setIsSearchOpen(false);
  };

  const toggleDirect = (id: number) => {
    onAssigneeChange(
      assigneeEmployeeIds.includes(id)
        ? assigneeEmployeeIds.filter((v) => v !== id)
        : [...assigneeEmployeeIds, id]
    );
  };

  return (
    <>
      <div className="flex flex-col gap-[var(--space-7)] w-full">
        {/* 할 일 제목 */}
        <div className="flex flex-col gap-[var(--space-3)] w-full">
          <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold leading-5">
            할 일 제목
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="제목을 입력해 주세요."
            className={`w-full py-[var(--space-3)] px-[var(--space-5)] rounded-[var(--radius-sm)] border bg-[var(--color-bg-white)] outline-none placeholder:text-[color:var(--color-text-placeholder)] placeholder:font-medium ${titleError ? 'border-red-400' : 'border-[var(--color-input-border)]'}`}
          />
          {titleError && (
            <span className="text-[length:var(--text-sm)] text-red-500">
              {titleError}
            </span>
          )}
        </div>

        {/* 담당 직원 */}
        <div className="flex flex-col gap-[var(--space-3)] w-full">
          <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold leading-5">
            담당 직원
          </span>

          {/* 돋보기 + 직접 선택 바 */}
          <div className="flex items-center gap-[var(--space-2)]">
            <button
              onClick={openSearch}
              className="flex-shrink-0 py-[var(--space-1-5)] px-[var(--space-3)] flex items-center justify-center rounded-full bg-[var(--color-border-light)] cursor-pointer"
            >
              <Search size={16} color="var(--color-text-sub)" strokeWidth={2} />
            </button>
            <div
              ref={scrollRef}
              className="flex-1 overflow-x-auto flex gap-[var(--space-2)] scrollbar-hide"
            >
              {EMPLOYEES.map((employee) => {
                const isSelected = assigneeEmployeeIds.includes(employee.id);
                return (
                  <button
                    key={employee.id}
                    onClick={() => toggleDirect(employee.id)}
                    className={`flex-shrink-0 cursor-pointer py-[var(--space-1-5)] px-[var(--space-4)] rounded-full whitespace-nowrap ${isSelected ? 'bg-[var(--color-primary)] shadow-[var(--shadow-badge)]' : 'bg-[var(--color-border-light)]'}`}
                  >
                    <span
                      className={`text-[length:var(--text-md)] leading-5 ${isSelected ? 'text-[color:var(--color-text-primary)] font-medium' : 'text-[color:var(--color-text-chip)] font-medium'}`}
                    >
                      {employee.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {assigneeError && (
            <span className="text-[length:var(--text-sm)] text-red-500">
              {assigneeError}
            </span>
          )}

          {/* 선택된 직원 칩 */}
          {assigneeEmployeeIds.length > 0 && (
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {EMPLOYEES.filter((e) => assigneeEmployeeIds.includes(e.id)).map(
                (e) => (
                  <span
                    key={e.id}
                    className="flex items-center gap-[var(--space-1)] py-[var(--space-1-5)] pl-[var(--space-3)] pr-[var(--space-2)] rounded-full bg-[var(--color-primary)] shadow-[var(--shadow-badge)]"
                  >
                    <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-medium leading-5">
                      {e.name}
                    </span>
                    <button
                      onClick={() =>
                        onAssigneeChange(
                          assigneeEmployeeIds.filter((id) => id !== e.id)
                        )
                      }
                      className="flex items-center justify-center cursor-pointer"
                    >
                      <X
                        size={13}
                        color="var(--color-text-sub)"
                        strokeWidth={2.5}
                      />
                    </button>
                  </span>
                )
              )}
            </div>
          )}
        </div>

        {/* 완료 기한 */}
        <div className="flex flex-col gap-[var(--space-3)] w-full">
          <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold leading-5">
            완료 기한
          </span>
          <div className="flex items-center gap-[var(--space-2)]">
            <button
              className="relative flex-[1.8] cursor-pointer"
              onClick={() => setIsDatePickerOpen(true)}
            >
              <div className="flex items-center px-[var(--space-5)] h-10 rounded-[var(--radius-sm)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)]">
                <span
                  className={`text-[length:var(--text-md)] leading-5 ${selectedDate ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-placeholder)]'}`}
                >
                  {selectedDate
                    ? selectedDate.format('YYYY년 M월 D일')
                    : '날짜 선택'}
                </span>
              </div>
              <Calendar
                size={18}
                className="absolute right-[var(--space-3)] top-1/2 -translate-y-1/2"
                color="var(--color-text-light)"
              />
            </button>
            <button
              className="relative flex-[1.2] cursor-pointer"
              onClick={() => setIsTimePickerOpen(true)}
            >
              <div className="flex items-center px-[var(--space-5)] h-10 rounded-[var(--radius-sm)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)]">
                <span
                  className={`text-[length:var(--text-md)] leading-5 ${selectedTime ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-placeholder)]'}`}
                >
                  {selectedTime
                    ? `${String(selectedTime.hour).padStart(2, '0')}:${String(selectedTime.minute).padStart(2, '0')}`
                    : '시간 선택'}
                </span>
              </div>
              <Clock
                size={18}
                className="absolute right-[var(--space-3)] top-1/2 -translate-y-1/2"
                color="var(--color-text-light)"
              />
            </button>
          </div>
          {dateError && (
            <span className="text-[length:var(--text-sm)] text-red-500">
              {dateError}
            </span>
          )}
        </div>
      </div>

      {/* 검색 모달 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-[var(--space-5)]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-[480px] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] p-[var(--space-5)] flex flex-col gap-[var(--space-4)]">
            <span className="text-[length:var(--text-xl)] text-[color:var(--color-text-primary)] font-bold">
              담당 직원 검색
            </span>

            {/* 검색 입력 */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름으로 검색"
                className="w-full py-[var(--space-3)] pl-9 pr-[var(--space-5)] rounded-[var(--radius-sm)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] outline-none placeholder:text-[color:var(--color-text-placeholder)]"
              />
              <Search
                size={16}
                className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2"
                color="var(--color-text-sub)"
              />
            </div>

            {/* 전체 선택 */}
            <button
              onClick={handleToggleAll}
              className="flex items-center gap-[var(--space-3)] cursor-pointer"
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center ${isAllSelected ? 'bg-[var(--color-action-todo)] border-[var(--color-action-todo)]' : 'border-[var(--color-border-light)]'}`}
              >
                {isAllSelected && (
                  <Check size={12} strokeWidth={3} color="black" />
                )}
              </div>
              <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-semibold">
                전체 선택
              </span>
            </button>

            <div className="h-px bg-[var(--color-border-light)]" />

            {/* 직원 목록 */}
            <div className="flex flex-col gap-[var(--space-3)] max-h-60 overflow-y-auto">
              {filteredEmployees.map((e) => {
                const isChecked = tempSelectedIds.includes(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => handleToggleTemp(e.id)}
                    className="flex items-center gap-[var(--space-3)] cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${isChecked ? 'bg-[var(--color-action-todo)] border-[var(--color-action-todo)]' : 'border-[var(--color-border-light)]'}`}
                    >
                      {isChecked && (
                        <Check size={12} strokeWidth={3} color="black" />
                      )}
                    </div>
                    <Avatar size={28} name={e.name} variant="beam" />
                    <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-medium">
                      {e.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 버튼 */}
            <div className="flex gap-[var(--space-3)] pt-[var(--space-2)]">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="flex-1 py-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-border-light)] cursor-pointer"
              >
                <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
                  취소
                </span>
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-action-todo)] cursor-pointer"
              >
                <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
                  적용
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <TimePickerModal
        isOpen={isTimePickerOpen}
        selectedHour={selectedTime?.hour ?? 12}
        selectedMinute={selectedTime?.minute ?? 0}
        onConfirm={(hour, minute) => {
          onTimeChange({ hour, minute });
          setIsTimePickerOpen(false);
        }}
        onClose={() => setIsTimePickerOpen(false)}
      />
      <TodoDatePicker
        isOpen={isDatePickerOpen}
        selectedDate={selectedDate ?? dayjs()}
        onConfirm={(date) => {
          onDateChange(date);
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </>
  );
}
