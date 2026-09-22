"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "../../../components/ui/Badge";
import { formatDate, formatFileSize } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import { kindOf, kindStyles } from "../fileKind";
import type { DocumentRow } from "../types";
import type { DocumentsDict } from "../i18n";

/** The three most recent documents, as cards — the drive-style top row. */
export function QuickAccess({
  documents,
  onOpen,
  t,
  locale,
}: {
  documents: DocumentRow[];
  onOpen: (document: DocumentRow) => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {documents.map((document, index) => {
        const { Icon, surface, text } = kindStyles[kindOf(document.fileName)];

        return (
          <motion.button
            key={document.id}
            type="button"
            onClick={() => onOpen(document)}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
              delay: Math.min(index * 0.05, 0.2),
            }}
            whileHover={reduceMotion ? undefined : { y: -3 }}
            className="rounded-card border border-line bg-surface p-4 text-start transition-colors hover:border-brand-charcoal"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${surface}`}
              >
                <Icon className={`h-5 w-5 ${text}`} strokeWidth={1.75} />
              </span>
              <Badge
                tone={document.status === "Reviewed" ? "success" : "warning"}
              >
                {t.status[document.status]}
              </Badge>
            </div>

            <p className="mt-3.5 truncate text-[14px] font-medium text-text-primary">
              {document.fileName}
            </p>
            <p className="mt-1 truncate text-[12.5px] text-text-muted">
              {document.caseNumber} ·{" "}
              {document.sizeBytes !== null
                ? formatFileSize(document.sizeBytes, locale)
                : formatDate(document.uploadedAtUtc, locale)}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
