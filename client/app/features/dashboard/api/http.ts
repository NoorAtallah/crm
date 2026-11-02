import { http } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type { CaseStatus, DashboardSummary, Hearing, OfficePerformance, PendingDecision } from "../types";
import type { DashboardApi } from "./contract";

/**
 * Builds the dashboard from live endpoints. `/api/dashboard` gives the
 * scoped totals; cases, hearings, reports, offices and invoices fill in the
 * lists. Every call is already office/permission-scoped by the API, and a
 * section the viewer can't read just comes back empty.
 */

interface ApiDashboard {
  asOfUtc: string;
  activeCases: number;
  closedCases: number;
  upcomingAppointments: number;
  openTasks: number;
  overdueTasks: number;
  openConsultations: number;
  invoiceBalances: { currency: string; balance: number }[] | null;
}
interface ApiCase {
  id: string;
  caseNumber: string;
  title: string;
  assignedLawyerEmployeeId: string;
  clientEmployeeId: string;
  isActive: boolean;
  stage: string;
  officeId: string | null;
}
interface ApiAppointment {
  id: string;
  caseId: string;
  kind: string;
  title: string;
  startsAtUtc: string;
  endsAtUtc: string;
  assignedLawyerEmployeeId: string | null;
  status: string;
}
interface ApiReport {
  id: string;
  caseId: string;
  title: string;
  publicSummary: string;
  status: string;
  reviewedAtUtc: string | null;
}
interface Paged<T> {
  items: T[];
  totalCount: number;
}

const STAGES = ["Intake", "Preparation", "Filed", "Hearings", "Judgment", "Appeal", "Enforcement"];

/** Backend stages → the dashboard's status buckets. */
function statusOf(c: ApiCase): CaseStatus {
  if (!c.isActive) return "closed";
  switch (c.stage) {
    case "Intake":
      return "new";
    case "Hearings":
      return "hearings";
    case "Judgment":
    case "Appeal":
      return "awaiting_decision";
    default:
      return "in_progress";
  }
}

/** Progress = how far along the 7 stages; closed cases count as done. */
const progressOf = (c: ApiCase) => (c.isActive ? (Math.max(0, STAGES.indexOf(c.stage)) / (STAGES.length - 1)) * 100 : 100);
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const safe = <T>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

