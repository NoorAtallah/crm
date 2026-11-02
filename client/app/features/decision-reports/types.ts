/**
 * Decision reports on a case. Shapes follow the API:
 *   GET  /api/legal-work/decision-reports/search?caseId&status  → PagedResult<DecisionReport>
 *   POST /api/legal-work/decision-reports                       ← { caseId, title, publicSummary, internalAnalysis }
 *   GET|PUT /api/legal-work/decision-reports/{id}
 *   POST .../{id}/approve · /return {notes} · /reject {notes}
 *   GET  /api/legal-work/reports/{id}/history                   → PagedResult<ReportRevision>
 *   GET  /api/exports/reports/{id}/document?format=Pdf          → PDF
 * Draft → Approved | ReturnedForRevision | Rejected. Editing a returned
 * report puts it back to Draft. Approved/Rejected are final.
 */

export type ReportStatus = "Draft" | "Approved" | "ReturnedForRevision" | "Rejected";

export interface DecisionReport {
  id: string;
  caseId: string;
  title: string;
  publicSummary: string;
  internalAnalysis: string | null;
  status: ReportStatus;
  approvedByEmployeeId: string | null;
  approvedAtUtc: string | null;
  reviewNotes: string | null;
  reviewedByEmployeeId: string | null;
  reviewedAtUtc: string | null;
}

export interface ReportInput {
  title: string;
  publicSummary: string;
  internalAnalysis: string;
}

export interface ReportRevision {
  revision: number;
  actorId: string;
  action: string | null;
  title: string | null;
  publicSummary: string | null;
  internalAnalysis: string | null;
  status: ReportStatus;
  reviewNotes: string | null;
  reviewerId: string | null;
  recordedAtUtc: string;
}

export interface ReportQuery {
  caseId?: string;
  status?: ReportStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
