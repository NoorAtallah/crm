/**
 * Clients domain. Shapes follow the Legal CRM API:
 *
 *   POST /api/clients                               ← CreateClientRequest   (employees.manage)
 *   GET  /api/clients                               → ClientResponse[]      (employees.read)
 *   GET  /api/clients/{id}                          → ClientResponse
 *   GET  /api/clients/{id}/cases                    → LegalCaseResponse[]   (cases.read.all)
 *   GET  /api/clients/me/cases                      → LegalCaseResponse[]   (client portal)
 *   GET  /api/clients/me/cases/{caseId}/portal      → ClientCasePortalResponse
 */

export interface Client {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  isActive: boolean;
}

/** Free text on the API (≤ 50 chars); these are the values the UI offers. */
export type ClientType = "Individual" | "Company";
export const CLIENT_TYPES: ClientType[] = ["Individual", "Company"];

export interface CreateClientInput {
  fullName: string;
  email: string;
  password: string;
  clientType: ClientType;
}

export interface ClientCase {
  id: string;
  caseNumber: string;
  title: string;
  assignedLawyerEmployeeId: string;
  clientEmployeeId: string;
  createdByEmployeeId: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface PortalDocument {
  id: string;
  caseId: string;
  fileName: string;
  status: "Uploaded" | "Reviewed";
  visibleToClient: boolean;
  uploadedByEmployeeId: string;
  reviewedByEmployeeId: string | null;
  internalNotes: string | null;
}

export interface PortalReport {
  id: string;
  caseId: string;
  title: string;
  publicSummary: string;
  internalAnalysis: string | null;
  status: "Draft" | "Approved";
  approvedByEmployeeId: string | null;
  approvedAtUtc: string | null;
}

export interface ClientCasePortal {
  caseId: string;
  documents: PortalDocument[];
  approvedReports: PortalReport[];
}

export interface ClientsAbilities {
  canRead: boolean; // employees.read
  canCreate: boolean; // employees.manage
  canReadCases: boolean; // cases.read.all
}

export function clientAbilitiesFor(user: {
  permissions: string[];
  isSuperAdmin: boolean;
}): ClientsAbilities {
  const has = (key: string) => user.isSuperAdmin || user.permissions.includes(key);
  return {
    canRead: has("employees.read"),
    canCreate: has("employees.manage"),
    canReadCases: has("cases.read.all"),
  };
}
