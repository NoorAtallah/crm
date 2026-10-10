"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/** Centred dialog shell shared by the documents dialogs. */
export function Modal({
  open,
  onClose,
  busy = false,
  title,
  hint,
  labelledBy,
  closeLabel,
  children,
  footer,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  title: string;
  hint?: ReactNode;
  labelledBy: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !busy && onClose()}
            className="absolute inset-0 bg-brand-charcoal/40"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`relative flex max-h-[90dvh] w-full ${maxWidth} flex-col rounded-card border border-line bg-surface shadow-card`}
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 id={labelledBy} className="truncate text-[15px] font-semibold text-text-primary">
                  {title}
                </h2>
                {hint && <p className="mt-1 text-[12.5px] text-text-muted">{hint}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                aria-label={closeLabel}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
