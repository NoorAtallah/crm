import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import { casesApi } from "../../features/cases";
import { OfficesView, officesDictionaries } from "../../features/offices";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Offices · Legal CRM" };

export default async function OfficesPage() {
  const [locale, t, session, people] = await Promise.all([
    getLocale(),
    getDictionary(officesDictionaries),
    authApi.currentSession(),
    casesApi.people(),
  ]);
  const admin = !!session?.user.isSuperAdmin;
  return (
    <OfficesView
      people={people.map((p) => ({ id: p.id, fullName: p.fullName, isClient: p.type === "Client" }))}
      isSuperAdmin={admin}
      canManage={admin || (session?.user.permissions ?? []).includes("employees.manage")}
      t={t}
      locale={locale}
    />
  );
}
