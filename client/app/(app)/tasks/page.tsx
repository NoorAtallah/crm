import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import { casesApi } from "../../features/cases";
import { tasksDictionaries, TasksView, type TaskCaseOption } from "../../features/tasks";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Tasks · Legal CRM" };

export default async function TasksPage() {
  const [locale, t, session, people, summary] = await Promise.all([
    getLocale(),
    getDictionary(tasksDictionaries),
    authApi.currentSession(),
    casesApi.people(),
    casesApi.list().catch(() => ({ cases: [] })),
  ]);

  const cases: TaskCaseOption[] = summary.cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    title: c.title,
    isActive: c.isActive,
    assignedLawyerEmployeeId: c.assignedLawyerEmployeeId,
  }));
  // Any active employee can be assigned — clients can't.
  const assignees = people.filter((p) => p.type !== "Client").map((p) => ({ id: p.id, fullName: p.fullName }));
  const perms = session?.user.permissions ?? [];

  return (
    <TasksView
      cases={cases}
      assignees={assignees}
      viewerId={session?.user.id ?? ""}
      manageAll={perms.includes("cases.manage.all") || !!session?.user.isSuperAdmin}
      canManageOwn={perms.includes("cases.manage.own")}
      t={t}
      locale={locale}
    />
  );
}
