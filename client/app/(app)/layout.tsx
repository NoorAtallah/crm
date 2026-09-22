import { redirect } from "next/navigation";
import { AppShell } from "../components/layout/AppShell";
import { shellDictionaries } from "../components/layout/navigation";
import { authApi } from "../features/auth";
import { getDictionary, getLocale } from "../lib/i18n";

/**
 * Shell for every signed-in staff screen. The client portal (section 11)
 * gets its own group — different chrome, different permissions.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authApi.currentSession();
  if (!session) redirect("/login");
  if (session.user.role === "client") redirect("/portal");

  const locale = await getLocale();
  const t = await getDictionary(shellDictionaries);

  return (
    <AppShell t={t} user={session.user} locale={locale}>
      {children}
    </AppShell>
  );
}