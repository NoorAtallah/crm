import type { NextConfig } from "next";

/**
 * Where the backend lives. Server-only: the browser never sees this value.
 * Local: http://localhost:5052 · Production: set API_URL in Vercel.
 */
const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5052"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  /**
   * The browser calls `/api/...` on this site and Next forwards it to the
   * backend. Same origin, so no CORS, and no blocked http call from an
   * https page.
   */
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
