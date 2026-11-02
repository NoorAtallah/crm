import type {
  AddTimelineInput,
  CaseFile,
  CaseParty,
  CasePartyInput,
  CasePartyRole,
  CaseRow,
  CaseSearchQuery,
  CasesSummary,
  CaseStage,
  CaseTimelineEntry,
  CaseTimelineKind,
  CreateCaseInput,
  LegalCaseResponse,
  PagedResult,
  PersonOption,
  UpdateCaseFileInput,
} from "../types";

/** Write results that move the case row version. Use `version` for the next write. */
export interface Versioned<T> {
  value: T;
  version: string;
}

export interface CasesApi {
  list(): Promise<CasesSummary>;
  /** Paged, filtered list — GET /cases/search. */
  search(query: CaseSearchQuery): Promise<PagedResult<LegalCaseResponse>>;
  /** Lawyers and clients to pick from. Empty when the viewer lacks `employees.read`. */
  people(): Promise<PersonOption[]>;
  create(input: CreateCaseInput, people: PersonOption[]): Promise<CaseRow>;

  get(caseId: string): Promise<LegalCaseResponse>;
  update(caseId: string, input: { caseNumber: string; title: string }): Promise<LegalCaseResponse>;
  assignLawyer(caseId: string, lawyerEmployeeId: string): Promise<LegalCaseResponse>;
  setStatus(caseId: string, isActive: boolean): Promise<LegalCaseResponse>;
  setOffice(caseId: string, officeId: string, version: string): Promise<LegalCaseResponse>;

  file(caseId: string): Promise<CaseFile>;
  updateFile(caseId: string, input: UpdateCaseFileInput, version: string): Promise<CaseFile>;
  changeStage(caseId: string, stage: CaseStage, reason: string, version: string): Promise<CaseFile>;

  parties(
    caseId: string,
    query?: { page?: number; pageSize?: number; search?: string; role?: CasePartyRole; includeArchived?: boolean }
  ): Promise<PagedResult<CaseParty>>;
  addParty(caseId: string, input: CasePartyInput, version: string): Promise<Versioned<CaseParty>>;
  updateParty(caseId: string, partyId: string, input: CasePartyInput, version: string): Promise<Versioned<CaseParty>>;
  archiveParty(caseId: string, partyId: string, version: string): Promise<Versioned<CaseParty>>;

  timeline(
    caseId: string,
    query?: { page?: number; pageSize?: number; search?: string; kind?: CaseTimelineKind }
  ): Promise<PagedResult<CaseTimelineEntry>>;
  addTimeline(caseId: string, input: AddTimelineInput, version: string): Promise<Versioned<CaseTimelineEntry>>;
}
