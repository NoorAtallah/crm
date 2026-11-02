import type { Metadata } from "next";
import { PageHeader } from "../../components/ui";
import { authApi } from "../../features/auth";
import { casesApi } from "../../features/cases";
import { FinanceBoard, financeDictionaries } from "../../features/finance";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Billing · Legal CRM" };

export default async function BillingPage() {
  const [locale, t, session, people, summary] = await Promise.all([
    getLocale(),
    getDictionary(financeDictionaries),
    authApi.currentSession(),
    casesApi.people(),
    casesApi.list().catch(() => ({ cases: [] })),
  ]);
  const perms = session?.user.permissions ?? [];
  const admin = !!session?.user.isSuperAdmin;

  return (
    <div className="space-y-5">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <FinanceBoard
        clients={people.filter((p) => p.type === "Client").map((p) => ({ id: p.id, fullName: p.fullName }))}
        cases={summary.cases.map((c) => ({ id: c.id, caseNumber: c.caseNumber, title: c.title, clientId: c.clientEmployeeId }))}
        canRead={admin || perms.includes("finance.read") || perms.includes("finance.manage")}
        canManage={admin || perms.includes("finance.manage")}
        t={t}
        locale={locale}
      />
    </div>
  );
}
