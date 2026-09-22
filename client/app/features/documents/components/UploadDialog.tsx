"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileText, Trash2, UploadCloud, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { formatFileSize } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import type { CaseRef, UploadDocumentInput } from "../types";
import type { DocumentsDict } from "../i18n";

const MAX_BYTES = 20 * 1024 * 1024;

export function UploadDialog({
  open,
  cases,
  defaultCaseId,
  submitting,
  error,
  onSubmit,
  onClose,
  t,
  locale,
}: {
  open: boolean;
  cases: CaseRef[];
  defaultCaseId: string | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: UploadDocumentInput) => void;
  onClose: () => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const [caseId, setCaseId] = useState(defaultCaseId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const caseError = touched && !caseId ? t.errorCase : undefined;
  const nameError = touched && !fileName.trim() ? t.errorFileName : undefined;
  const fileError = sizeError
    ? t.errorFileTooLarge
    : touched && !file
      ? t.errorFile
      : undefined;

  /** Picking a file names the document — the name stays editable after. */
  function accept(picked: File | undefined) {
    if (!picked) return;
    if (picked.size > MAX_BYTES) {
      setSizeError(true);
      setFile(null);
      return;
    }
    setSizeError(false);
    setFile(picked);
    setFileName(picked.name);
  }

  function reset() {
    setFile(null);
    setFileName("");
    setSizeError(false);
    setTouched(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!caseId || !file || !fileName.trim() || sizeError) return;
    onSubmit({ caseId, fileName: fileName.trim(), visibleToClient, file });
  }

  function close() {
    reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={submitting ? undefined : close}
            className="absolute inset-0 bg-brand-charcoal/40"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.uploadTitle}
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-card border border-line bg-surface shadow-card"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-text-primary">
                  {t.uploadTitle}
                </h2>
                <p className="mt-1 text-[12.5px] text-text-muted">{t.uploadHint}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t.close}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </header>

            <form
              onSubmit={submit}
              className="space-y-4 overflow-y-auto px-5 py-5"
            >
              <Alert tone="danger" show={!!error}>
                {error}
              </Alert>

              {/* File picker — also a drop target */}
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-text-primary">
                  {t.fileLabel}
                </span>

                <input
                  ref={inputRef}
                  type="file"
                  id="upload-file"
                  className="sr-only"
                  onChange={(event) => accept(event.target.files?.[0])}
                />

                {file ? (
                  <div className="flex items-center gap-3 rounded-lg border border-line bg-background px-3.5 py-3">
                    <FileText
                      className="h-5 w-5 shrink-0 text-text-muted"
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-text-primary">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-text-muted">
                        {formatFileSize(file.size, locale)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={reset}
                      aria-label={t.removeFile}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                ) : (
                  <motion.label
                    htmlFor="upload-file"
                    animate={{ scale: dragging ? 1.01 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      accept(event.dataTransfer.files?.[0]);
                    }}
                    className={[
                      "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-7 text-center transition-colors",
                      dragging
                        ? "border-brand-champagne bg-brand-champagne-light/40"
                        : fileError
                          ? "border-danger bg-surface"
                          : "border-line bg-surface hover:border-brand-charcoal",
                    ].join(" ")}
                  >
                    <UploadCloud
                      className="h-6 w-6 text-text-muted"
                      strokeWidth={1.5}
                    />
                    <span className="text-[13.5px] font-medium text-text-primary">
                      {dragging ? t.dropzoneActive : t.dropzone}
                    </span>
                    <span className="text-[12px] text-text-muted">
                      {t.dropzoneHint}
                    </span>
                  </motion.label>
                )}

                {fileError && (
                  <p className="mt-1.5 text-[12.5px] text-danger">{fileError}</p>
                )}
                <p className="mt-1.5 text-[12px] text-text-muted">
                  {t.localFileNote}
                </p>
              </div>

              <div>
                <label
                  htmlFor="upload-case"
                  className="mb-1.5 block text-[13px] font-medium text-text-primary"
                >
                  {t.caseLabel}
                </label>
                <select
                  id="upload-case"
                  value={caseId}
                  onChange={(event) => setCaseId(event.target.value)}
                  aria-invalid={!!caseError}
                  className={[
                    "h-11 w-full appearance-none rounded-lg border bg-surface px-3.5 text-[15px] text-text-primary",
                    "outline-none transition-colors focus:border-brand-charcoal focus:ring-2 focus:ring-brand-champagne/35",
                    caseError ? "border-danger" : "border-line",
                  ].join(" ")}
                >
                  <option value="">{t.casePlaceholder}</option>
                  {cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.caseNumber} · {item.title}
                    </option>
                  ))}
                </select>
                {caseError && (
                  <p className="mt-1.5 text-[12.5px] text-danger">{caseError}</p>
                )}
              </div>

              <Field
                id="upload-file-name"
                label={t.fileNameLabel}
                placeholder={t.fileNamePlaceholder}
                value={fileName}
                error={nameError}
                onChange={(event) => setFileName(event.target.value)}
              />

              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={visibleToClient}
                  onChange={(event) => setVisibleToClient(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line accent-brand-charcoal"
                />
                <span className="text-[13.5px] text-text-primary">
                  {t.visibleToClientLabel}
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={close}>
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  loading={submitting}
                  loadingLabel={t.uploading}
                >
                  {t.submitUpload}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
