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
