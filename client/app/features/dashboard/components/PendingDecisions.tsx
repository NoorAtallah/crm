import Link from "next/link";
import { Badge, type BadgeTone } from "../../../components/ui/Badge";
import { Card, CardHeader, EmptyState } from "../../../components/ui/Card";
import { daysFromToday } from "../../../lib/format";
import { interpolate } from "../../../lib/i18n";
import type { Locale } from "../../../lib/i18n";
import type { PendingDecision, Priority } from "../types";
import type { DashboardDict } from "../i18n";

const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

/**
 * The Last Decision queue (section 19). This is the one thing on the page
 * only a managing partner can clear, so it gets the champagne edge — the
 * spec's rule that gold marks premium emphasis, used once.
 */
export function PendingDecisions({
  decisions,
  t,
  locale,
}: {
  decisions: PendingDecision[];
  t: DashboardDict;
  locale: Locale;
}) {
  return (
    <Card className="border-s-[3px] border-s-brand-champagne">
      <CardHeader
        title={t.decisionsTitle}
        action={
          <Link
            href="/consultations?status=awaiting_manager"
            className="text-[13px] font-medium text-text-muted underline-offset-4 transition-colors hover:text-brand-charcoal hover:underline"
          >
            {t.viewAll}
          </Link>
        }
      />

      {decisions.length === 0 ? (
        <EmptyState>{t.decisionsEmpty}</EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {decisions.map((decision) => (
            <li key={decision.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-text-primary">
                  {decision.reference}
                </span>
                <span className="truncate text-[13px] text-text-primary">
                  {decision.subject}
                </span>
                <Badge tone={PRIORITY_TONE[decision.priority]}>
                  {t.priority[decision.priority]}
                </Badge>
              </div>

              <p className="mt-1 truncate text-[12.5px] text-text-muted">
                {decision.clientName} · {decision.teamName} ·{" "}
                {decision.lawyerName}
              </p>

              <p className="mt-2.5 text-[13px] leading-relaxed text-text-primary">
                <span className="text-text-muted">{t.recommendation}: </span>
                {decision.recommendation}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[12px] text-text-muted">
                  {waitingLabel(decision.waitingSince, t)}
                </span>
                <Link
                  href={`/consultations/${decision.id}`}
                  className="inline-flex h-8 items-center rounded-lg bg-brand-champagne px-3.5 text-[13px] font-medium text-brand-charcoal transition-opacity hover:opacity-90"
                >
                  {t.review}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function waitingLabel(iso: string, t: DashboardDict): string {
  const days = Math.abs(daysFromToday(iso));
  if (days <= 1) return t.waitingOneDay;
  return interpolate(t.waitingDays, { count: days });
}