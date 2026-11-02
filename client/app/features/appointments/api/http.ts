import { http } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type { AppointmentMutation, CaseAppointment, PagedResult } from "../types";
import type { AppointmentsApi } from "./contract";

const BASE = "/api/legal-work";
const at = (caseId: string, id?: string) => `${BASE}/cases/${caseId}/appointments${id ? `/${id}` : ""}`;
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const httpAppointmentsApi: AppointmentsApi = {
  search: (query) => http<PagedResult<CaseAppointment>>(`${BASE}/appointments/search${toQuery(query)}`),
  get: (caseId, id) => http<AppointmentMutation>(at(caseId, id)),
  async caseVersion(caseId) {
    const file = await http<{ version: string }>(`${BASE}/cases/${caseId}/file`);
    return file.version;
  },
  schedule: (caseId, appointment, version) =>
    http<AppointmentMutation>(at(caseId), json("POST", { appointment, version })),
  update: (caseId, id, appointment, reason, version) =>
    http<AppointmentMutation>(at(caseId, id), json("PUT", { appointment, reason, version })),
  cancel: (caseId, id, reason, version) =>
    http<AppointmentMutation>(`${at(caseId, id)}/cancel`, json("POST", { reason, version })),
  complete: (caseId, id, outcome, followUp, version) =>
    http<AppointmentMutation>(`${at(caseId, id)}/complete`, json("POST", { outcome, followUp, version })),
};
