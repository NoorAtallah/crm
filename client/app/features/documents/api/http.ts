import { http } from "../../../lib/http";
import type {
  CaseRef,
  DocumentResponse,
  DocumentRow,
  DocumentsQuery,
  DocumentsSummary,
  ReviewDocumentInput,
  UploadDocumentInput,
} from "../types";
import type { DocumentsApi } from "./contract";

/**
 * Live implementation. Base URL comes from NEXT_PUBLIC_API_URL
 * (development: http://localhost:5052).
 *
 * The list call is an assumption — see the note in `../types.ts`. If the
 * backend exposes documents per case instead, this is the only file to change.
 */

const DOCUMENTS = "/api/legal-work/documents";
const CASES = "/api/legal-work/cases";

interface LegalCaseResponse {
  id: string;
  caseNumber: string;
  title: string;
}

interface EmployeeResponse {
  id: string;
  fullName: string;
}

/**
 * The API returns ids, the table shows names. Until the backend expands
 * them, they are resolved client-side against cases and employees.
 */
function toRow(
  document: DocumentResponse,
  cases: Map<string, LegalCaseResponse>,
  people: Map<string, string>
): DocumentRow {
  const legalCase = cases.get(document.caseId);

  return {
    ...document,
    caseNumber: legalCase?.caseNumber ?? "—",
    caseTitle: legalCase?.title ?? "—",
    uploadedByName: people.get(document.uploadedByEmployeeId) ?? "—",
    reviewedByName: document.reviewedByEmployeeId
      ? people.get(document.reviewedByEmployeeId) ?? "—"
      : null,
    uploadedAtUtc: document.uploadedAtUtc ?? new Date().toISOString(),
    reviewedAtUtc: document.reviewedAtUtc ?? null,
    sizeBytes: null,
    previewUrl: null,
  };
}

export const httpDocumentsApi: DocumentsApi = {
  async list(query: DocumentsQuery): Promise<DocumentsSummary> {
    const params = new URLSearchParams();
    if (query.caseId) params.set("caseId", query.caseId);
    if (query.status !== "all") params.set("status", query.status);

    const [documents, cases, employees] = await Promise.all([
      http<DocumentResponse[]>(`${DOCUMENTS}?${params}`),
      http<LegalCaseResponse[]>(CASES),
      http<EmployeeResponse[]>("/api/identity/employees"),
    ]);

    const caseMap = new Map(cases.map((item) => [item.id, item]));
    const peopleMap = new Map(employees.map((item) => [item.id, item.fullName]));

    return {
      cases: cases.map(
        ({ id, caseNumber, title }): CaseRef => ({ id, caseNumber, title })
      ),
      documents: documents.map((document) =>
        toRow(document, caseMap, peopleMap)
      ),
    };
  },

  async upload(input: UploadDocumentInput): Promise<DocumentRow> {
    // The documented body is metadata only — the picked file stays local.
    const { caseId, fileName, visibleToClient } = input;
    const created = await http<DocumentResponse>(DOCUMENTS, {
      method: "POST",
      body: JSON.stringify({ caseId, fileName, visibleToClient }),
    });
    return toRow(created, new Map(), new Map());
  },

  async review(
    documentId: string,
    input: ReviewDocumentInput
  ): Promise<DocumentRow> {
    const reviewed = await http<DocumentResponse>(
      `${DOCUMENTS}/${documentId}/review`,
      { method: "POST", body: JSON.stringify(input) }
    );
    return toRow(reviewed, new Map(), new Map());
  },
};
