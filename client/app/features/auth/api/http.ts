import { http, HttpError } from "../../../lib/http";
import { AuthError, type AuthSession } from "../types";
import type { AuthApi } from "./contract";

/**
 * Live implementation. Adjust the paths and the response mapping to match
 * your backend, then flip the export in `api/index.ts`.
 */
export const httpAuthApi: AuthApi = {
  async signIn(credentials) {
    try {
      return await http<AuthSession>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async signOut() {
    await http<void>("/auth/logout", { method: "POST" });
  },

  async currentSession() {
    try {
      return await http<AuthSession>("/auth/session");
    } catch {
      return null;
    }
  },
};

/** Maps transport failures onto the domain's error vocabulary. */
function toAuthError(error: unknown): AuthError {
  if (!(error instanceof HttpError)) return new AuthError("NETWORK");

  const attemptsLeft =
    error.body && typeof error.body === "object" && "attemptsLeft" in error.body
      ? Number((error.body as { attemptsLeft: unknown }).attemptsLeft)
      : undefined;

  if (error.status === 401)
    return new AuthError("INVALID_CREDENTIALS", attemptsLeft);
  if (error.status === 423 || error.status === 429)
    return new AuthError("ACCOUNT_LOCKED");
  return new AuthError("NETWORK");
}