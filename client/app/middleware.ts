import { NextResponse, type NextRequest } from "next/server";

/**
 * Route gate. Runs before every page render.
 *
 * Today it only checks whether a session cookie exists — enough to keep
 * signed-out users at /login and signed-in users out of it. When the real
 * API lands, verify the token here instead of trusting the cookie's
 * presence, and read the role to enforce the portal split (section 10 of
 * the spec: a client must never reach /dashboard).
 */

const SESSION_COOKIE = "session";

/** Reachable without a session. */
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Signed out, asking for a protected page → login, remembering where.
  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in, landing on login → send them onward.
  if (hasSession && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};