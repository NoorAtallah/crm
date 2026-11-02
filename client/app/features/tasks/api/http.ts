import { http } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type { CaseTask, PagedResult } from "../types";
import type { TasksApi } from "./contract";

const BASE = "/api/tasks";
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const httpTasksApi: TasksApi = {
  search: (query) => http<PagedResult<CaseTask>>(`${BASE}/search${toQuery(query)}`),
  get: (id) => http<CaseTask>(`${BASE}/${id}`),
  create: (caseId, details) => http<CaseTask>(BASE, json("POST", { caseId, details })),
  update: (id, details, version) => http<CaseTask>(`${BASE}/${id}`, json("PUT", { details, version })),
  setStatus: (id, status, resolution, version) =>
    http<CaseTask>(`${BASE}/${id}/status`, json("PUT", { status, resolution, version })),
};
