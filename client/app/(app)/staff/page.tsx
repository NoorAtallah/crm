import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import {
  StaffView,
  abilitiesFor,
  staffApi,
  staffDictionaries,
  type StaffSummary,
} from "../../features/staff";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Staff · Legal CRM" };

export default async function StaffPage() {
  const [locale, t, session] = await Promise.all([
    getLocale(),
    getDictionary(staffDictionaries),
    authApi.currentSession(),
  ]);

  const abilities = abilitiesFor(
    session?.user ?? { permissions: [], isSuperAdmin: false }
  );

  let summary: StaffSummary = { employees: [], roles: [], catalog: [] };
  let failed = false;
  try {
    summary = await staffApi.summary();
  } catch {
    failed = true;
  }

  return (
    <StaffView
      initial={summary}
      abilities={abilities}
      failed={failed}
      t={t}
      locale={locale}
    />
  );
}
