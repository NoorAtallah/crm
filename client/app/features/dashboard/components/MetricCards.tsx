"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import type { DashboardMetrics } from "../types";
import type { DashboardDict } from "../i18n";

type MetricKey = keyof DashboardMetrics;

/** Which metrics improve when they go down. */
const LOWER_IS_BETTER: MetricKey[] = ["overdueInvoices", "uncollected"];

const ORDER: MetricKey[] = [
  "totalCases",
  "openCases",
  "hearingsThisWeek",
  "averageProgress",
  "overdueInvoices",
  "uncollected",
];

export function MetricCards({
  metrics,
  t,
  locale,
}: {
  metrics: DashboardMetrics;
  t: DashboardDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {ORDER.map((key, index) => {
        const metric = metrics[key];
        const rising = (metric.delta ?? 0) > 0;
        const good = LOWER_IS_BETTER.includes(key) ? !rising : rising;
        const Trend = rising ? TrendingUp : TrendingDown;

        return (
          <motion.div
            key={key}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: reduceMotion ? 0 : index * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-card border border-line bg-surface px-4 py-4"
          >
            <p className="truncate text-[12.5px] text-text-muted">
              {t.metrics[key]}
            </p>
            <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-text-primary">
              {formatMetric(key, metric.value, locale)}
            </p>
            {metric.delta !== undefined && (
              <p
                className={`mt-2 flex items-center gap-1 text-[12px] ${
                  good ? "text-success" : "text-danger"
                }`}
              >
                <Trend className="h-3.5 w-3.5" strokeWidth={2} />
                {formatNumber(Math.abs(metric.delta), locale)}%
                <span className="truncate text-text-muted">
                  {t.vsLastMonth}
                </span>
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function formatMetric(key: MetricKey, value: number, locale: Locale): string {
  if (key === "uncollected") return formatCurrency(value, locale);
  if (key === "averageProgress") return formatPercent(value, locale);
  return formatNumber(value, locale);
}