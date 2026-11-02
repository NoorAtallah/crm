import type { DecisionReport, PagedResult, ReportInput, ReportQuery, ReportRevision } from "../types";

export interface DecisionReportsApi {
  search(query: ReportQuery): Promise<PagedResult<DecisionReport>>;
  /** Legacy unpaged list, optionally for one case. */
  list(caseId?: string): Promise<DecisionReport[]>;
  get(reportId: string): Promise<DecisionReport>;
  create(caseId: string, input: ReportInput): Promise<DecisionReport>;
  update(reportId: string, input: ReportInput): Promise<DecisionReport>;
  approve(reportId: string): Promise<DecisionReport>;
  returnForRevision(reportId: string, notes: string): Promise<DecisionReport>;
  reject(reportId: string, notes: string): Promise<DecisionReport>;
  history(reportId: string, page?: number): Promise<PagedResult<ReportRevision>>;
  exportPdf(reportId: string): Promise<Blob>;
}
