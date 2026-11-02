import { httpDashboardApi } from "./http";

/** Live data. `mock.ts` is kept for offline UI work only. */
export const dashboardApi = httpDashboardApi;

export type { DashboardApi } from "./contract";
