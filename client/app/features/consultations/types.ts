/**
 * Independent consultations (no case needed to start).
 *   GET  /api/consultations/search?clientId&status   → PagedResult<Consultation>
 *   GET|PUT /api/consultations/{id}                   ← { subject, publicSummary, internalNotes, version }
 *   POST /api/consultations                           ← { clientId, subject, publicSummary, internalNotes, officeId? }
 *   PUT  /api/consultations/{id}/lawyer               ← { lawyerId, version }
 *   POST /api/consultations/{id}/finish               ← { cancel, outcome, version }
 *   POST /api/consultations/{id}/convert-to-case      ← { caseNumber, title, version }
 * Requested → Assigned → Completed → Converted, or Cancelled while open.
 */
export type ConsultationStatus = "Requested" | "Assigned" | "Completed" | "Cancelled" | "Converted";
export const CONSULTATION_STATUSES: ConsultationStatus[] = ["Requested", "Assigned", "Completed", "Cancelled", "Converted"];

export interface Consultation {
  id: string;
  clientId: string;
  lawyerId: string | null;
  caseId: string | null;
  subject: string;
  publicSummary: string;
  internalNotes: string | null;
  outcome: string | null;
  status: ConsultationStatus;
  version: string;
  officeId: string | null;
}

export interface ConsultationInput {
  subject: string;
  publicSummary: string;
  internalNotes: string | null;
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

export interface PersonRef {
  id: string;
  fullName: string;
}
