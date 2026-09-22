/**
 * Dashboard domain. Shapes follow section 9 of the spec (التقارير الإدارية):
 * case counts, open cases, this week's hearings, progress rate, per-office
 * performance, and anything overdue or high priority.
 */

export type CaseStatus =
  | "new" // جديدة
  | "in_progress" // قيد المتابعة
  | "hearings" // جلسات
  | "awaiting_documents" // بانتظار مستندات
  | "awaiting_decision" // بانتظار قرار إداري
  | "closed"; // مغلقة

export type Priority = "high" | "medium" | "low";

export interface Metric {
  value: number;
  /** Change against the previous period, in percentage points. */
  delta?: number;
}

export interface DashboardMetrics {
  totalCases: Metric;
  openCases: Metric;
  hearingsThisWeek: Metric;
  averageProgress: Metric; // 0–100
  overdueInvoices: Metric;
  uncollected: Metric; // JOD
}

export interface CaseStatusCount {
  status: CaseStatus;
  count: number;
}

export interface Hearing {
  id: string;
  caseNumber: string; // e.g. C-2401
  caseTitle: string;
  clientName: string;
  lawyerName: string;
  officeName: string;
  startsAt: string; // ISO
  /** Two hearings for one lawyer at the same time — flagged, per section 5. */
  conflict: boolean;
}

/** Consultations sitting at "بانتظار اعتماد المدير" — the Last Decision queue. */
export interface PendingDecision {
  id: string;
  reference: string;
  subject: string;
  clientName: string;
  teamName: string;
  lawyerName: string;
  recommendation: string;
  waitingSince: string; // ISO
  priority: Priority;
}

export interface OfficePerformance {
  id: string;
  name: string;
  openCases: number;
  progress: number; // 0–100
  overdueCases: number;
}

export interface DashboardSummary {
  /** Every office the viewer may filter by. Never narrowed by the filter. */
  offices: Pick<OfficePerformance, "id" | "name">[];
  metrics: DashboardMetrics;
  caseStatusCounts: CaseStatusCount[];
  upcomingHearings: Hearing[];
  pendingDecisions: PendingDecision[];
  officePerformance: OfficePerformance[];
}

/** Filter applied to the whole dashboard. `null` office = every office. */
export interface DashboardQuery {
  officeId: string | null;
}