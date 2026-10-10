import type { CaseRow, CasesSummary, CreateCaseInput, PersonOption } from "../types";

export interface CasesApi {
  list(): Promise<CasesSummary>;
  /** Lawyers and clients to pick from. Empty when the viewer lacks `employees.read`. */
  people(): Promise<PersonOption[]>;
  create(input: CreateCaseInput, people: PersonOption[]): Promise<CaseRow>;
}
