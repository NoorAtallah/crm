import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import {
  ClientsView,
  clientAbilitiesFor,
  clientsApi,
  clientsDictionaries,
  type Client,
} from "../../features/clients";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Clients · Legal CRM" };

export default async function ClientsPage() {
  const [locale, t, session] = await Promise.all([
    getLocale(),
    getDictionary(clientsDictionaries),
    authApi.currentSession(),
  ]);

  const abilities = clientAbilitiesFor(
    session?.user ?? { permissions: [], isSuperAdmin: false }
  );

  let clients: Client[] = [];
  let failed = false;
  try {
    clients = await clientsApi.list();
  } catch {
    failed = true;
  }

  return <ClientsView clients={clients} abilities={abilities} failed={failed} t={t} locale={locale} />;
}
