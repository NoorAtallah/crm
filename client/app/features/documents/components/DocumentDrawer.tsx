"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Eye, EyeOff, FileText, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { formatDate, formatFileSize, formatTime } from "../../../lib/format";
import { interpolate, type Locale } from "../../../lib/i18n";
import type { DocumentRow } from "../types";
import type { DocumentsDict } from "../i18n";

/**
 * Detail panel and review form in one. Slides in from the reading edge, so
 * it opens from the right in English and from the left in Arabic.
 */
export function DocumentDrawer({
  document,
  canReview,
  submitting,
  error,
  onReview,
  onClose,
  t,
  locale,
}: {
  document: DocumentRow | null;
  canReview: boolean;
  submitting: boolean;
  error: string | null;
  onReview: (documentId: string, internalNotes: string) => void;
  onClose: () => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [notes, setNotes] = useState("");
  const offscreen = locale === "ar" ? "-100%" : "100%";

  useEffect(() => {
    setNotes("");
  }, [document?.id]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {document && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-brand-charcoal/40"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t.details}
            initial={reduceMotion ? false : { x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-line bg-surface"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText
                    className="h-4 w-4 shrink-0 text-text-muted"
                    strokeWidth={1.75}
                  />
                  <h2 className="truncate text-[15px] font-semibold text-text-primary">
                    {document.fileName}
                  </h2>
                </div>
                <p className="mt-1 text-[12.5px] text-text-muted">
                  {document.caseNumber} · {document.caseTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.close}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={document.status === "Reviewed" ? "success" : "warning"}>
                  {t.status[document.status]}
                </Badge>
                <Badge tone={document.visibleToClient ? "info" : "neutral"}>
                  {document.visibleToClient ? (
                    <Eye className="me-1 h-3 w-3" strokeWidth={2} />
                  ) : (
                    <EyeOff className="me-1 h-3 w-3" strokeWidth={2} />
                  )}
                  {document.visibleToClient ? t.visibleToClient : t.internalOnly}
                </Badge>
              </div>

              <dl className="divide-y divide-line rounded-lg border border-line">
                <Row label={t.columns.uploadedBy} value={document.uploadedByName} />
                <Row
                  label={t.columns.uploadedAt}
                  value={`${formatDate(document.uploadedAtUtc, locale)} · ${formatTime(
                    document.uploadedAtUtc,
                    locale
                  )}`}
                />
                {document.sizeBytes !== null && (
                  <Row
                    label={t.size}
                    value={formatFileSize(document.sizeBytes, locale)}
                  />
                )}
                <Row
                  label={t.review}
                  value={
                    document.reviewedByName
                      ? interpolate(t.reviewedBy, { name: document.reviewedByName })
                      : t.notReviewed
                  }
                />
              </dl>

              {document.previewUrl && (
                <a
                  href={document.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2.5 text-[13.5px] font-medium text-text-primary transition-colors hover:border-brand-charcoal"
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                  {t.openFile}
                </a>
              )}

              <div>
                <h3 className="text-[13px] font-medium text-text-primary">
                  {t.internalNotes}
                </h3>
                <p className="mt-0.5 text-[12px] text-text-muted">
                  {t.internalNotesHint}
                </p>
                <p className="mt-2 rounded-lg bg-background px-3.5 py-3 text-[13px] leading-relaxed text-text-primary">
                  {document.internalNotes ?? t.noNotes}
                </p>
              </div>

              {document.status === "Uploaded" && canReview && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    onReview(document.id, notes);
                  }}
                  className="space-y-3 rounded-lg border border-line p-4"
                >
                  <div>
                    <h3 className="text-[13px] font-semibold text-text-primary">
                      {t.reviewTitle}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-text-muted">
                      {t.reviewHint}
                    </p>
                  </div>

                  <Alert tone="danger" show={!!error}>
                    {error}
                  </Alert>

                  <label className="block">
                    <span className="sr-only">{t.internalNotes}</span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-charcoal focus:ring-2 focus:ring-brand-champagne/35"
                      placeholder={t.internalNotes}
                    />
                  </label>

                  <Button
                    type="submit"
                    variant="accent"
                    fullWidth
                    loading={submitting}
                    loadingLabel={t.reviewing}
                  >
                    {t.submitReview}
                  </Button>
                </form>
              )}

              {document.status === "Uploaded" && !canReview && (
                <Alert tone="info">{t.noReviewPermission}</Alert>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <dt className="text-[12.5px] text-text-muted">{label}</dt>
      <dd className="text-[13px] text-text-primary">{value}</dd>
    </div>
  );
}
