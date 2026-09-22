"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import { formatNumber } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import type { CaseStatusCount } from "../types";
import type { DashboardDict } from "../i18n";

/**
 * Horizontal bars rather than a pie: the statuses are a workflow, and length
 * comparisons are easier to read than angles. Charcoal is the baseline;
 * champagne marks the one status a manager should act on — cases blocked
 * waiting on an administrative decision.
 */
const HIGHLIGHTED = "awaiting_decision";

export function CaseStatusChart({
  counts,
  t,
  locale,
}: {
  counts: CaseStatusCount[];
  t: DashboardDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(...counts.map((c) => c.count), 1);
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  return (
    <Card>
      <CardHeader title={t.caseStatusTitle} />
      <CardBody className="space-y-3.5">
        {counts.map((entry, index) => {
          const highlighted = entry.status === HIGHLIGHTED;

          return (
            <div key={entry.status}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] text-text-primary">
                  {t.caseStatus[entry.status]}
                </span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums text-text-primary">
                  {formatNumber(entry.count, locale)}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-background">
                <motion.div
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: entry.count / max }}
                  transition={{
                    duration: 0.6,
                    delay: reduceMotion ? 0 : index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformOrigin: "var(--bar-origin, left)" }}
                  className={`h-full w-full rounded-full rtl:[--bar-origin:right] ${
                    highlighted ? "bg-brand-champagne" : "bg-brand-charcoal"
                  }`}
                />
              </div>
            </div>
          );
        })}

        <p className="border-t border-line pt-3 text-[12.5px] text-text-muted">
          {formatNumber(total, locale)} {t.casesUnit}
        </p>
      </CardBody>
    </Card>
  );
}