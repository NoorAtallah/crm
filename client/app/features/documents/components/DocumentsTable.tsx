"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/Card";
import { formatDate, formatFileSize, formatTime } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import { kindOf, kindStyles } from "../fileKind";
import type { DocumentRow } from "../types";
import type { DocumentsDict } from "../i18n";

export function DocumentsTable({
  documents,
  onOpen,
  emptyLabel,
  t,
  locale,
}: {
  documents: DocumentRow[];
  onOpen: (document: DocumentRow) => void;
  emptyLabel?: string;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();

  if (documents.length === 0)
    return <EmptyState>{emptyLabel ?? t.empty}</EmptyState>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-start">
        <thead>
          <tr className="border-b border-line text-[12.5px] text-text-muted">
            <th className="px-5 py-3 text-start font-medium">{t.columns.file}</th>
            <th className="px-5 py-3 text-start font-medium">{t.columns.case}</th>
            <th className="px-5 py-3 text-start font-medium">{t.columns.status}</th>
            <th className="px-5 py-3 text-start font-medium">
              {t.columns.visibility}
            </th>
            <th className="px-5 py-3 text-start font-medium">
              {t.columns.uploadedBy}
            </th>
            <th className="px-5 py-3 text-start font-medium">
              {t.columns.uploadedAt}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {documents.map((document, index) => {
            const { Icon, surface, text } = kindStyles[kindOf(document.fileName)];

            return (
              <motion.tr
                key={document.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  ease: "easeOut",
                  delay: Math.min(index * 0.03, 0.18),
                }}
                onClick={() => onOpen(document)}
                tabIndex={0}
                role="button"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(document);
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-background focus:bg-background focus:outline-none"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${surface}`}
                    >
                      <Icon className={`h-4 w-4 ${text}`} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-text-primary">
                        {document.fileName}
                      </p>
                      {document.sizeBytes !== null && (
                        <p className="mt-0.5 text-[12px] tabular-nums text-text-muted">
                          {formatFileSize(document.sizeBytes, locale)}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  <p className="text-[13px] font-medium text-text-primary">
                    {document.caseNumber}
                  </p>
                  <p className="mt-0.5 max-w-[200px] truncate text-[12.5px] text-text-muted">
                    {document.caseTitle}
                  </p>
                </td>

                <td className="px-5 py-3.5">
                  <Badge
                    tone={document.status === "Reviewed" ? "success" : "warning"}
                  >
                    {t.status[document.status]}
                  </Badge>
                </td>

                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted">
                    {document.visibleToClient ? (
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                    {document.visibleToClient ? t.visibleToClient : t.internalOnly}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-[13px] text-text-primary">
                  {document.uploadedByName}
                </td>

                <td className="px-5 py-3.5 text-[12.5px] tabular-nums text-text-muted">
                  {formatDate(document.uploadedAtUtc, locale)} ·{" "}
                  {formatTime(document.uploadedAtUtc, locale)}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
