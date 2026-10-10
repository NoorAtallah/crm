"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, User, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { problemMessage } from "../../../lib/http";
import { clientsApi } from "../api";
import type { ClientsDict } from "../i18n";
import { CLIENT_TYPES, type Client, type ClientType, type CreateClientInput } from "../types";

const empty: CreateClientInput = {
  fullName: "",
  email: "",
  password: "",
  clientType: "Individual",
};

type Errors = Partial<Record<keyof CreateClientInput, string>>;

const typeIcon: Record<ClientType, typeof User> = { Individual: User, Company: Building2 };

export function NewClientDialog({
  open,
  onClose,
  onCreated,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
  t: ClientsDict;
}) {
  const reduceMotion = useReducedMotion();
  const [values, setValues] = useState<CreateClientInput>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fresh form each time it opens (state adjusted during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(empty);
      setErrors({});
      setFormError(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const set = <K extends keyof CreateClientInput>(key: K, value: CreateClientInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    const next: Errors = {};
    if (!values.fullName.trim()) next.fullName = t.required;
    if (!values.email.trim()) next.email = t.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = t.invalidEmail;
    if (!values.password) next.password = t.required;
    else if (values.password.length < 8) next.password = t.shortPassword;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const client = await clientsApi.create({
        ...values,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
      });
      onCreated(client);
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
            aria-labelledby="new-client-title"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-card border border-line bg-surface shadow-card"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 id="new-client-title" className="text-[15px] font-semibold text-text-primary">
                  {t.addTitle}
                </h2>
                <p className="mt-1 text-[12.5px] text-text-muted">{t.addHint}</p>
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

                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-text-primary">{t.clientType}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CLIENT_TYPES.map((type) => {
                      const Icon = typeIcon[type];
                      const selected = values.clientType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => set("clientType", type)}
                          disabled={saving}
                          aria-pressed={selected}
                          className={`relative flex h-11 items-center justify-center gap-2 rounded-lg border text-[13.5px] font-medium transition-colors ${
                            selected
                              ? "border-brand-charcoal text-text-primary"
                              : "border-line text-text-muted hover:text-text-primary"
                          }`}
                        >
                          {selected && (
                            <motion.span
                              layoutId="client-type-choice"
                              className="absolute inset-0 rounded-lg bg-background"
                              transition={{ duration: 0.2, ease: "easeOut" }}
                            />
                          )}
                          <Icon className="relative h-4 w-4" strokeWidth={1.75} />
                          <span className="relative">{t.types[type]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Field
                  id="client-fullName"
                  label={t.fullName}
                  placeholder={t.fullNamePlaceholder}
                  value={values.fullName}
                  onChange={(event) => set("fullName", event.target.value)}
                  error={errors.fullName}
                  disabled={saving}
                />
                <Field
                  id="client-email"
                  type="email"
                  label={t.email}
                  placeholder={t.emailPlaceholder}
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                  error={errors.email}
                  disabled={saving}
                  dir="ltr"
                />
                <Field
                  id="client-password"
                  type="password"
                  label={t.password}
                  value={values.password}
                  onChange={(event) => set("password", event.target.value)}
                  error={errors.password}
                  disabled={saving}
                  dir="ltr"
                  autoComplete="new-password"
                />
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
