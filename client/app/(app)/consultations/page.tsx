import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import { casesApi } from "../../features/cases";
import { communicationsDictionaries } from "../../features/communications";
import { ConsultationsView, consultationsDictionaries } from "../../features/consultations";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Consultations · Legal CRM" };

export default async function ConsultationsPage() {
  const [locale, t, commsT, session, people] = await Promise.all([
    getLocale(),
    getDictionary(consultationsDictionaries),
    getDictionary(communicationsDictionaries),
    authApi.currentSession(),
    casesApi.people(),
  ]);
  const perms = session?.user.permissions ?? [];
  const pick = (type: string) => people.filter((p) => p.type === type).map((p) => ({ id: p.id, fullName: p.fullName }));

  return (
    <ConsultationsView
      clients={pick("Client")}
      lawyers={pick("Lawyer")}
      viewerId={session?.user.id ?? ""}
      manageAll={perms.includes("cases.manage.all") || !!session?.user.isSuperAdmin}
      canManageOwn={perms.includes("cases.manage.own")}
      t={t}
      commsT={commsT}
      locale={locale}
    />
  );
}
