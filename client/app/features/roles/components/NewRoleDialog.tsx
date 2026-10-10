"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { problemMessage } from "../../../lib/http";
import { rolesApi } from "../api";
import type { RolesDict } from "../i18n";
import type { CreateRoleInput, Role } from "../types";

const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** "Trainee Lawyer" → "trainee-lawyer". Only suggests; the user can edit it. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Errors = Partial<Record<keyof CreateRoleInput, string>>;

export function NewRoleDialog({
  open,
  onClose,
  onCreated,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (role: Role) => void;
  t: RolesDict;
}) {
  const reduceMotion = useReducedMotion();
  const [values, setValues] = useState<CreateRoleInput>({ key: "", name: "" });
  const [keyTouched, setKeyTouched] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({ key: "", name: "" });
      setKeyTouched(false);
      setErrors({});
      setFormError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    const next: Errors = {};
    const name = values.name.trim();
    const key = values.key.trim().toLowerCase();
    if (!name) next.name = t.required;
    if (!key) next.key = t.required;
    else if (!KEY.test(key)) next.key = t.invalidKey;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      onCreated(await rolesApi.create({ key, name }));
    } catch (error) {
      setFormError(problemMessage(error, t.createError));
    } finally {
      setSaving(false);
    }
  }

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
            aria-labelledby="new-role-title"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-card border border-line bg-surface shadow-card"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 id="new-role-title" className="text-[15px] font-semibold text-text-primary">
                  {t.createTitle}
                </h2>
                <p className="mt-1 text-[12.5px] text-text-muted">{t.createHint}</p>
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
                  id="role-name"
                  label={t.nameLabel}
                  placeholder={t.namePlaceholder}
                  value={values.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setValues((prev) => ({
                      name,
                      key: keyTouched ? prev.key : slugify(name),
                    }));
                  }}
                  error={errors.name}
                  disabled={saving}
                  autoComplete="off"
                />
                <div>
                  <Field
                    id="role-key"
                    label={t.keyLabel}
                    placeholder={t.keyPlaceholder}
                    value={values.key}
                    onChange={(event) => {
                      setKeyTouched(true);
                      setValues((prev) => ({ ...prev, key: event.target.value }));
                    }}
                    error={errors.key}
                    disabled={saving}
                    autoComplete="off"
                    dir="ltr"
                  />
                  {!errors.key && (
                    <p className="mt-1.5 text-[12.5px] text-text-muted">{t.keyHint}</p>
                  )}
                </div>
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
