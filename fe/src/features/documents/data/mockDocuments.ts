export type DocumentCategory = 'PAYSLIP' | 'CONTRACT' | 'ETC';

export interface DocumentEmployeeOption {
  id: string;
  name: string;
}

export interface PayslipDocument {
  id: string;
  year: number;
  month: number;
  employeeName: string;
  issuedAt: string;
  title: string;
  pdfUrl: string;
  status: '발송 완료' | '확정';
}

export interface BasicDocument {
  id: string;
  category: Exclude<DocumentCategory, 'PAYSLIP' | 'CONTRACT'>;
  title: string;
  employeeName: string;
  issuedAt: string;
}

export interface PayslipMonthGroup {
  month: number;
  items: PayslipDocument[];
}

export const DOCUMENT_EMPLOYEE_OPTIONS: DocumentEmployeeOption[] = [
  { id: 'employee-kim', name: '김지희' },
  { id: 'employee-park', name: '박서준' },
  { id: 'employee-jung', name: '정유진' },
  { id: 'employee-choi', name: '최민수' },
];

export const PAYSLIP_DOCUMENTS: PayslipDocument[] = [
  {
    id: 'payslip-2026-03-kim',
    year: 2026,
    month: 3,
    employeeName: '김지희',
    issuedAt: '2026.04.25',
    title: '김지희 2026년 3월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '발송 완료',
  },
  {
    id: 'payslip-2026-03-park',
    year: 2026,
    month: 3,
    employeeName: '박서준',
    issuedAt: '2026.04.25',
    title: '박서준 2026년 3월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '발송 완료',
  },
  {
    id: 'payslip-2026-02-kim',
    year: 2026,
    month: 2,
    employeeName: '김지희',
    issuedAt: '2026.03.25',
    title: '김지희 2026년 2월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '확정',
  },
  {
    id: 'payslip-2026-01-jung',
    year: 2026,
    month: 1,
    employeeName: '정유진',
    issuedAt: '2026.02.25',
    title: '정유진 2026년 1월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '확정',
  },
  {
    id: 'payslip-2025-12-kim',
    year: 2025,
    month: 12,
    employeeName: '김지희',
    issuedAt: '2026.01.25',
    title: '김지희 2025년 12월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '확정',
  },
];

export const OTHER_DOCUMENTS: BasicDocument[] = [
  {
    id: 'etc-health-kim-001',
    category: 'ETC',
    title: '김지희 보건증',
    employeeName: '김지희',
    issuedAt: '2025.12.11',
  },
  {
    id: 'etc-bank-park-001',
    category: 'ETC',
    title: '박서준 통장 사본',
    employeeName: '박서준',
    issuedAt: '2026.01.08',
  },
];

export const DOCUMENT_TAB_OPTIONS: Array<{
  key: DocumentCategory;
  label: string;
}> = [
  { key: 'PAYSLIP', label: '급여명세서' },
  { key: 'CONTRACT', label: '근로계약서' },
  { key: 'ETC', label: '기타문서' },
];

export function getAvailableYears(payslips: PayslipDocument[]): number[] {
  return [...new Set(payslips.map((item) => item.year))].sort((a, b) => b - a);
}

export function groupPayslipsByMonth(
  payslips: PayslipDocument[],
  targetYear: number
): PayslipMonthGroup[] {
  const monthMap = new Map<number, PayslipDocument[]>();

  payslips
    .filter((item) => item.year === targetYear)
    .forEach((item) => {
      const current = monthMap.get(item.month) ?? [];
      current.push(item);
      monthMap.set(item.month, current);
    });

  return [...monthMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([month, items]) => ({
      month,
      items: [...items].sort((a, b) =>
        a.employeeName.localeCompare(b.employeeName)
      ),
    }));
}

export function findPayslipById(id?: string): PayslipDocument | null {
  if (!id) return null;
  return PAYSLIP_DOCUMENTS.find((item) => item.id === id) ?? null;
}
