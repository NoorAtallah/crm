/**
 * Documents domain. Shapes follow the Legal CRM API documentation
 * (Legal Work APIs → Upload Document / Review Document).
 *
 * Note: the API doc defines POST /api/legal-work/documents and
 * POST /api/legal-work/documents/{id}/review, but no list endpoint —
 * even though `documents.read.own` / `documents.read.all` exist in the
 * permissions table. `api/http.ts` assumes GET /api/legal-work/documents;
 * confirm the URL with the backend before flipping `api/index.ts`.
 */

import type { Role } from "../auth";

/** DocumentStatus enum, verbatim from the API doc. */
export type DocumentStatus = "Uploaded" | "Reviewed";

/** What the API returns for a document (DocumentResponse). */
export interface DocumentResponse {
  id: string;
  caseId: string;
  fileName: string;
  status: DocumentStatus;
  visibleToClient: boolean;
  uploadedByEmployeeId: string;
  reviewedByEmployeeId: string | null;
  internalNotes: string | null;
  /** Not in the documented response yet — optional until the backend adds it. */
  uploadedAtUtc?: string;
  reviewedAtUtc?: string | null;
}

/** A document once the case and the people on it have been resolved to names. */
export interface DocumentRow extends DocumentResponse {
  caseNumber: string;
  caseTitle: string;
  uploadedByName: string;
  reviewedByName: string | null;
  uploadedAtUtc: string;
  reviewedAtUtc: string | null;
  /** Byte size of the picked file. Local only — the API stores no binary. */
  sizeBytes: number | null;
  /**
   * Object URL for a file picked in this browser session, so the drawer can
   * open it. Never sent anywhere, and gone on reload.
   */
  previewUrl: string | null;
}

/** Cases the viewer may file documents against — fills the filter and the dialog. */
export interface CaseRef {
  id: string;
  caseNumber: string;
  title: string;
}

export type VisibilityFilter = "all" | "client" | "internal";
export type StatusFilter = "all" | DocumentStatus;

export interface DocumentsQuery {
  caseId: string | null;
  status: StatusFilter;
  visibility: VisibilityFilter;
  /** Matches file name, case number or case title. */
  search: string;
}

export const emptyQuery: DocumentsQuery = {
  caseId: null,
  status: "all",
  visibility: "all",
  search: "",
};

export interface DocumentsSummary {
  cases: CaseRef[];
  documents: DocumentRow[];
}

/**
 * POST /api/legal-work/documents — the API takes metadata only.
 * `file` is picked in the browser and never leaves it: the mock keeps it so
 * the page behaves like a real document store, and `http.ts` drops it.
 * When the backend accepts a binary, send this as multipart there.
 */
export interface UploadDocumentInput {
  caseId: string;
  fileName: string;
  visibleToClient: boolean;
  file?: File | null;
}

/** POST /api/legal-work/documents/{documentId}/review */
export interface ReviewDocumentInput {
  internalNotes: string;
}

/**
 * What this page's actions need, in the API's permission keys.
 * Until the session carries `permissions[]` from /api/auth/login, they are
 * derived from the role we already have. One place to change later.
 */
export interface DocumentAbilities {
  canUpload: boolean; // documents.upload
  canReview: boolean; // documents.review
  canReadAll: boolean; // documents.read.all vs documents.read.own
}

export function abilitiesForRole(role: Role): DocumentAbilities {
  switch (role) {
    case "owner":
      return { canUpload: true, canReview: true, canReadAll: true };
    case "branch_manager":
      return { canUpload: true, canReview: true, canReadAll: true };
    case "lawyer":
      return { canUpload: true, canReview: true, canReadAll: false };
    case "secretary":
      return { canUpload: true, canReview: false, canReadAll: false };
    case "client":
      return { canUpload: false, canReview: false, canReadAll: false };
  }
}
