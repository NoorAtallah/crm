"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";
import { formatFileSize } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import type { DocumentsDict } from "../i18n";
import type { UploadItem } from "../types";

/** Floating panel listing uploads with live progress. */
export function UploadQueue({
  items,
  onClear,
  t,
  locale,
}: {
  items: UploadItem[];
  onClear: () => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const busy = items.some((item) => item.state === "uploading");

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-4 end-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-card border border-line bg-surface shadow-card"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-text-primary">
              <UploadCloud className="h-4 w-4" strokeWidth={1.75} />
              {busy ? t.uploading : t.uploads}
            </p>
            {!busy && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-md px-2 py-1 text-[12.5px] text-text-muted transition-colors hover:bg-background hover:text-text-primary"
              >
                {t.clear}
              </button>
            )}
          </header>
          <ul className="max-h-[260px] divide-y divide-line overflow-y-auto">
            {items.map((item) => (
              <li key={item.key} className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[13px] text-text-primary">{item.name}</p>
                  {item.state === "done" && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" strokeWidth={1.75} />
                  )}
                  {item.state === "error" && (
                    <AlertCircle className="h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
                  )}
                </div>
                <p
                  className={`mt-0.5 text-[11.5px] ${item.state === "error" ? "text-danger" : "text-text-muted"}`}
                >
                  {item.state === "error"
                    ? item.error ?? t.uploadFailed
                    : `${formatFileSize(item.size, locale)} · ${
                        item.state === "done" ? t.uploaded : `${Math.round(item.progress * 100)}%`
                      }`}
                </p>
                {item.state === "uploading" && (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background">
                    <motion.div
                      animate={{ width: `${item.progress * 100}%` }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-brand-charcoal"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
