import type { CaseTask, PagedResult, TaskDetails, TaskQuery, TaskStatus } from "../types";

export interface TasksApi {
  search(query: TaskQuery): Promise<PagedResult<CaseTask>>;
  get(taskId: string): Promise<CaseTask>;
  create(caseId: string, details: TaskDetails): Promise<CaseTask>;
  update(taskId: string, details: TaskDetails, version: string): Promise<CaseTask>;
  setStatus(taskId: string, status: TaskStatus, resolution: string | null, version: string): Promise<CaseTask>;
}
