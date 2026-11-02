/**
 * Cases domain. Shapes follow the Legal CRM API:
 *   GET /api/legal-work/cases → LegalCaseResponse[]
 */

/** What the API returns for a case (LegalCaseResponse). */
export interface LegalCaseResponse {
  id: string;
  caseNumber: string;
  title: string;
  assignedLawyerEmployeeId: string;
  clientEmployeeId: string;
  createdByEmployeeId: string;
  isActive: boolean;
  createdAtUtc: string;
  stage: CaseStage;
  courtName: string | null;
  courtCaseNumber: string | null;
  officeId: string | null;
}

/** A case once the people on it have been resolved to names. */
export interface CaseRow extends LegalCaseResponse {
  lawyerName: string;
  clientName: string;
}

export interface CasesSummary {
  cases: CaseRow[];
}

/** Someone who can be put on a case. From GET /api/identity/employees. */
export interface PersonOption {
  id: string;
  fullName: string;
  type: "SuperAdmin" | "OfficeManager" | "Lawyer" | "Secretary" | "Client";
}

/** POST /api/legal-work/cases */
export interface CreateCaseInput {
  caseNumber: string;
  title: string;
  assignedLawyerEmployeeId: string;
  clientEmployeeId: string;
}

/* ───────────── Case detail (milestone 1: detailed case file) ───────────── */

export const CASE_STAGES = [
  "Intake",
  "Preparation",
  "Filed",
  "Hearings",
  "Judgment",
  "Appeal",
  "Enforcement",
] as const;
export type CaseStage = (typeof CASE_STAGES)[number];

export const PARTY_ROLES = [
  "Claimant",
  "Defendant",
  "Applicant",
  "Respondent",
  "ThirdParty",
  "Witness",
  "Expert",
  "Other",
] as const;
export type CasePartyRole = (typeof PARTY_ROLES)[number];

export type CaseTimelineKind =
  | "Note"
  | "Procedure"
  | "ProfileUpdated"
  | "StageChanged"
  | "PartyAdded"
  | "PartyUpdated"
  | "PartyArchived"
  | "CaseCreated"
  | "CaseUpdated"
  | "LawyerAssigned"
  | "CaseClosed"
  | "CaseReopened"
  | "AppointmentScheduled"
  | "AppointmentUpdated"
  | "AppointmentCancelled"
  | "AppointmentCompleted";

/** Only these two can be written by hand; the rest are system entries. */
export type ManualTimelineKind = "Note" | "Procedure";

/** Standard paged envelope from every `/search` and paged list route. */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** GET /api/legal-work/cases/{id}/file. `version` must go back on every write. */
export interface CaseFile {
  case: LegalCaseResponse;
  courtDivision: string | null;
  caseType: string | null;
  description: string | null;
  /** Staff only — clients never receive it. */
  internalNotes: string | null;
  updatedAtUtc: string | null;
  version: string;
}

/** PUT /file — omitted optional fields are cleared, so always send them all. */
export interface UpdateCaseFileInput {
  courtName: string | null;
  courtDivision: string | null;
  courtCaseNumber: string | null;
  caseType: string | null;
  description: string | null;
  internalNotes: string | null;
}

export interface CaseParty {
  id: string;
  role: CasePartyRole;
  name: string;
  isOrganization: boolean;
  representativeName: string | null;
  identifier: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  internalNotes: string | null;
  visibleToClient: boolean;
  isActive: boolean;
  archivedAtUtc: string | null;
}

export type CasePartyInput = Omit<CaseParty, "id" | "isActive" | "archivedAtUtc">;

export interface CaseTimelineEntry {
  id: string;
  kind: CaseTimelineKind;
  title: string | null;
  details: string | null;
  visibleToClient: boolean;
  occurredAtUtc: string;
  createdAtUtc: string;
  actorEmployeeId: string | null;
}

export interface AddTimelineInput {
  kind: ManualTimelineKind;
  title: string;
  details: string | null;
  visibleToClient: boolean;
  occurredAtUtc?: string;
}

export interface CaseSearchQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  clientId?: string;
  lawyerId?: string;
  stage?: CaseStage;
  courtName?: string;
}
