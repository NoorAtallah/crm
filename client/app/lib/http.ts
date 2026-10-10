/**
 * Single HTTP entry point. Every feature's `api/` folder calls through here
 * so base URL, credentials, headers and error shape are decided once.
 */

import { SESSION_COOKIE } from "./session-cookie";

export class HttpError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

/**
 * In the browser the base is empty: calls go to `/api/...` on this site and
 * the rewrite in `next.config.ts` forwards them to the backend. On the
 * server there is no site origin to be relative to, so it calls the backend
 * directly.
 */
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5052").replace(/\/+$/, "")
    : "";

/** URL for an API path — for callers that can't go through `http()` (XHR uploads). */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

/**
 * The API authenticates with `Authorization: Bearer <token>`. The token lives
 * in the `session` cookie written after login: read from `document.cookie`
 * in the browser, and from the request cookies in server components.
 */
export async function readToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
    } catch {
      return null; // outside a request (build time)
    }
  }

  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null;
}

export async function http<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await readToken();
  // FormData sets its own multipart boundary — never force JSON on it.
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;

  const response = await fetch(apiUrl(path), {
    cache: "no-store",
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // 204 No Content (deletes) and empty bodies resolve to null.
  const text = response.status === 204 ? "" : await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) throw new HttpError(response.status, body);
  return body as T;
}

/**
 * Binary download with the Bearer token — `<a href>` / `<img src>` can't
 * send it, so file content is fetched as a Blob and handed out as an object URL.
 */
export async function httpBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const token = await readToken();
  const response = await fetch(apiUrl(path), {
    cache: "no-store",
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new HttpError(response.status, body);
  }
  return response.blob();
}

/**
 * The API answers failures with ProblemDetails; `detail` holds the reason
 * (e.g. "Employee email already exists."). Falls back when there's none.
 */
export function problemMessage(error: unknown, fallback: string): string {
  if (
    error instanceof HttpError &&
    error.body &&
    typeof error.body === "object" &&
    "detail" in error.body &&
    typeof (error.body as { detail: unknown }).detail === "string"
  ) {
    return (error.body as { detail: string }).detail;
  }
  return fallback;
}