export const httpDashboardApi: DashboardApi = {
  async getSummary({ officeId }) {
    const now = new Date();
    const in14 = new Date(now.getTime() + 14 * 864e5);
    const in7 = new Date(now.getTime() + 7 * 864e5);

    const [totals, cases, people, offices, hearings, drafts, overdueInvoices, overdueTasks] = await Promise.all([
      safe(http<ApiDashboard>(`/api/dashboard${toQuery({ days: 30 })}`), {
        asOfUtc: new Date().toISOString(),
        activeCases: 0,
        closedCases: 0,
        upcomingAppointments: 0,
        openTasks: 0,
        overdueTasks: 0,
        openConsultations: 0,
        invoiceBalances: [],
      } as ApiDashboard),
      safe(http<ApiCase[]>("/api/legal-work/cases"), []),
      safe(http<{ id: string; fullName: string }[]>("/api/identity/employees"), []),
      safe(http<Paged<{ id: string; name: string; isActive: boolean }>>("/api/offices?pageSize=100"), { items: [], totalCount: 0 }),
      safe(
        http<Paged<ApiAppointment>>(
          `/api/legal-work/appointments/search${toQuery({ kind: "Hearing", status: "Scheduled", fromUtc: now.toISOString(), toUtc: in14.toISOString(), pageSize: 100 })}`
        ),
        { items: [], totalCount: 0 }
      ),
      safe(http<Paged<ApiReport>>(`/api/legal-work/decision-reports/search${toQuery({ status: "Draft", pageSize: 10 })}`), { items: [], totalCount: 0 }),
      safe(http<Paged<unknown>>(`/api/finance/invoices${toQuery({ overdue: true, pageSize: 1 })}`), { items: [], totalCount: 0 }),
      safe(http<Paged<{ caseId: string }>>(`/api/tasks/search${toQuery({ overdue: true, pageSize: 100 })}`), { items: [], totalCount: 0 }),
    ]);

    const name = new Map(people.map((p) => [p.id, p.fullName]));
    const officeName = new Map(offices.items.map((o) => [o.id, o.name]));
    const caseById = new Map(cases.map((c) => [c.id, c]));

    // Office filter narrows the lists we can attribute to an office.
    const inOffice = (c: ApiCase | undefined) => !officeId || c?.officeId === officeId;
    const scopedCases = cases.filter(inOffice);

    /* metrics */
    const jod = totals.invoiceBalances?.find((b) => b.currency === "JOD")?.balance ?? 0;
    const hearingsThisWeek = hearings.items.filter((h) => new Date(h.startsAtUtc) < in7 && inOffice(caseById.get(h.caseId))).length;
    const openCases = officeId ? scopedCases.filter((c) => c.isActive).length : totals.activeCases;
    const totalCases = officeId ? scopedCases.length : totals.activeCases + totals.closedCases;

    /* status chart */
    const counts = new Map<CaseStatus, number>();
    scopedCases.forEach((c) => counts.set(statusOf(c), (counts.get(statusOf(c)) ?? 0) + 1));
    const order: CaseStatus[] = ["new", "in_progress", "hearings", "awaiting_documents", "awaiting_decision", "closed"];

    /* hearings + lawyer double-booking */
    const upcoming: Hearing[] = hearings.items
      .filter((h) => inOffice(caseById.get(h.caseId)))
      .map((h) => {
        const c = caseById.get(h.caseId);
        const conflict = hearings.items.some(
          (o) =>
            o.id !== h.id &&
            o.assignedLawyerEmployeeId &&
            o.assignedLawyerEmployeeId === h.assignedLawyerEmployeeId &&
            new Date(o.startsAtUtc) < new Date(h.endsAtUtc) &&
            new Date(h.startsAtUtc) < new Date(o.endsAtUtc)
        );
        return {
          id: h.id,
          caseNumber: c?.caseNumber ?? "—",
          caseTitle: h.title || c?.title || "—",
          clientName: (c && name.get(c.clientEmployeeId)) ?? "—",
          lawyerName: (h.assignedLawyerEmployeeId && name.get(h.assignedLawyerEmployeeId)) ?? "—",
          officeName: (c?.officeId && officeName.get(c.officeId)) ?? "—",
          startsAt: h.startsAtUtc,
          conflict,
        };
      })
      .slice(0, 8);

    /* reports awaiting approval — the first revision tells us how long they've waited */
    const scopedDrafts = drafts.items.filter((r) => inOffice(caseById.get(r.caseId))).slice(0, 5);
    const since = await Promise.all(
      scopedDrafts.map((r) =>
        safe(
          http<Paged<{ recordedAtUtc: string; revision: number }>>(`/api/legal-work/reports/${r.id}/history?pageSize=100`).then(
            (h) => h.items.reduce((min, x) => (x.recordedAtUtc < min ? x.recordedAtUtc : min), now.toISOString())
          ),
          now.toISOString()
        )
      )
    );
    const pendingDecisions: PendingDecision[] = scopedDrafts.map((r, i) => {
      const c = caseById.get(r.caseId);
      const days = (now.getTime() - new Date(since[i]).getTime()) / 864e5;
      return {
        id: r.id,
        reference: c?.caseNumber ?? "—",
        subject: r.title,
        clientName: (c && name.get(c.clientEmployeeId)) ?? "—",
        teamName: (c?.officeId && officeName.get(c.officeId)) ?? "—",
        lawyerName: (c && name.get(c.assignedLawyerEmployeeId)) ?? "—",
        recommendation: r.publicSummary,
        waitingSince: since[i],
        priority: days > 7 ? "high" : days > 2 ? "medium" : "low",
      };
    });

    /* per office */
    const overdueByCase = new Map<string, number>();
    overdueTasks.items.forEach((x) => overdueByCase.set(x.caseId, (overdueByCase.get(x.caseId) ?? 0) + 1));
    const officePerformance: OfficePerformance[] = offices.items
      .filter((o) => o.isActive && (!officeId || o.id === officeId))
      .map((o) => {
        const own = cases.filter((c) => c.officeId === o.id);
        return {
          id: o.id,
          name: o.name,
          openCases: own.filter((c) => c.isActive).length,
          progress: avg(own.map(progressOf)),
          overdueCases: own.filter((c) => overdueByCase.has(c.id)).length,
        };
      });

    const summary: DashboardSummary = {
      offices: offices.items.filter((o) => o.isActive).map((o) => ({ id: o.id, name: o.name })),
      metrics: {
        totalCases: { value: totalCases },
        openCases: { value: openCases },
        hearingsThisWeek: { value: hearingsThisWeek },
        averageProgress: { value: avg(scopedCases.map(progressOf)) },
        overdueInvoices: { value: overdueInvoices.totalCount },
        uncollected: { value: jod },
      },
      caseStatusCounts: order.map((status) => ({ status, count: counts.get(status) ?? 0 })),
      upcomingHearings: upcoming,
      pendingDecisions,
      officePerformance,
    };
    return summary;
  },
};
