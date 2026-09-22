import { AuthError, type AuthSession, type AuthUser } from "../types";
import type { AuthApi } from "./contract";

/**
 * Development stand-in. Delete this file once the live API is wired —
 * nothing outside `api/index.ts` references it.
 */

const ACCOUNTS: Record<string, { password: string; user: AuthUser }> = {
  "owner@firm.jo": {
    password: "password123",
    user: {
      id: "u_1",
      fullName: "أيمن الشريف",
      email: "owner@firm.jo",
      role: "owner",
      officeId: null,
      teamIds: [],
    },
  },
  "maya@firm.jo": {
    password: "password123",
    user: {
      id: "u_2",
      fullName: "مايا العدوان",
      email: "maya@firm.jo",
      role: "lawyer",
      officeId: "off_amman",
      teamIds: ["team_contracts"],
    },
  },
  "client@ayman-trading.jo": {
    password: "password123",
    user: {
      id: "u_3",
      fullName: "أيمن التجارية",
      email: "client@ayman-trading.jo",
      role: "client",
      officeId: "off_amman",
      teamIds: [],
    },
  },
};

const MAX_ATTEMPTS = 5;
let failedAttempts = 0;
let session: AuthSession | null = null;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockAuthApi: AuthApi = {
  async signIn({ email, password, remember }) {
    await wait(900);

    if (failedAttempts >= MAX_ATTEMPTS) throw new AuthError("ACCOUNT_LOCKED");

    const account = ACCOUNTS[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      failedAttempts += 1;
      if (failedAttempts >= MAX_ATTEMPTS) throw new AuthError("ACCOUNT_LOCKED");
      throw new AuthError("INVALID_CREDENTIALS", MAX_ATTEMPTS - failedAttempts);
    }

    failedAttempts = 0;
    session = {
      user: account.user,
      token: "mock.jwt.token",
      expiresAt: new Date(
        Date.now() + (remember ? 30 : 1) * 864e5
      ).toISOString(),
    };
    return session;
  },

  async signOut() {
    await wait(200);
    session = null;
  },

  async currentSession() {
    // Server components can't see the module state a client sign-in wrote,
    // so in development we resolve to the managing partner. The live
    // implementation reads the real session cookie instead.
    return (
      session ?? {
        user: ACCOUNTS["owner@firm.jo"].user,
        token: "mock.jwt.token",
        expiresAt: new Date(Date.now() + 864e5).toISOString(),
      }
    );
  },
};