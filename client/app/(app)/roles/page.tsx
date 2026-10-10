import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import {
  RolesView,
  rolesAbilitiesFor,
  rolesApi,
  rolesDictionaries,
  type RolesSummary,
} from "../../features/roles";
import { getDictionary } from "../../lib/i18n";

export const metadata: Metadata = { title: "Roles · Legal CRM" };

export default async function RolesPage() {
  const [t, session] = await Promise.all([
    getDictionary(rolesDictionaries),
    authApi.currentSession(),
  ]);

  const abilities = rolesAbilitiesFor(
    session?.user ?? { permissions: [], isSuperAdmin: false }
  );

  let summary: RolesSummary = { roles: [], catalog: [] };
  let failed = false;
  try {
    summary = await rolesApi.summary();
  } catch {
    failed = true;
  }

  return <RolesView initial={summary} abilities={abilities} failed={failed} t={t} />;
}
