import { http } from "../../../lib/http";
import type {
  CaseRow,
  CasesSummary,
  CreateCaseInput,
  LegalCaseResponse,
  PersonOption,
} from "../types";
import type { CasesApi } from "./contract";

const CASES = "/api/legal-work/cases";
const EMPLOYEES = "/api/identity/employees";

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
    const [cases, employees] = await Promise.all([
      http<LegalCaseResponse[]>(CASES),
      fetchPeople(),
    ]);
    const people = new Map(employees.map((item) => [item.id, item.fullName]));
    return { cases: cases.map((item) => toRow(item, people)) };
  },

  people: fetchPeople,

  async create(input: CreateCaseInput, people: PersonOption[]): Promise<CaseRow> {
    const created = await http<LegalCaseResponse>(CASES, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return toRow(created, new Map(people.map((item) => [item.id, item.fullName])));
  },
};
