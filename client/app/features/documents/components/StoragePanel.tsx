"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import { formatFileSize, formatNumber } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import { FILE_KINDS, kindOf, kindStroke, kindStyles } from "../fileKind";
import type { DocumentsDict } from "../i18n";
import type { FileEntry } from "../types";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut of bytes by file kind for the files on screen — SVG arcs, framer-motion. */
export function StoragePanel({
  files,
  t,
  locale,
}: {
  files: FileEntry[];
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();

  const { total, slices } = useMemo(() => {
    const byKind = new Map<string, { bytes: number; count: number }>();
    for (const file of files) {
      const kind = kindOf(file.fileName);
      const current = byKind.get(kind) ?? { bytes: 0, count: 0 };
      byKind.set(kind, { bytes: current.bytes + file.sizeBytes, count: current.count + 1 });
    }
    const totalBytes = [...byKind.values()].reduce((sum, entry) => sum + entry.bytes, 0);
    type Slice = { kind: (typeof FILE_KINDS)[number]; bytes: number; count: number; start: number; length: number };
    const kinds = FILE_KINDS.filter((kind) => byKind.has(kind)).reduce<Slice[]>((acc, kind) => {
      const { bytes, count } = byKind.get(kind)!;
      const previous = acc[acc.length - 1];
      const start = previous ? previous.start + previous.length : 0;
      const length = totalBytes > 0 ? (bytes / totalBytes) * CIRCUMFERENCE : 0;
      return [...acc, { kind, bytes, count, start, length }];
    }, []);
    return { total: totalBytes, slices: kinds };
  }, [files]);

  return (
    <Card>
      <CardHeader title={t.storage} />
      <CardBody className="space-y-5">
        <div className="flex justify-center">
          <div className="relative">
            <svg viewBox="0 0 130 130" className="h-[150px] w-[150px] -rotate-90">
              <circle cx="65" cy="65" r={RADIUS} fill="none" stroke="var(--color-line)" strokeWidth="13" />
              {slices.map((slice) => {
                const { start, length } = slice;
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
                    strokeDasharray={`${Math.max(length - 2, 0)} ${CIRCUMFERENCE}`}
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
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${surface}`}>
                  <Icon className={`h-4 w-4 ${text}`} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-text-primary">{t.kinds[slice.kind]}</p>
                  <p className="text-[12px] text-text-muted">{formatNumber(slice.count, locale)}</p>
                </div>
                <span className="text-[12.5px] tabular-nums text-text-muted">
                  {formatFileSize(slice.bytes, locale)}
                </span>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
