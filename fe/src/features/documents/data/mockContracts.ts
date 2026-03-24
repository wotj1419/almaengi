export type ContractStatus = 'REQUESTING' | 'PENDING_APPROVAL' | 'APPROVED';

export interface OwnerContractForm {
  employeeName: string;
  contractStartDate: string;
  contractEndDate: string;
  workPlace: string;
  workDescription: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  breakStartTime: string;
  breakEndTime: string;
  weeklyWorkDays: string;
  weeklyHolidayType: 'WEEKDAY' | 'EXCEPT_WORK_DAYS';
  weeklyHoliday: string;
  hourlyWage: string;
  hasBonus: boolean;
  bonusAmount: string;
  hasOtherPay: boolean;
  otherPayName: string;
  otherPayAmount: string;
  payday: string;
  insuranceEmployment: boolean;
  insuranceIndustrial: boolean;
  insuranceNationalPension: boolean;
  insuranceHealth: boolean;
  writtenDate: string;
  businessName: string;
  businessAddress: string;
  representativeName: string;
  businessPhone: string;
  ownerSignatureDataUrl: string;
}

export interface EmployeeSubmission {
  employeeName: string;
  employeeAddress: string;
  employeePhone: string;
  employeeSignatureDataUrl: string;
  submittedAt: string;
}

export interface ContractRecord {
  id: string;
  title: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  ownerForm: OwnerContractForm;
  employeeSubmission: EmployeeSubmission | null;
  approvedAt: string | null;
  pdfUrl: string | null;
}

const STORAGE_KEY = 'documents.contract.records.v1';
const CHANGE_EVENT = 'documents:contracts:changed';
const DEFAULT_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

function canUseStorage() {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function parseContractRecord(raw: unknown): ContractRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as ContractRecord;
  if (
    !candidate.id ||
    !candidate.status ||
    !candidate.title ||
    !candidate.createdAt ||
    !candidate.updatedAt ||
    !candidate.ownerForm
  ) {
    return null;
  }

  return {
    ...candidate,
    employeeSubmission: candidate.employeeSubmission ?? null,
    approvedAt: candidate.approvedAt ?? null,
    pdfUrl: candidate.pdfUrl ?? null,
  };
}

function readRecords(): ContractRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(parseContractRecord)
      .filter((item): item is ContractRecord => item !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function writeRecords(records: ContractRecord[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function updateRecord(
  id: string,
  updater: (record: ContractRecord) => ContractRecord
): ContractRecord | null {
  const records = readRecords();
  const targetIndex = records.findIndex((item) => item.id === id);
  if (targetIndex < 0) return null;

  const nextRecord = updater(records[targetIndex]);
  const nextRecords = [...records];
  nextRecords[targetIndex] = nextRecord;
  writeRecords(nextRecords);
  return nextRecord;
}

function generateContractId() {
  return `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getContractStatusLabel(status: ContractStatus) {
  if (status === 'REQUESTING') return '요청중';
  if (status === 'PENDING_APPROVAL') return '확인대기';
  return '확인완료';
}

export function listContractRecords() {
  return readRecords();
}

export function getContractRecordById(id?: string) {
  if (!id) return null;
  return readRecords().find((item) => item.id === id) ?? null;
}

export function createContractRecord(ownerForm: OwnerContractForm) {
  const now = new Date().toISOString();
  const newRecord: ContractRecord = {
    id: generateContractId(),
    title: `${ownerForm.employeeName} 직원 근로계약서`,
    status: 'REQUESTING',
    createdAt: now,
    updatedAt: now,
    ownerForm,
    employeeSubmission: null,
    approvedAt: null,
    pdfUrl: null,
  };

  writeRecords([newRecord, ...readRecords()]);
  return newRecord;
}

export function submitEmployeeContract(
  contractId: string,
  submission: Omit<EmployeeSubmission, 'submittedAt'>
) {
  return updateRecord(contractId, (record) => {
    if (record.status !== 'REQUESTING') return record;

    const now = new Date().toISOString();
    return {
      ...record,
      status: 'PENDING_APPROVAL',
      updatedAt: now,
      employeeSubmission: {
        ...submission,
        submittedAt: now,
      },
    };
  });
}

export function approveContract(contractId: string) {
  return updateRecord(contractId, (record) => {
    if (record.status !== 'PENDING_APPROVAL') return record;

    const now = new Date().toISOString();
    return {
      ...record,
      status: 'APPROVED',
      updatedAt: now,
      approvedAt: now,
      pdfUrl: record.pdfUrl ?? DEFAULT_PDF_URL,
    };
  });
}

export function subscribeContractRecords(listener: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => listener();
  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}
