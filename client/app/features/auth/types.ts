/**
 * Auth domain vocabulary. The five roles come straight from section 10 of
 * the functional spec (الأمان والصلاحيات).
 */

export type Role =
  | "owner" // المدير العام — every office
  | "branch_manager" // مدير الفرع — own office only
  | "lawyer" // المحامي
  | "secretary" // السكرتاريا
  | "client"; // بوابة العميل

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  officeId: string | null;
  teamIds: string[];
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: string; // ISO
}

export interface Credentials {
  email: string;
  password: string;
  remember: boolean;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_LOCKED"
  | "NETWORK";

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    public attemptsLeft?: number
  ) {
    super(code);
    this.name = "AuthError";
  }
}

/** Where each role lands after signing in. */
export const landingPathForRole: Record<Role, string> = {
  owner: "/dashboard",
  branch_manager: "/dashboard",
  lawyer: "/cases",
  secretary: "/cases",
  client: "/portal",
};