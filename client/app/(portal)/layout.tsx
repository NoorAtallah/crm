import { redirect } from "next/navigation";
import { authApi } from "../features/auth";
import { PortalShell, portalDictionaries } from "../features/portal";
import { getDictionary, getLocale } from "../lib/i18n";

/** Client portal chrome. Staff are sent back to their own app. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await authApi.currentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "client") redirect("/dashboard");
  const [locale, t] = await Promise.all([getLocale(), getDictionary(portalDictionaries)]);
  return (
    <PortalShell name={session.user.fullName} t={t} locale={locale}>
      {children}
    </PortalShell>
  );
}
