import { http } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type {
  CaseFile,
  CaseParty,
  CaseRow,
  CasesSummary,
  CaseTimelineEntry,
  CreateCaseInput,
  LegalCaseResponse,
  PagedResult,
  PersonOption,
} from "../types";
import type { CasesApi } from "./contract";

const CASES = "/api/legal-work/cases";
const EMPLOYEES = "/api/identity/employees";

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

function toRow(item: LegalCaseResponse, people: Map<string, string>): CaseRow {
  return {
    ...item,
    lawyerName: people.get(item.assignedLawyerEmployeeId) ?? "—",
    clientName: people.get(item.clientEmployeeId) ?? "—",
  };
}

/** Needs `employees.read`; lawyers and secretaries get an empty list, not an error. */
function fetchPeople(): Promise<PersonOption[]> {
  return http<PersonOption[]>(EMPLOYEES).catch(() => []);
}

export const httpCasesApi: CasesApi = {
  async list(): Promise<CasesSummary> {
    const [cases, employees] = await Promise.all([http<LegalCaseResponse[]>(CASES), fetchPeople()]);
    const people = new Map(employees.map((item) => [item.id, item.fullName]));
    return { cases: cases.map((item) => toRow(item, people)) };
  },

  search: (query) => http<PagedResult<LegalCaseResponse>>(`${CASES}/search${toQuery(query)}`),

  people: fetchPeople,

  async create(input: CreateCaseInput, people: PersonOption[]): Promise<CaseRow> {
    const created = await http<LegalCaseResponse>(CASES, json("POST", input));
    return toRow(created, new Map(people.map((item) => [item.id, item.fullName])));
  },

  get: (caseId) => http<LegalCaseResponse>(`${CASES}/${caseId}`),
  update: (caseId, input) => http<LegalCaseResponse>(`${CASES}/${caseId}`, json("PUT", input)),
  assignLawyer: (caseId, lawyerEmployeeId) =>
    http<LegalCaseResponse>(`${CASES}/${caseId}/lawyer`, json("PUT", { lawyerEmployeeId })),
  setStatus: (caseId, isActive) => http<LegalCaseResponse>(`${CASES}/${caseId}/status`, json("PUT", { isActive })),
  setOffice: (caseId, officeId, version) =>
    http<LegalCaseResponse>(`${CASES}/${caseId}/office`, json("PUT", { officeId, version })),

  file: (caseId) => http<CaseFile>(`${CASES}/${caseId}/file`),
  updateFile: (caseId, input, version) => http<CaseFile>(`${CASES}/${caseId}/file`, json("PUT", { ...input, version })),
  changeStage: (caseId, stage, reason, version) =>
    http<CaseFile>(`${CASES}/${caseId}/file/stage`, json("PUT", { stage, reason, version })),

  parties: (caseId, query = {}) =>
    http<PagedResult<CaseParty>>(`${CASES}/${caseId}/file/parties${toQuery(query)}`),
  async addParty(caseId, input, version) {
    const res = await http<{ party: CaseParty; version: string }>(
      `${CASES}/${caseId}/file/parties`,
      json("POST", { ...input, version })
    );
    return { value: res.party, version: res.version };
  },
  async updateParty(caseId, partyId, input, version) {
    const res = await http<{ party: CaseParty; version: string }>(
      `${CASES}/${caseId}/file/parties/${partyId}`,
      json("PUT", { ...input, version })
    );
    return { value: res.party, version: res.version };
  },
  async archiveParty(caseId, partyId, version) {
    const res = await http<{ party: CaseParty; version: string }>(
      `${CASES}/${caseId}/file/parties/${partyId}/archive`,
      json("POST", { version })
    );
    return { value: res.party, version: res.version };
  },

  timeline: (caseId, query = {}) =>
    http<PagedResult<CaseTimelineEntry>>(`${CASES}/${caseId}/file/timeline${toQuery(query)}`),
  async addTimeline(caseId, input, version) {
    const res = await http<{ entry: CaseTimelineEntry; version: string }>(
      `${CASES}/${caseId}/file/timeline`,
      json("POST", { ...input, version })
    );
    return { value: res.entry, version: res.version };
  },
};
