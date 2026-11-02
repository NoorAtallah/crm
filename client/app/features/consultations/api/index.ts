import { http } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type { Consultation, ConsultationInput, ConsultationStatus, PagedResult } from "../types";

const BASE = "/api/consultations";
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export interface ConsultationsApi {
  search(query: { clientId?: string; status?: ConsultationStatus; search?: string; page?: number; pageSize?: number }): Promise<PagedResult<Consultation>>;
  get(id: string): Promise<Consultation>;
  create(clientId: string, input: ConsultationInput, officeId?: string | null): Promise<Consultation>;
  update(id: string, input: ConsultationInput, version: string): Promise<Consultation>;
  assignLawyer(id: string, lawyerId: string, version: string): Promise<Consultation>;
  finish(id: string, cancel: boolean, outcome: string, version: string): Promise<Consultation>;
  convertToCase(id: string, caseNumber: string, title: string, version: string): Promise<Consultation>;
}

export const consultationsApi: ConsultationsApi = {
  search: (query) => http<PagedResult<Consultation>>(`${BASE}/search${toQuery(query)}`),
  get: (id) => http<Consultation>(`${BASE}/${id}`),
  create: (clientId, input, officeId) => http<Consultation>(BASE, json("POST", { clientId, ...input, officeId: officeId ?? null })),
  update: (id, input, version) => http<Consultation>(`${BASE}/${id}`, json("PUT", { ...input, version })),
  assignLawyer: (id, lawyerId, version) => http<Consultation>(`${BASE}/${id}/lawyer`, json("PUT", { lawyerId, version })),
  finish: (id, cancel, outcome, version) => http<Consultation>(`${BASE}/${id}/finish`, json("POST", { cancel, outcome, version })),
  convertToCase: (id, caseNumber, title, version) =>
    http<Consultation>(`${BASE}/${id}/convert-to-case`, json("POST", { caseNumber, title, version })),
};
