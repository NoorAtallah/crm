import { http } from "../../../lib/http";
import type { DashboardSummary } from "../types";
import type { DashboardApi } from "./contract";

export const httpDashboardApi: DashboardApi = {
  async getSummary({ officeId }) {
    const query = officeId ? `?officeId=${encodeURIComponent(officeId)}` : "";
    return http<DashboardSummary>(`/dashboard/summary${query}`);
  },
};