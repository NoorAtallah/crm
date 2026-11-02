import type { Metadata } from "next";
import { Alert } from "../../../../components/ui";
import { PortalCaseView, portalApi, portalDictionaries } from "../../../../features/portal";
import { getDictionary, getLocale } from "../../../../lib/i18n";

export const metadata: Metadata = { title: "My case · Legal CRM" };

export default async function PortalCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const [locale, t] = await Promise.all([getLocale(), getDictionary(portalDictionaries)]);
  const file = await portalApi.caseFile(caseId).catch(() => null);
  if (!file) return <Alert tone="danger">{t.notFound}</Alert>;

  const [portal, appointments, timeline, communications, invoices] = await Promise.all([
    portalApi.portal(caseId),
    portalApi.appointments({ caseId }),
    portalApi.timeline(caseId),
    portalApi.communications(caseId),
    portalApi.invoices({ caseId }),
  ]);
  return (
    <PortalCaseView
      file={file}
      documents={portal.documents}
      reports={portal.approvedReports}
      appointments={appointments.items}
      timeline={timeline.items}
      communications={communications.items}
      invoices={invoices.items}
      t={t}
      locale={locale}
    />
  );
}
