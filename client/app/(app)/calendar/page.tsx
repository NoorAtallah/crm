import type { Metadata } from "next";
import { appointmentsDictionaries, CalendarView, type CaseOption } from "../../features/appointments";
import { authApi } from "../../features/auth";
import { casesApi } from "../../features/cases";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Calendar · Legal CRM" };

export default async function CalendarPage() {
  const [locale, t, session, people, summary] = await Promise.all([
    getLocale(),
    getDictionary(appointmentsDictionaries),
    authApi.currentSession(),
    casesApi.people(),
    casesApi.list().catch(() => ({ cases: [] })),
  ]);

  const cases: CaseOption[] = summary.cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    title: c.title,
    assignedLawyerEmployeeId: c.assignedLawyerEmployeeId,
    isActive: c.isActive,
  }));
  const lawyers = people.filter((p) => p.type === "Lawyer").map((p) => ({ id: p.id, fullName: p.fullName }));
  const perms = session?.user.permissions ?? [];

  return (
    <CalendarView
      cases={cases}
      lawyers={lawyers}
      manageAll={perms.includes("cases.manage.all") || !!session?.user.isSuperAdmin}
      canManageOwn={perms.includes("cases.manage.own")}
      viewerId={session?.user.id ?? ""}
      t={t}
      locale={locale}
    />
  );
}
