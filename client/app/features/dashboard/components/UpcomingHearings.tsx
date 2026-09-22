import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardHeader, EmptyState } from "../../../components/ui/Card";
import {
  daysFromToday,
  formatDate,
  formatTime,
  formatWeekday,
} from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import type { Hearing } from "../types";
import type { DashboardDict } from "../i18n";

/** Server component — no interactivity, so no client bundle cost. */
export function UpcomingHearings({
  hearings,
  t,
  locale,
}: {
  hearings: Hearing[];
  t: DashboardDict;
  locale: Locale;
}) {
  return (
    <Card>
      <CardHeader
        title={t.hearingsTitle}
        action={
          <Link
            href="/calendar"
            className="text-[13px] font-medium text-text-muted underline-offset-4 transition-colors hover:text-brand-charcoal hover:underline"
          >
            {t.viewAll}
          </Link>
        }
      />

      {hearings.length === 0 ? (
        <EmptyState>{t.hearingsEmpty}</EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {hearings.map((hearing) => (
            <li key={hearing.id}>
              <Link
                href={`/cases/${hearing.caseNumber}`}
                className="flex gap-4 px-5 py-3.5 transition-colors hover:bg-background"
              >
                {/* Time block reads as a column, so the day scans vertically */}
                <div className="w-[74px] shrink-0">
                  <p className="text-[13px] font-semibold tabular-nums text-text-primary">
                    {formatTime(hearing.startsAt, locale)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-muted">
                    {relativeDay(hearing.startsAt, t, locale)}
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-text-primary">
                      {hearing.caseNumber}
                    </span>
                    <span className="truncate text-[13px] text-text-primary">
                      {hearing.caseTitle}
                    </span>
                    {hearing.conflict && (
                      <Badge tone="danger">
                        <TriangleAlert
                          className="me-1 h-3 w-3"
                          strokeWidth={2}
                        />
                        {t.conflict}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[12.5px] text-text-muted">
                    {hearing.clientName} · {hearing.lawyerName} ·{" "}
                    {hearing.officeName}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function relativeDay(iso: string, t: DashboardDict, locale: Locale): string {
  const days = daysFromToday(iso);
  if (days === 0) return t.today;
  if (days === 1) return t.tomorrow;
  if (days < 7) return formatWeekday(iso, locale);
  return formatDate(iso, locale);
}