import { mockAuthApi } from "./mock";
import { httpAuthApi } from "./http";

/**
 * ─────────────────────────────────────────────────────────────
 *  THE SWAP. Change this one line when the API is live:
 *
 *    export const authApi = httpAuthApi;
 * ─────────────────────────────────────────────────────────────
 */
export const authApi = httpAuthApi;

// Keep both referenced so neither drifts out of sync with the contract.
void mockAuthApi;

export type { AuthApi } from "./contract";