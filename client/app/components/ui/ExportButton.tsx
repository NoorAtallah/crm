"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { problemMessage } from "../../lib/http";
import { exportFile, type ExportFormat } from "../../lib/exports";
import { Spinner } from "./Spinner";

const labels = {
  ar: { export: "تصدير", xlsx: "Excel", pdf: "PDF", failed: "تعذّر التصدير. ضيّق الفلاتر وأعد المحاولة." },
  en: { export: "Export", xlsx: "Excel", pdf: "PDF", failed: "Export failed. Narrow the filters and try again." },
};

/**
 * Export menu for a list or record. Downloads with the session token and
 * shows the API's reason (e.g. too many rows) when it refuses.
 */
export function ExportButton({
  path,
  filters,
  fileName,
  formats = ["Xlsx", "Pdf"],
  locale,
  compact = false,
}: {
  /** Path under /api/exports, e.g. "cases" or `cases/${id}/file`. */
  path: string;
  filters?: object;
  /** Without extension. */
  fileName: string;
  formats?: ExportFormat[];
  locale: "ar" | "en";
  compact?: boolean;
}) {
  const t = labels[locale];
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open && !error) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, error]);

  const run = async (format: ExportFormat) => {
    setOpen(false);
    setBusy(true);
    setError(null);
    try {
      const blob = await exportFile(path, format, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${format === "Pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setError(problemMessage(e, t.failed));
    } finally {
      setBusy(false);
    }
  };

  const single = formats.length === 1;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => (single ? run(formats[0]) : setOpen((o) => !o))}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface font-medium text-text-primary transition-colors hover:border-brand-charcoal disabled:opacity-60 ${
          compact ? "h-9 px-2.5 text-[12.5px]" : "h-9 px-3 text-[13px]"
        }`}
      >
        {busy ? <Spinner size={14} /> : <Download className="h-4 w-4" strokeWidth={1.75} />}
        {single ? (formats[0] === "Pdf" ? t.pdf : t.xlsx) : t.export}
        {!single && <ChevronDown className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute end-0 top-10 z-30 min-w-36 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-card"
          >
            {formats.map((f) => {
              const Icon = f === "Pdf" ? FileText : FileSpreadsheet;
              return (
                <li key={f}>
                  <button type="button" onClick={() => run(f)} className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-text-primary hover:bg-background">
                    <Icon className={`h-4 w-4 ${f === "Pdf" ? "text-danger" : "text-success"}`} strokeWidth={1.75} />
                    {f === "Pdf" ? t.pdf : t.xlsx}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="absolute end-0 top-10 z-30 w-64 rounded-lg bg-danger-surface px-3 py-2 text-[12.5px] text-danger shadow-card"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
