import type { AuthSession, Credentials } from "../types";

/**
 * The contract. Components import from `./index`, never from a concrete
 * implementation, so swapping mock → live touches one line in index.ts.
 */
export interface AuthApi {
  signIn(credentials: Credentials): Promise<AuthSession>;
  signOut(): Promise<void>;
  currentSession(): Promise<AuthSession | null>;
}