"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { HttpError } from "../../../lib/http";
import { casesApi } from "../api";
import type { CasesDict } from "../i18n";
import type { CaseRow, CreateCaseInput, PersonOption } from "../types";

const empty: CreateCaseInput = {
  caseNumber: "",
  title: "",
  assignedLawyerEmployeeId: "",
  clientEmployeeId: "",
};

type Errors = Partial<Record<keyof CreateCaseInput, string>>;

/** The API answers failures with ProblemDetails — `detail` holds the reason. */
function messageOf(error: unknown, fallback: string): string {
  if (
    error instanceof HttpError &&
    error.body &&
    typeof error.body === "object" &&
    "detail" in error.body &&
    typeof (error.body as { detail: unknown }).detail === "string"
  ) {
    return (error.body as { detail: string }).detail;
  }
  return fallback;
}

export function NewCaseDialog({
  open,
  onClose,
  onCreated,
  people,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (row: CaseRow) => void;
  people: PersonOption[];
  t: CasesDict;
}) {
  const reduceMotion = useReducedMotion();
  const [values, setValues] = useState<CreateCaseInput>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const lawyers = people.filter((person) => person.type === "Lawyer");
  const clients = people.filter((person) => person.type === "Client");

  // Fresh form every time it opens.
  useEffect(() => {
    if (open) {
      setValues(empty);
      setErrors({});
      setFormError(null);
    }
  }, [open]);

  // Escape closes, unless a save is in flight.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const set = (key: keyof CreateCaseInput, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    const next: Errors = {};
    (Object.keys(values) as (keyof CreateCaseInput)[]).forEach((key) => {
      if (!values[key].trim()) next[key] = t.required;
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const row = await casesApi.create(
        {
          ...values,
          caseNumber: values.caseNumber.trim(),
          title: values.title.trim(),
        },
        people
      );
      onCreated(row);
    } catch (error) {
      setFormError(messageOf(error, t.createError));
    } finally {
      setSaving(false);
    }
  }

  const selectClass = (hasError: boolean) =>
    [
      "h-11 w-full rounded-lg border bg-surface px-3 text-[15px] text-text-primary outline-none transition-colors",
      "focus:border-brand-charcoal focus:ring-2 focus:ring-brand-champagne/35",
      hasError ? "border-danger" : "border-line",
    ].join(" ");

  const renderSelect = (
    id: "assignedLawyerEmployeeId" | "clientEmployeeId",
    label: string,
    options: PersonOption[]
  ) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-text-primary">
        {label}
      </label>
      <select
        id={id}
        value={values[id]}
        onChange={(event) => set(id, event.target.value)}
        disabled={saving}
        className={selectClass(!!errors[id])}
      >
        <option value="">{t.choose}</option>
        {options.map((person) => (
          <option key={person.id} value={person.id}>
            {person.fullName}
          </option>
        ))}
      </select>
      {options.length === 0 ? (
        <p className="mt-1.5 text-[12.5px] text-text-muted">{t.noPeople}</p>
      ) : (
        errors[id] && <p className="mt-1.5 text-[12.5px] text-danger">{errors[id]}</p>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !saving && onClose()}
            className="absolute inset-0 bg-brand-charcoal/40"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-case-title"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-card border border-line bg-surface shadow-card"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 id="new-case-title" className="text-[15px] font-semibold text-text-primary">
                  {t.newCase}
                </h2>
                <p className="mt-1 text-[12.5px] text-text-muted">{t.newCaseHint}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label={t.close}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </header>

            <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-4 overflow-y-auto px-5 py-5">
                <Alert tone="danger" show={!!formError}>
                  {formError}
                </Alert>

                <Field
                  id="caseNumber"
                  label={t.caseNumberLabel}
                  placeholder={t.caseNumberPlaceholder}
                  value={values.caseNumber}
                  onChange={(event) => set("caseNumber", event.target.value)}
                  error={errors.caseNumber}
                  disabled={saving}
                  dir="ltr"
                />
                <Field
                  id="title"
                  label={t.titleLabel}
                  placeholder={t.titlePlaceholder}
                  value={values.title}
                  onChange={(event) => set("title", event.target.value)}
                  error={errors.title}
                  disabled={saving}
                />
                {renderSelect("assignedLawyerEmployeeId", t.lawyerLabel, lawyers)}
                {renderSelect("clientEmployeeId", t.clientLabel, clients)}
              </div>

              <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
                  {t.cancel}
                </Button>
                <Button type="submit" loading={saving} loadingLabel={t.creating}>
                  {t.create}
                </Button>
              </footer>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
