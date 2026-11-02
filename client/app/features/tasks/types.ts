/**
 * Case tasks. Shapes follow the API:
 *   GET  /api/tasks/search       → PagedResult<CaseTask>
 *   GET  /api/tasks/{id}         → CaseTask
 *   POST /api/tasks              ← { caseId, details }
 *   PUT  /api/tasks/{id}         ← { details, version }
 *   PUT  /api/tasks/{id}/status  ← { status, resolution, version }
 * Completed/Cancelled need a resolution and are final. `version` is the
 * task's own concurrency token (stale → 409).
 */

export type TaskStatus = "Open" | "InProgress" | "Completed" | "Cancelled";
export type TaskPriority = "Low" | "Normal" | "High" | "Urgent";

export const TASK_STATUSES: TaskStatus[] = ["Open", "InProgress", "Completed", "Cancelled"];
export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Normal", "High", "Urgent"];

export interface CaseTask {
  id: string;
  caseId: string;
  title: string;
  description: string | null;
  assigneeId: string;
  dueAtUtc: string;
  priority: TaskPriority;
  status: TaskStatus;
  resolution: string | null;
  isOverdue: boolean;
  version: string;
}

export interface TaskDetails {
  title: string;
  description: string | null;
  assigneeId: string;
  dueAtUtc: string;
  priority: TaskPriority;
}

export interface TaskQuery {
  caseId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  overdue?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TaskCaseOption {
  id: string;
  caseNumber: string;
  title: string;
  isActive: boolean;
  assignedLawyerEmployeeId: string;
}

export interface AssigneeOption {
  id: string;
  fullName: string;
}
