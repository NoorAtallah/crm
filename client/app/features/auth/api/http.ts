import { http, HttpError } from "../../../lib/http";
import { AuthError, type AuthSession, type AuthUser, type Role } from "../types";
import type { AuthApi } from "./contract";

/**
 * Live implementation against the Legal CRM API (ASP.NET Core).
 *
 *   POST /api/auth/login   → LoginResponse
 *   GET  /api/identity/me  → CurrentEmployeeResponse (needs the Bearer token)
 *
 * The API has no logout endpoint yet — sessions expire server-side after
 * 8 hours, so signing out only drops the token on this side.
 */

/** EmployeeType enum, serialized as a string by the API. */
type EmployeeType =
  | "SuperAdmin"
  | "OfficeManager"
  | "Lawyer"
  | "Secretary"
  | "Client";

interface CurrentEmployeeResponse {
  id: string;
  fullName: string;
  email: string;
  type: EmployeeType;
  roleId: string;
  roleName: string;
  permissions: string[];
}

interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  employee: CurrentEmployeeResponse;
}

const roleForType: Record<EmployeeType, Role> = {
  SuperAdmin: "owner",
  OfficeManager: "branch_manager",
  Lawyer: "lawyer",
  Secretary: "secretary",
  Client: "client",
};

function toUser(employee: CurrentEmployeeResponse): AuthUser {
  return {
    id: employee.id,
    fullName: employee.fullName,
    email: employee.email,
    role: roleForType[employee.type] ?? "secretary",
    // Not exposed by the API yet.
    officeId: null,
    teamIds: [],
    permissions: employee.permissions ?? [],
    isSuperAdmin: employee.type === "SuperAdmin",
  };
}

export const httpAuthApi: AuthApi = {
  async signIn({ email, password }) {
    try {
      const response = await http<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return {
        user: toUser(response.employee),
        token: response.token,
        expiresAt: response.expiresAtUtc,
      };
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async signOut() {
    // No server endpoint — the caller clears the session cookie.
  },

  async currentSession(): Promise<AuthSession | null> {
    try {
      const employee = await http<CurrentEmployeeResponse>("/api/identity/me");
      return {
        user: toUser(employee),
        token: "",
        expiresAt: new Date(Date.now() + 864e5).toISOString(),
      };
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
