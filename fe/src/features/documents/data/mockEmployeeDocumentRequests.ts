export interface EmployeeEtcDocumentRequestRecord {
  id: string;
  documentName: string;
  dueDate: string;
}

const EMPLOYEE_ETC_REQUESTS: EmployeeEtcDocumentRequestRecord[] = [
  {
    id: 'employee-request-health-renewal',
    documentName: '보건증 갱신본',
    dueDate: '2026.04.05',
  },
];

export function listEmployeeEtcDocumentRequests() {
  return [...EMPLOYEE_ETC_REQUESTS];
}
