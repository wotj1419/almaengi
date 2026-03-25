import type {
  ContractStatus,
  OwnerContractForm,
} from '@/features/documents/data/mockContracts';

export interface EmployeeContractRecord {
  id: string;
  title: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  ownerForm: OwnerContractForm;
  employeeName: string;
  employeePhone: string;
  employeeAddress: string;
  employeeSignatureDataUrl: string;
  submittedAt: string | null;
  approvedAt: string | null;
}

const STORAGE_KEY = 'documents.employee.contract.records.v1';
const CHANGE_EVENT = 'documents:employee-contracts:changed';

const DEFAULT_OWNER_FORM: OwnerContractForm = {
  employeeName: '홍길동',
  contractStartDate: '2026-04-01',
  contractEndDate: '2026-10-01',
  workPlace: '서울시 강남구 테헤란로 123, 알맹이 카페',
  workDescription: '매장 주문 응대 및 음료 제조',
  scheduledStartTime: '10:00',
  scheduledEndTime: '16:00',
  breakStartTime: '13:00',
  breakEndTime: '13:30',
  weeklyWorkDays: '5',
  weeklyHolidayType: 'EXCEPT_WORK_DAYS',
  weeklyHoliday: '일요일',
  hourlyWage: '12000',
  hasBonus: false,
  bonusAmount: '',
  hasOtherPay: false,
  otherPayName: '',
  otherPayAmount: '',
  payday: '매월 25일',
  insuranceEmployment: true,
  insuranceIndustrial: true,
  insuranceNationalPension: true,
  insuranceHealth: true,
  writtenDate: '2026-03-25',
  businessName: '알맹이 카페',
  businessAddress: '서울시 강남구 테헤란로 123',
  representativeName: '김사장',
  businessPhone: '02-1234-5678',
  ownerSignatureDataUrl: '',
};

const INITIAL_RECORDS: EmployeeContractRecord[] = [
  {
    id: 'employee-contract-requesting-001',
    title: '근로계약서',
    status: 'REQUESTING',
    createdAt: '2026-03-25T09:00:00.000Z',
    updatedAt: '2026-03-25T09:00:00.000Z',
    ownerForm: DEFAULT_OWNER_FORM,
    employeeName: '홍길동',
    employeePhone: '010-1234-5678',
    employeeAddress: '',
    employeeSignatureDataUrl: '',
    submittedAt: null,
    approvedAt: null,
  },
  {
    id: 'employee-contract-approved-001',
    title: '근로계약서',
    status: 'APPROVED',
    createdAt: '2026-02-20T09:00:00.000Z',
    updatedAt: '2026-02-21T11:20:00.000Z',
    ownerForm: {
      ...DEFAULT_OWNER_FORM,
      contractStartDate: '2026-02-21',
      contractEndDate: '2026-08-21',
      writtenDate: '2026-02-20',
    },
    employeeName: '홍길동',
    employeePhone: '010-1234-5678',
    employeeAddress: '서울시 서초구 서초대로 45',
    employeeSignatureDataUrl: '',
    submittedAt: '2026-02-20T14:10:00.000Z',
    approvedAt: '2026-02-21T11:20:00.000Z',
  },
];

function canUseStorage() {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function writeRecords(records: EmployeeContractRecord[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function ensureInitialized() {
  if (!canUseStorage()) return;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    writeRecords(INITIAL_RECORDS);
  }
}

function parseRecord(raw: unknown): EmployeeContractRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as EmployeeContractRecord;
  if (
    !candidate.id ||
    !candidate.title ||
    !candidate.status ||
    !candidate.createdAt ||
    !candidate.updatedAt ||
    !candidate.ownerForm
  ) {
    return null;
  }
  return candidate;
}

function readRecords() {
  if (!canUseStorage()) return INITIAL_RECORDS;
  ensureInitialized();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_RECORDS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return INITIAL_RECORDS;

    const records = parsed
      .map(parseRecord)
      .filter((item): item is EmployeeContractRecord => item !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return records.length > 0 ? records : INITIAL_RECORDS;
  } catch {
    return INITIAL_RECORDS;
  }
}

export function getEmployeeContractStatusLabel(status: ContractStatus) {
  if (status === 'REQUESTING') return '서명요청';
  if (status === 'PENDING_APPROVAL') return '검토중';
  return '계약완료';
}

export function listEmployeeContractRecords() {
  return readRecords();
}

export function getEmployeeContractById(id?: string) {
  if (!id) return null;
  return readRecords().find((item) => item.id === id) ?? null;
}

export function submitEmployeeContractSign(
  contractId: string,
  payload: {
    employeeAddress: string;
    employeeSignatureDataUrl: string;
  }
) {
  const records = readRecords();
  const index = records.findIndex((item) => item.id === contractId);
  if (index < 0) return null;

  const target = records[index];
  if (target.status !== 'REQUESTING') return target;

  const now = new Date().toISOString();
  const next: EmployeeContractRecord = {
    ...target,
    status: 'PENDING_APPROVAL',
    updatedAt: now,
    submittedAt: now,
    employeeAddress: payload.employeeAddress,
    employeeSignatureDataUrl: payload.employeeSignatureDataUrl,
  };

  const nextRecords = [...records];
  nextRecords[index] = next;
  writeRecords(nextRecords);
  return next;
}

export function subscribeEmployeeContractRecords(listener: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handle = () => listener();
  window.addEventListener(CHANGE_EVENT, handle);
  window.addEventListener('storage', handle);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handle);
    window.removeEventListener('storage', handle);
  };
}
