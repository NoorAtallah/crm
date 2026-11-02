import { http, httpBlob } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type {
  Paged,
  PortalAppointment,
  PortalCase,
  PortalCaseFile,
  PortalCommunication,
  PortalConsultation,
  PortalDocument,
  PortalInvoice,
  PortalReport,
  PortalTimelineEntry,
} from "../types";

const empty = <T>(): Paged<T> => ({ items: [], totalCount: 0 });
const safe = <T>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

/**
 * Client-portal reads. Each one is scoped to the signed-in client by the API,
 * which also strips internal notes, hidden records and staff-only fields.
 * A section the client can't read comes back empty rather than failing.
 */
export const portalApi = {
  myCases: () => http<PortalCase[]>("/api/clients/me/cases"),

  caseFile: (caseId: string) => http<PortalCaseFile>(`/api/legal-work/cases/${caseId}/file`),
  portal: (caseId: string) =>
    safe(http<{ caseId: string; documents: PortalDocument[]; approvedReports: PortalReport[] }>(`/api/clients/me/cases/${caseId}/portal`), {
      caseId,
      documents: [],
      approvedReports: [],
    }),
  timeline: (caseId: string) => safe(http<Paged<PortalTimelineEntry>>(`/api/legal-work/cases/${caseId}/file/timeline?pageSize=50`), empty<PortalTimelineEntry>()),
  communications: (caseId: string) => safe(http<Paged<PortalCommunication>>(`/api/communications/search${toQuery({ caseId, pageSize: 50 })}`), empty<PortalCommunication>()),

  appointments: (q: { caseId?: string; fromUtc?: string; status?: string; pageSize?: number }) =>
    safe(http<Paged<PortalAppointment>>(`/api/legal-work/appointments/search${toQuery({ pageSize: 50, ...q })}`), empty<PortalAppointment>()),
  invoices: (q: { caseId?: string } = {}) => safe(http<Paged<PortalInvoice>>(`/api/finance/invoices${toQuery({ pageSize: 50, ...q })}`), empty<PortalInvoice>()),
  consultations: () => safe(http<Paged<PortalConsultation>>("/api/consultations/search?pageSize=50"), empty<PortalConsultation>()),

  downloadDocument: (id: string) => httpBlob(`/api/documents/${id}/content`),
  reportPdf: (id: string) => httpBlob(`/api/exports/reports/${id}/document?format=Pdf`),
  invoicePdf: (id: string) => httpBlob(`/api/exports/invoices/${id}/document?format=Pdf`),
};
