"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, Loader2, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { formatDate, formatFileSize, formatTime } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import { documentsApi } from "../api";
import { kindOf, kindStyles } from "../fileKind";
import type { DocumentsDict } from "../i18n";
import { saveBlob } from "../saveBlob";
import type { FileEntry } from "../types";

type Preview = "image" | "frame" | "none";

function previewOf(file: FileEntry): Preview {
  if (file.contentType.startsWith("image/")) return "image";
  if (file.contentType === "application/pdf" || file.contentType.startsWith("text/")) return "frame";
  return "none";
}

/** Side drawer: metadata, an inline preview for images / PDF / text, download. */
export function FilePreviewDrawer({
  file,
  onClose,
  t,
  locale,
}: {
  file: FileEntry | null;
  onClose: () => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  // Loaded content tagged with its file id — anything else counts as "not loaded yet".
  const [loaded, setLoaded] = useState<
    { id: string; blob: Blob; url: string } | { id: string; failed: true } | null
  >(null);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const current = loaded && loaded.id === file?.id ? loaded : null;
  const blob = current && "blob" in current ? current.blob : null;
  const url = current && "url" in current ? current.url : null;
  const failed = downloadFailed || (current !== null && "failed" in current);
  const [downloading, setDownloading] = useState(false);
  const offset = locale === "ar" ? "-100%" : "100%";
  const kind = file ? previewOf(file) : "none";

  useEffect(() => {
    if (!file || previewOf(file) === "none") return;

    let cancelled = false;
    let objectUrl: string | null = null;
    const id = file.id;
    documentsApi
      .content(id)
      .then((data) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setLoaded({ id, blob: data, url: objectUrl });
      })
      .catch(() => !cancelled && setLoaded({ id, failed: true }));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    if (!file) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, onClose]);

  async function download() {
    if (!file || downloading) return;
    setDownloading(true);
    try {
      saveBlob(blob ?? (await documentsApi.content(file.id)), file.fileName);
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  // Clear a stale download error when another file is opened.
  const [lastFile, setLastFile] = useState(file);
  if (file !== lastFile) {
    setLastFile(file);
    setDownloadFailed(false);
  }

  const style = file ? kindStyles[kindOf(file.fileName)] : null;

  return (
    <AnimatePresence>
      {file && style && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/40"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-drawer-title"
            initial={reduceMotion ? { opacity: 0 } : { x: offset }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: offset }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="absolute inset-y-0 end-0 flex w-full max-w-xl flex-col border-s border-line bg-surface shadow-card"
          >
            <header className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.surface}`}>
                <style.Icon className={`h-5 w-5 ${style.text}`} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="file-drawer-title" className="truncate text-[15px] font-semibold text-text-primary">
                  {file.fileName}
                </h2>
                <p className="text-[12.5px] text-text-muted">{t.details}</p>
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
              <Alert tone="danger" show={failed}>
                {t.previewError}
              </Alert>

              <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-lg border border-line bg-background">
                {kind === "none" ? (
                  <p className="px-6 text-center text-[13px] text-text-muted">{t.noPreview}</p>
                ) : !url ? (
                  !failed && (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
                      className="inline-flex text-text-muted"
                    >
                      <Loader2 className="h-5 w-5" strokeWidth={1.75} />
                    </motion.span>
                  )
                ) : kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- object URL, not optimisable
                  <img src={url} alt={file.fileName} className="max-h-[60dvh] w-auto object-contain" />
                ) : (
                  <iframe src={url} title={file.fileName} className="h-[60dvh] w-full bg-surface" />
                )}
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[13px]">
                <dt className="text-text-muted">{t.size}</dt>
                <dd className="tabular-nums text-text-primary">{formatFileSize(file.sizeBytes, locale)}</dd>
                <dt className="text-text-muted">{t.contentType}</dt>
                <dd className="text-text-primary" dir="ltr">
                  <span className="block text-start">{file.contentType}</span>
                </dd>
                <dt className="text-text-muted">{t.added}</dt>
                <dd className="tabular-nums text-text-primary">
                  {formatDate(file.createdAtUtc, locale)} · {formatTime(file.createdAtUtc, locale)}
                </dd>
              </dl>
            </div>

            <footer className="border-t border-line px-5 py-4">
              <Button type="button" fullWidth onClick={download} loading={downloading}>
                <Download className="h-4 w-4" strokeWidth={1.75} />
                {t.download}
              </Button>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
