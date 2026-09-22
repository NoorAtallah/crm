import type { AuthSession } from "../features/auth";

export const SESSION_COOKIE = "session";

/**
 * Dev-only bridge. The middleware gates routes on this cookie, but the mock
 * api keeps its session in memory where the server can't see it.
 *
 * The live API will set an httpOnly cookie itself — at that point delete
 * this file and the two calls to it in `useLogin`. A token readable by
 * JavaScript is not something you want in production.
 */
export function writeSessionCookie(session: AuthSession) {
  const maxAge = Math.max(
    0,
    Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
  );
  document.cookie = `${SESSION_COOKIE}=${session.token}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}