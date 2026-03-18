import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Calendar, Clock } from 'lucide-react';
import DatePickerModal from '@/components/common/DateSheet';
import TimePickerModal from '@/components/common/TimeSheet';
import { EMPLOYEES } from '@/stores/useTodoStore';

type Props = {
  title: string;
  onTitleChange: (v: string) => void;
  selectedEmployees: string[];
  onEmployeesChange: (v: string[]) => void;
  selectedDate: Dayjs | null;
  onDateChange: (v: Dayjs | null) => void;
  selectedTime: { hour: number; minute: number } | null;
  onTimeChange: (v: { hour: number; minute: number } | null) => void;
};

export default function TodoInfoSection({
  title,
  onTitleChange,
  selectedEmployees,
  onEmployeesChange,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
}: Props) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const isAll = selectedEmployees.length === EMPLOYEES.length;

  const toggleAll = () => {
    onEmployeesChange(isAll ? [] : [...EMPLOYEES]);
  };

  const toggleEmployee = (name: string) => {
    onEmployeesChange(
      selectedEmployees.includes(name)
        ? selectedEmployees.filter((e) => e !== name)
        : [...selectedEmployees, name]
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
            className="w-full py-[var(--space-3)] px-[var(--space-5)] rounded-[var(--radius-sm)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] outline-none placeholder:text-[color:var(--color-text-placeholder)] placeholder:font-medium"
          />
        </div>

        {/* 담당 직원 */}
        <div className="flex flex-col gap-[var(--space-3)] w-full">
          <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold leading-5">
            담당 직원
          </span>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            <button
              className={`cursor-pointer py-[var(--space-1-5)] px-[var(--space-5)] rounded-[var(--radius-sm)] whitespace-nowrap ${isAll ? 'bg-[var(--color-badge-purple-bg)] shadow-[var(--shadow-badge)]' : 'bg-[var(--color-border-light)]'}`}
              onClick={toggleAll}
            >
              <span
                className={`text-[length:var(--text-md)] font-medium leading-5 ${isAll ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-chip)]'}`}
              >
                전체
              </span>
            </button>
            {EMPLOYEES.map((name) => {
              const isSelected = selectedEmployees.includes(name);
              return (
                <button
                  key={name}
                  className={`cursor-pointer py-[var(--space-1-5)] px-[var(--space-5)] rounded-[var(--radius-sm)] whitespace-nowrap ${isSelected ? 'bg-[var(--color-chip-selected-bg)] shadow-[var(--shadow-badge)]' : 'bg-[var(--color-border-light)]'}`}
                  onClick={() => toggleEmployee(name)}
                >
                  <span
                    className={`text-[length:var(--text-md)] leading-5 ${isSelected ? 'text-[color:var(--color-text-primary)] font-bold' : 'text-[color:var(--color-text-chip)] font-medium'}`}
                  >
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
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
                className="absolute right-3 top-1/2 -translate-y-1/2"
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
                className="absolute right-3 top-1/2 -translate-y-1/2"
                color="var(--color-text-light)"
              />
            </button>
          </div>
        </div>
      </div>

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
      <DatePickerModal
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
