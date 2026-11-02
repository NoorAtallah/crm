/**
 * Case documents (not the personal file manager). Shapes follow the API:
 *   GET  /api/documents/search                     → PagedResult<CaseDocument>
 *   POST /api/documents/upload                     ← multipart caseId, visibleToClient, file
 *   GET  /api/documents/{id}  · /content           → CaseDocument · bytes
 *   PUT  /api/documents/{id}/metadata              ← { title, category, description, visibleToClient, version }
 *   PUT  /api/documents/{id}/archive               ← { isArchived, reason, version }
 *   POST /api/documents/{id}/review                ← { internalNotes, version }
 *   GET  /api/documents/{id}/versions              → DocumentVersion[]
 *   POST /api/documents/{id}/versions              ← multipart version, file
 *   GET  /api/documents/{id}/versions/{n}/content  → bytes
 * `version` is the document's own concurrency token (stale → 409);
 * `versionNumber` is the file content number (1, 2, 3…).
 */

export type DocumentStatus = "Uploaded" | "Reviewed";

export interface CaseDocument {
  id: string;
  caseId: string;
  fileName: string | null;
  status: DocumentStatus;
  visibleToClient: boolean;
  uploadedByEmployeeId: string;
  reviewedByEmployeeId: string | null;
  internalNotes: string | null;
  sizeBytes: number | null;
  contentUrl: string | null;
  title: string | null;
  category: string | null;
  description: string | null;
  isArchived: boolean;
  archivedAtUtc: string | null;
  archiveReason: string | null;
  versionNumber: number;
  version: string;
}

export interface DocumentVersion {
  versionNumber: number;
  fileName: string | null;
  sizeBytes: number;
  uploadedByEmployeeId: string;
  createdAtUtc: string;
  status: DocumentStatus;
  reviewedByEmployeeId: string | null;
  internalNotes: string | null;
  isCurrent: boolean;
  contentUrl: string | null;
}

export interface DocumentQuery {
  caseId?: string;
  isArchived?: boolean;
  category?: string;
  status?: DocumentStatus;
  visibleToClient?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface MetadataInput {
  title: string | null;
  category: string | null;
  description: string | null;
  visibleToClient: boolean;
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

/** Upload limit enforced by the API. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
