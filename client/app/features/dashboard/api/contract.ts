import type { DashboardQuery, DashboardSummary } from "../types";

export interface DashboardApi {
  getSummary(query: DashboardQuery): Promise<DashboardSummary>;
}