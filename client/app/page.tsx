import { redirect } from "next/navigation";

/**
 * `/` has no content of its own. Signed-out visitors belong at the login
 * screen; once a session exists, `middleware.ts` sends them to their
 * role's landing page before this ever runs.
 */
export default function RootPage() {
  redirect("/login");
}