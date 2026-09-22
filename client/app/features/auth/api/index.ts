import { mockAuthApi } from "./mock";
import { httpAuthApi } from "./http";

/**
 * ─────────────────────────────────────────────────────────────
 *  THE SWAP. Change this one line when the API is live:
 *
 *    export const authApi = httpAuthApi;
 * ─────────────────────────────────────────────────────────────
 */
export const authApi = mockAuthApi;

// Keep both referenced so neither drifts out of sync with the contract.
void httpAuthApi;

export type { AuthApi } from "./contract";