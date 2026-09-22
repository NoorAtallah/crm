"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import { formatFileSize, formatNumber, formatPercent } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import { FILE_KINDS, kindOf, kindStroke, kindStyles } from "../fileKind";
import type { DocumentRow } from "../types";
import type { DocumentsDict } from "../i18n";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut of storage by file kind, then a legend. Drawn as SVG arcs — one
 * dependency fewer, and the ring animates with framer-motion like the
 * rest of the page.
 */
export function StoragePanel({
  documents,
  t,
  locale,
}: {
  documents: DocumentRow[];
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();

  const { total, slices, reviewedShare } = useMemo(() => {
    const byKind = new Map<string, { bytes: number; count: number }>();

    for (const document of documents) {
      const kind = kindOf(document.fileName);
      const current = byKind.get(kind) ?? { bytes: 0, count: 0 };
      byKind.set(kind, {
        bytes: current.bytes + (document.sizeBytes ?? 0),
        count: current.count + 1,
      });
    }

    const totalBytes = [...byKind.values()].reduce(
      (sum, entry) => sum + entry.bytes,
      0
    );
    const reviewed = documents.filter(
      (document) => document.status === "Reviewed"
    ).length;

    return {
      total: totalBytes,
      slices: FILE_KINDS.map((kind) => ({
        kind,
        bytes: byKind.get(kind)?.bytes ?? 0,
        count: byKind.get(kind)?.count ?? 0,
      })).filter((slice) => slice.count > 0),
      reviewedShare: documents.length
        ? (reviewed / documents.length) * 100
        : 0,
    };
  }, [documents]);

  let offset = 0;

  return (
    <Card>
      <CardHeader title={t.storage} />
      <CardBody className="space-y-5">
        <div className="flex justify-center">
          <div className="relative">
            <svg viewBox="0 0 130 130" className="h-[150px] w-[150px] -rotate-90">
              <circle
                cx="65"
                cy="65"
                r={RADIUS}
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="13"
              />
              {slices.map((slice) => {
                const share = total > 0 ? slice.bytes / total : 0;
                const length = share * CIRCUMFERENCE;
                const dash = `${Math.max(length - 2, 0)} ${CIRCUMFERENCE}`;
                const start = offset;
                offset += length;

                return (
                  <motion.circle
                    key={slice.kind}
                    cx="65"
                    cy="65"
                    r={RADIUS}
                    fill="none"
                    stroke={kindStroke[slice.kind]}
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray={dash}
                    initial={reduceMotion ? false : { strokeDashoffset: -start - length }}
                    animate={{ strokeDashoffset: -start }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                );
              })}
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[20px] font-semibold tabular-nums text-text-primary">
                {formatFileSize(total, locale)}
              </p>
              <p className="mt-0.5 max-w-[110px] text-center text-[11.5px] leading-tight text-text-muted">
                {t.storageUsed}
              </p>
            </div>
          </div>
        </div>

        <ul className="space-y-2.5">
          {slices.map((slice) => {
            const { Icon, surface, text } = kindStyles[slice.kind];
            return (
              <li key={slice.kind} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${surface}`}
                >
                  <Icon className={`h-4 w-4 ${text}`} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-text-primary">
                    {t.kinds[slice.kind]}
                  </p>
                  <p className="text-[12px] text-text-muted">
                    {formatNumber(slice.count, locale)}
                  </p>
                </div>
                <span className="text-[12.5px] tabular-nums text-text-muted">
                  {formatFileSize(slice.bytes, locale)}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-line pt-4">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-text-muted">{t.reviewedShare}</span>
            <span className="font-medium tabular-nums text-text-primary">
              {formatPercent(reviewedShare, locale)}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
            <motion.div
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${reviewedShare}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-success"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
