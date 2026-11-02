import { http, httpBlob } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type { DecisionReport, PagedResult, ReportRevision } from "../types";
import type { DecisionReportsApi } from "./contract";

const BASE = "/api/legal-work/decision-reports";
const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const httpDecisionReportsApi: DecisionReportsApi = {
  search: (query) => http<PagedResult<DecisionReport>>(`${BASE}/search${toQuery(query)}`),
  list: (caseId) => http<DecisionReport[]>(`${BASE}${toQuery({ caseId })}`),
  get: (id) => http<DecisionReport>(`${BASE}/${id}`),
  create: (caseId, input) => http<DecisionReport>(BASE, json("POST", { caseId, ...input })),
  update: (id, input) => http<DecisionReport>(`${BASE}/${id}`, json("PUT", input)),
  approve: (id) => http<DecisionReport>(`${BASE}/${id}/approve`, json("POST")),
  returnForRevision: (id, notes) => http<DecisionReport>(`${BASE}/${id}/return`, json("POST", { notes })),
  reject: (id, notes) => http<DecisionReport>(`${BASE}/${id}/reject`, json("POST", { notes })),
  history: (id, page = 1) =>
    http<PagedResult<ReportRevision>>(`/api/legal-work/reports/${id}/history${toQuery({ page, pageSize: 50 })}`),
  exportPdf: (id) => httpBlob(`/api/exports/reports/${id}/document?format=Pdf`),
};
