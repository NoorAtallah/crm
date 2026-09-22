import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import {
  DocumentsView,
  abilitiesForRole,
  documentsApi,
  documentsDictionaries,
  emptyQuery,
} from "../../features/documents";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Documents · Legal CRM" };

export default async function DocumentsPage() {
  const [locale, t, session, summary] = await Promise.all([
    getLocale(),
    getDictionary(documentsDictionaries),
    authApi.currentSession(),
    documentsApi.list(emptyQuery),
  ]);

  // The shell already redirects a signed-out viewer; this keeps the types honest.
  const role = session?.user.role ?? "secretary";

  return (
    <DocumentsView
      initial={summary}
      abilities={abilitiesForRole(role)}
      t={t}
      locale={locale}
    />
  );
}
