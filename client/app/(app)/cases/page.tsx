import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import {
  CasesView,
  casesApi,
  casesDictionaries,
  type CaseRow,
} from "../../features/cases";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Cases · Legal CRM" };

export default async function CasesPage() {
  const [locale, t, session, people] = await Promise.all([
    getLocale(),
    getDictionary(casesDictionaries),
    authApi.currentSession(),
    casesApi.people(),
  ]);

  let cases: CaseRow[] = [];
  let failed = false;
  try {
    ({ cases } = await casesApi.list());
  } catch {
    failed = true;
  }

  // Creating a case needs `cases.manage.all` — only managers hold it.
  const role = session?.user.role;
  const canCreate = role === "owner" || role === "branch_manager";

  return (
    <CasesView
      cases={cases}
      people={people}
      canCreate={canCreate}
      failed={failed}
      t={t}
      locale={locale}
    />
  );
}
