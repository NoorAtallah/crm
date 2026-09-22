import { Card, CardHeader, EmptyState } from "../../../components/ui/Card";
import { formatNumber, formatPercent } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import type { OfficePerformance as Office } from "../types";
import type { DashboardDict } from "../i18n";

export function OfficePerformance({
  offices,
  t,
  locale,
}: {
  offices: Office[];
  t: DashboardDict;
  locale: Locale;
}) {
  return (
    <Card>
      <CardHeader title={t.officesTitle} />

      {offices.length === 0 ? (
        <EmptyState>—</EmptyState>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-line text-[12px] text-text-muted">
              <th className="px-5 py-2.5 text-start font-medium">
                {t.officeFilter}
              </th>
              <th className="px-3 py-2.5 text-end font-medium">
                {t.openCasesShort}
              </th>
              <th className="hidden px-3 py-2.5 text-end font-medium sm:table-cell">
                {t.progressShort}
              </th>
              <th className="px-5 py-2.5 text-end font-medium">
                {t.overdueShort}
              </th>
            </tr>
          </thead>
          <tbody>
            {offices.map((office) => (
              <tr
                key={office.id}
                className="border-b border-line text-[13px] last:border-0 odd:bg-background/60"
              >
                <td className="px-5 py-3 text-text-primary">{office.name}</td>
                <td className="px-3 py-3 text-end tabular-nums text-text-primary">
                  {formatNumber(office.openCases, locale)}
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <div className="flex items-center justify-end gap-2.5">
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-brand-charcoal"
                        style={{ width: `${office.progress}%` }}
                      />
                    </span>
                    <span className="w-9 text-end tabular-nums text-text-primary">
                      {formatPercent(office.progress, locale)}
                    </span>
                  </div>
                </td>
                <td
                  className={`px-5 py-3 text-end tabular-nums ${
                    office.overdueCases > 4
                      ? "font-medium text-danger"
                      : "text-text-primary"
                  }`}
                >
                  {formatNumber(office.overdueCases, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}