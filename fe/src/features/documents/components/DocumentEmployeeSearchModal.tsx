import Avatar from 'boring-avatars';
import { Check, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getEmployees, type Employee } from '@/api/store';

interface DocumentEmployeeSearchModalProps {
  isOpen: boolean;
  storeId: number;
  selectedEmployeeId: number | null;
  selectedEmployeeName: string;
  onClose: () => void;
  onApply: (employee: { employeeId: number; employeeName: string }) => void;
}

export default function DocumentEmployeeSearchModal({
  isOpen,
  storeId,
  selectedEmployeeId,
  selectedEmployeeName,
  onClose,
  onApply,
}: DocumentEmployeeSearchModalProps) {
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [tempSelectedId, setTempSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await getEmployees(storeId);
        setEmployees(data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [isOpen, storeId]);

  const filteredEmployees = useMemo(
    () => employees.filter((employee) => employee.name.includes(query.trim())),
    [query, employees]
  );

  const currentSelectedId = tempSelectedId ?? selectedEmployeeId;
  const currentSelectedName =
    employees.find((e) => e.employeeId === currentSelectedId)?.name ??
    selectedEmployeeName;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-[var(--space-5)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)]"
        onClick={onClose}
        aria-label="직원 선택 닫기"
      />

      <div className="relative w-full max-w-[480px] rounded-[var(--radius-lg)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-alert)]">
        <div className="mb-[var(--space-4)]">
          <p className="text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)]">
            대상 직원 선택
          </p>
        </div>

        <div className="relative mb-[var(--space-4)]">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="직원 이름으로 검색"
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] pl-10 pr-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-primary)] outline-none"
          />
          <Search
            size={16}
            className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--color-text-sub)]"
          />
        </div>

        <div className="max-h-72 space-y-[var(--space-2)] overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
              직원 목록을 불러오는 중...
            </p>
          ) : filteredEmployees.length === 0 ? (
            <p className="py-8 text-center text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            filteredEmployees.map((employee) => {
              const checked = currentSelectedId === employee.employeeId;

              return (
                <button
                  key={employee.employeeId}
                  type="button"
                  onClick={() => setTempSelectedId(employee.employeeId)}
                  className="flex w-full items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] text-left hover:bg-[var(--color-bg-base)]"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      checked
                        ? 'border-[var(--color-action-todo)] bg-[var(--color-action-todo)]'
                        : 'border-[var(--color-border-muted)] bg-[var(--color-bg-white)]'
                    }`}
                  >
                    {checked && (
                      <Check size={12} strokeWidth={3} color="#111827" />
                    )}
                  </div>
                  <Avatar size={30} name={employee.name} variant="beam" />
                  <span className="text-[length:var(--text-md)] font-medium text-[var(--color-text-primary)]">
                    {employee.name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-[var(--space-4)] flex gap-[var(--space-2)]">
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setTempSelectedId(null);
              onClose();
            }}
            className="h-11 flex-1 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] text-[length:var(--text-md)] font-bold text-[var(--color-text-muted)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentSelectedId !== null) {
                onApply({
                  employeeId: currentSelectedId,
                  employeeName: currentSelectedName,
                });
              }
              setQuery('');
              setTempSelectedId(null);
              onClose();
            }}
            className="h-11 flex-1 rounded-[var(--radius-md)] bg-[var(--color-action-todo)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)]"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
