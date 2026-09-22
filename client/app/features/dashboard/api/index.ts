import { mockDashboardApi } from "./mock";
import { httpDashboardApi } from "./http";

/** Swap to `httpDashboardApi` when the endpoint is live. */
export const dashboardApi = mockDashboardApi;

void httpDashboardApi;

export type { DashboardApi } from "./contract";