import type {
  CaseRef,
  DocumentRow,
  DocumentsQuery,
  DocumentsSummary,
  ReviewDocumentInput,
  UploadDocumentInput,
} from "../types";
import type { DocumentsApi } from "./contract";

/**
 * Development stand-in. Ids follow the API doc's default test data so the
 * same fixtures make sense against the real backend. Nothing outside
 * `api/index.ts` references this file — delete it when the API lands.
 */

const CASES: CaseRef[] = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    caseNumber: "LC-2026-0001",
    title: "نزاع عقد مع عميل",
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    caseNumber: "LC-2026-0002",
    title: "نزاع عمالي",
  },
  {
    id: "30000000-0000-0000-0000-000000000003",
    caseNumber: "LC-2026-0003",
    title: "تسجيل علامة تجارية",
  },
];

const PEOPLE: Record<string, string> = {
  "20000000-0000-0000-0000-000000000001": "أيمن الشريف",
  "20000000-0000-0000-0000-000000000002": "هالة القضاة",
  "20000000-0000-0000-0000-000000000003": "مايا العدوان",
  "20000000-0000-0000-0000-000000000004": "سارة النسور",
};

const OWNER = "20000000-0000-0000-0000-000000000001";
const MANAGER = "20000000-0000-0000-0000-000000000002";
const LAWYER = "20000000-0000-0000-0000-000000000003";
const SECRETARY = "20000000-0000-0000-0000-000000000004";

const daysAgo = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

type SeedRow = Omit<
  DocumentRow,
  "caseNumber" | "caseTitle" | "uploadedByName" | "reviewedByName" | "sizeBytes" | "previewUrl"
> &
  Partial<Pick<DocumentRow, "sizeBytes" | "previewUrl">>;

function row(partial: SeedRow): DocumentRow {
  const legalCase = CASES.find((item) => item.id === partial.caseId);
  return {
    ...partial,
    caseNumber: legalCase?.caseNumber ?? "—",
    caseTitle: legalCase?.title ?? "—",
    uploadedByName: PEOPLE[partial.uploadedByEmployeeId] ?? "—",
    reviewedByName: partial.reviewedByEmployeeId
      ? PEOPLE[partial.reviewedByEmployeeId] ?? "—"
      : null,
    sizeBytes: partial.sizeBytes ?? null,
    previewUrl: partial.previewUrl ?? null,
  };
}

let documents: DocumentRow[] = [
  row({
    id: "d_1",
    sizeBytes: 412806,
    caseId: CASES[0].id,
    fileName: "عقد-التوريد-الموقع.pdf",
    status: "Reviewed",
    visibleToClient: true,
    uploadedByEmployeeId: SECRETARY,
    uploadedAtUtc: daysAgo(9, 9),
    reviewedByEmployeeId: LAWYER,
    reviewedAtUtc: daysAgo(8, 14),
    internalNotes: "روجعت البنود الجزائية، جاهزة لمشاركتها مع العميل.",
  }),
  row({
    id: "d_2",
    sizeBytes: 188204,
    caseId: CASES[0].id,
    fileName: "مراسلات-الإنذار-العدلي.pdf",
    status: "Uploaded",
    visibleToClient: false,
    uploadedByEmployeeId: LAWYER,
    uploadedAtUtc: daysAgo(4, 11),
    reviewedByEmployeeId: null,
    reviewedAtUtc: null,
    internalNotes: null,
  }),
  row({
    id: "d_3",
    sizeBytes: 96512,
    caseId: CASES[1].id,
    fileName: "employment-contract-2024.pdf",
    status: "Uploaded",
    visibleToClient: true,
    uploadedByEmployeeId: SECRETARY,
    uploadedAtUtc: daysAgo(2, 13),
    reviewedByEmployeeId: null,
    reviewedAtUtc: null,
    internalNotes: null,
  }),
  row({
    id: "d_4",
    sizeBytes: 1204990,
    caseId: CASES[1].id,
    fileName: "شهادة-الضمان-الاجتماعي.pdf",
    status: "Reviewed",
    visibleToClient: false,
    uploadedByEmployeeId: MANAGER,
    uploadedAtUtc: daysAgo(6, 15),
    reviewedByEmployeeId: MANAGER,
    reviewedAtUtc: daysAgo(5, 10),
    internalNotes: "نسخة غير رسمية — يلزم طلب النسخة المصدقة قبل الجلسة.",
  }),
  row({
    id: "d_5",
    sizeBytes: 342118,
    caseId: CASES[2].id,
    fileName: "trademark-application.pdf",
    status: "Uploaded",
    visibleToClient: true,
    uploadedByEmployeeId: OWNER,
    uploadedAtUtc: daysAgo(1, 16),
    reviewedByEmployeeId: null,
    reviewedAtUtc: null,
    internalNotes: null,
  }),
  row({
    id: "d_6",
    sizeBytes: 264770,
    caseId: CASES[2].id,
    fileName: "قرار-تسجيل-العلامة.pdf",
    status: "Reviewed",
    visibleToClient: true,
    uploadedByEmployeeId: LAWYER,
    uploadedAtUtc: daysAgo(14, 12),
    reviewedByEmployeeId: OWNER,
    reviewedAtUtc: daysAgo(13, 9),
    internalNotes: "معتمد ومرسل لبوابة العميل.",
  }),
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The mock filters server-side, the way the real endpoint will. */
function matches(document: DocumentRow, query: DocumentsQuery): boolean {
  if (query.caseId && document.caseId !== query.caseId) return false;
  if (query.status !== "all" && document.status !== query.status) return false;
  if (query.visibility === "client" && !document.visibleToClient) return false;
  if (query.visibility === "internal" && document.visibleToClient) return false;

  const term = query.search.trim().toLowerCase();
  if (!term) return true;
  return [document.fileName, document.caseNumber, document.caseTitle].some(
    (value) => value.toLowerCase().includes(term)
  );
}

export const mockDocumentsApi: DocumentsApi = {
  async list(query) {
    await wait(300);
    return {
      cases: CASES,
      documents: documents
        .filter((document) => matches(document, query))
        .sort((a, b) => b.uploadedAtUtc.localeCompare(a.uploadedAtUtc)),
    } satisfies DocumentsSummary;
  },

  async upload(input: UploadDocumentInput) {
    await wait(650);
    // A picked file stays in the browser: we keep its size and an object URL
    // so the drawer can open it. The real API stores metadata only.
    const created = row({
      id: `d_${Date.now()}`,
      caseId: input.caseId,
      fileName: input.fileName,
      sizeBytes: input.file?.size ?? null,
      previewUrl:
        input.file && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(input.file)
          : null,
      status: "Uploaded",
      visibleToClient: input.visibleToClient,
      uploadedByEmployeeId: OWNER,
      uploadedAtUtc: new Date().toISOString(),
      reviewedByEmployeeId: null,
      reviewedAtUtc: null,
      internalNotes: null,
    });
    documents = [created, ...documents];
    return created;
  },

  async review(documentId: string, input: ReviewDocumentInput) {
    await wait(500);
    const existing = documents.find((document) => document.id === documentId);
    if (!existing) throw new Error("Document was not found.");

    const reviewed = row({
      ...existing,
      status: "Reviewed",
      reviewedByEmployeeId: OWNER,
      reviewedAtUtc: new Date().toISOString(),
      internalNotes: input.internalNotes.trim() || existing.internalNotes,
    });
    documents = documents.map((document) =>
      document.id === documentId ? reviewed : document
    );
    return reviewed;
  },
};
