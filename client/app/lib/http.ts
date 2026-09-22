/**
 * Single HTTP entry point. Every feature's `api/` folder calls through here
 * so base URL, credentials, headers and error shape are decided once.
 */

export class HttpError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function http<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new HttpError(response.status, body);
  return body as T;
}