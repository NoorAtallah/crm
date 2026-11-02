/**
 * Case hearings & meetings. Shapes follow the Legal CRM API:
 *   GET  /api/legal-work/appointments/search                         → PagedResult<CaseAppointment>
 *   GET  /api/legal-work/cases/{caseId}/appointments/{id}            → AppointmentMutation
 *   POST /api/legal-work/cases/{caseId}/appointments                 ← { appointment, version }
 *   PUT  /api/legal-work/cases/{caseId}/appointments/{id}            ← { appointment, reason, version }
 *   POST .../{id}/cancel                                             ← { reason, version }
 *   POST .../{id}/complete                                           ← { outcome, version, followUp? }
 * Every write needs the case file `version` (base64). Stale → 409.
 */

export type AppointmentKind = "Hearing" | "Meeting";
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

export interface CaseAppointment {
  id: string;
  caseId: string;
  kind: AppointmentKind;
  title: string;
  startsAtUtc: string;
  endsAtUtc: string;
  location: string | null;
  /** Omitted for clients. */
  assignedLawyerEmployeeId: string | null;
  internalNotes: string | null;
  visibleToClient: boolean;
  status: AppointmentStatus;
  outcome: string | null;
  cancellationReason: string | null;
  completedAtUtc: string | null;
  previousAppointmentId: string | null;
}

/** The editable part — same shape for schedule, update and follow-up. */
export interface AppointmentDetails {
  kind: AppointmentKind;
  title: string;
  startsAtUtc: string;
  endsAtUtc: string;
  location: string | null;
  assignedLawyerEmployeeId: string;
  internalNotes: string | null;
  visibleToClient: boolean;
}

export interface AppointmentMutation {
  appointment: CaseAppointment;
  version: string;
  followUp: CaseAppointment | null;
}

export interface AppointmentQuery {
  caseId?: string;
  lawyerId?: string;
  kind?: AppointmentKind;
  status?: AppointmentStatus;
  fromUtc?: string;
  toUtc?: string;
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

/** A case to pick when scheduling from the calendar. */
export interface CaseOption {
  id: string;
  caseNumber: string;
  title: string;
  assignedLawyerEmployeeId: string;
  isActive: boolean;
}

export interface LawyerOption {
  id: string;
  fullName: string;
}
