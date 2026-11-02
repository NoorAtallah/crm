import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import { PortalHome, portalApi, portalDictionaries } from "../../features/portal";
import { HttpError } from "../../lib/http";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Client portal · Legal CRM" };

export default async function PortalHomePage() {
  const [locale, t, session, mine, upcoming, invoices, consultations] = await Promise.all([
    getLocale(),
    getDictionary(portalDictionaries),
    authApi.currentSession(),
    portalApi
      .myCases()
      .then((cases) => ({ cases, status: "ok" as const }))
      .catch((e) => ({ cases: [], status: e instanceof HttpError && (e.status === 403 || e.status === 401) ? ("forbidden" as const) : ("error" as const) })),
    portalApi.appointments({ fromUtc: new Date().toISOString(), status: "Scheduled", pageSize: 8 }),
    portalApi.invoices(),
    portalApi.consultations(),
  ]);
  return (
    <PortalHome
      name={session?.user.fullName ?? ""}
      cases={mine.cases}
      status={mine.status}
      upcoming={upcoming.items}
      invoices={invoices.items}
      consultations={consultations.items}
      t={t}
      locale={locale}
    />
  );
}
