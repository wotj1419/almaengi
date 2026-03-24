export type DocumentRequestType = 'CONTRACT' | 'ETC';
export type DocumentRequestStatus = 'REQUESTING';

export interface EtcDocumentRequestRecord {
  id: string;
  requestType: 'ETC';
  status: DocumentRequestStatus;
  employeeName: string;
  documentName: string;
  documentCategory: string;
  dueDate: string;
  requestMemo: string;
  requesterName: string;
  businessName: string;
  createdAt: string;
}

const STORAGE_KEY = 'documents.etc.requests.v1';
const CHANGE_EVENT = 'documents:etc-requests:changed';

function canUseStorage() {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function parseEtcRequestRecord(raw: unknown): EtcDocumentRequestRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as EtcDocumentRequestRecord;
  if (
    !candidate.id ||
    !candidate.requestType ||
    !candidate.status ||
    !candidate.employeeName ||
    !candidate.documentName ||
    !candidate.documentCategory ||
    !candidate.dueDate ||
    !candidate.requestMemo ||
    !candidate.createdAt
  ) {
    return null;
  }

  return candidate;
}

function readRecords(): EtcDocumentRequestRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(parseEtcRequestRecord)
      .filter((item): item is EtcDocumentRequestRecord => item !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function writeRecords(records: EtcDocumentRequestRecord[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function createRequestId() {
  return `doc-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listEtcDocumentRequests() {
  return readRecords();
}

export function createEtcDocumentRequest(
  payload: Omit<
    EtcDocumentRequestRecord,
    'id' | 'createdAt' | 'status' | 'requestType'
  >
) {
  const record: EtcDocumentRequestRecord = {
    id: createRequestId(),
    requestType: 'ETC',
    status: 'REQUESTING',
    createdAt: new Date().toISOString(),
    ...payload,
  };

  writeRecords([record, ...readRecords()]);
  return record;
}

export function subscribeEtcDocumentRequests(listener: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => listener();
  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}
