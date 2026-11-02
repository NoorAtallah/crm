/** What a signed-in client can see. Every route is ownership-scoped by the API. */
export interface PortalCase {
  id: string;
  caseNumber: string;
  title: string;
  isActive: boolean;
  stage: string;
  courtName: string | null;
  courtCaseNumber: string | null;
  createdAtUtc: string;
  assignedLawyerEmployeeId: string;
}

export interface PortalCaseFile {
  case: PortalCase;
  courtDivision: string | null;
  caseType: string | null;
  description: string | null;
  updatedAtUtc: string | null;
}

export interface PortalDocument {
  id: string;
  caseId: string;
  fileName: string | null;
  title: string | null;
  category: string | null;
  description: string | null;
  sizeBytes: number | null;
  contentUrl: string | null;
}

export interface PortalReport {
  id: string;
  caseId: string;
  title: string;
  publicSummary: string;
  approvedAtUtc: string | null;
}

export interface PortalAppointment {
  id: string;
  caseId: string;
  kind: "Hearing" | "Meeting";
  title: string;
  startsAtUtc: string;
  endsAtUtc: string;
  location: string | null;
  status: "Scheduled" | "Completed" | "Cancelled";
  outcome: string | null;
  cancellationReason: string | null;
}

export interface PortalTimelineEntry {
  id: string;
  kind: string;
  title: string | null;
  details: string | null;
  occurredAtUtc: string;
}

export interface PortalCommunication {
  id: string;
  channel: string;
  direction: "Inbound" | "Outbound";
  subject: string | null;
  body: string | null;
  occurredAtUtc: string;
}

export interface PortalInvoice {
  id: string;
  caseId: string | null;
  number: string;
  currency: string;
  issueOn: string;
  dueOn: string;
  total: number;
  paid: number;
  balance: number;
  status: "Draft" | "Issued" | "Void";
  isOverdue: boolean;
}

export interface PortalConsultation {
  id: string;
  subject: string;
  publicSummary: string;
  outcome: string | null;
  status: string;
  caseId: string | null;
}

export interface Paged<T> {
  items: T[];
  totalCount: number;
}
