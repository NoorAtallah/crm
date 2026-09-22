"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Folder } from "lucide-react";
import { formatFileSize, formatNumber } from "../../../lib/format";
import { interpolate, type Locale } from "../../../lib/i18n";
import type { CaseRef, DocumentRow } from "../types";
import type { DocumentsDict } from "../i18n";

export interface FolderSummary extends CaseRef {
  fileCount: number;
  totalBytes: number;
  pendingReview: number;
}

/** One folder per case — the API hangs every document off a caseId. */
export function foldersOf(
  cases: CaseRef[],
  documents: DocumentRow[]
): FolderSummary[] {
  return cases.map((item) => {
    const own = documents.filter((document) => document.caseId === item.id);
    return {
      ...item,
      fileCount: own.length,
      totalBytes: own.reduce(
        (total, document) => total + (document.sizeBytes ?? 0),
        0
      ),
      pendingReview: own.filter((document) => document.status === "Uploaded")
        .length,
    };
  });
}

export function FolderGrid({
  folders,
  onOpen,
  t,
  locale,
}: {
  folders: FolderSummary[];
  onOpen: (folder: FolderSummary) => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {folders.map((folder, index) => (
        <motion.button
          key={folder.id}
          type="button"
          onClick={() => onOpen(folder)}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            ease: "easeOut",
            delay: Math.min(index * 0.04, 0.2),
          }}
          whileHover={reduceMotion ? undefined : { y: -3 }}
          className="group rounded-card border border-line bg-surface p-4 text-start transition-colors hover:border-brand-charcoal"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-champagne-light">
              <Folder
                className="h-5 w-5 text-brand-charcoal"
                strokeWidth={1.75}
              />
            </span>
            <Chevron
              className="h-4 w-4 text-text-muted transition-colors group-hover:text-brand-charcoal"
              strokeWidth={1.75}
            />
          </div>

          <p className="mt-3.5 truncate text-[14px] font-semibold text-text-primary">
            {folder.caseNumber}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-text-muted">
            {folder.title}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 text-[12.5px]">
            <span className="text-text-muted">
              {interpolate(t.filesCount, {
                count: formatNumber(folder.fileCount, locale),
              })}
            </span>
            <span className="font-medium tabular-nums text-text-primary">
              {formatFileSize(folder.totalBytes, locale)}
            </span>
          </div>

          {folder.pendingReview > 0 && (
            <p className="mt-2 text-[12px] text-warning">
              {interpolate(t.pendingCount, {
                count: formatNumber(folder.pendingReview, locale),
              })}
            </p>
          )}
        </motion.button>
      ))}
    </div>
  );
}
