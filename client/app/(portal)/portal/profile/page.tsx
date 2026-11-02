import type { Metadata } from "next";
import { accountsApi, ProfileView } from "../../../features/accounts";
import { getLocale } from "../../../lib/i18n";

export const metadata: Metadata = { title: "My profile · Legal CRM" };

export default async function PortalProfilePage() {
  const [locale, profile] = await Promise.all([getLocale(), accountsApi.myProfile().catch(() => null)]);
  return <ProfileView initial={profile} locale={locale} />;
}
