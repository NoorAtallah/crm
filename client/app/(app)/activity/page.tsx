import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import {
  AuditView,
  auditApi,
  auditDictionaries,
  canReadAudit,
  type AuditEntry,
} from "../../features/audit";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Activity · Legal CRM" };

export default async function ActivityPage() {
  const [locale, t, session] = await Promise.all([
    getLocale(),
    getDictionary(auditDictionaries),
    authApi.currentSession(),
  ]);

  const canRead = canReadAudit(session?.user ?? { permissions: [], isSuperAdmin: false });

  let entries: AuditEntry[] = [];
  let failed = false;
  try {
    entries = await auditApi.list();
  } catch {
    failed = true;
  }

  return (
    <AuditView entries={entries} canRead={canRead} failed={failed} t={t} locale={locale} />
  );
}
