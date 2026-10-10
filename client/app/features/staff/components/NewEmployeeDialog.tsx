"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { problemMessage } from "../../../lib/http";
import { staffApi } from "../api";
import type { StaffDict } from "../i18n";
import {
  EMPLOYEE_TYPES,
  type CreateEmployeeInput,
  type Employee,
  type EmployeeType,
  type Role,
} from "../types";
import { SelectField } from "./SelectField";

const MIN_PASSWORD = 8;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const empty: CreateEmployeeInput = {
  fullName: "",
  email: "",
  password: "",
  roleId: "",
  type: "Lawyer",
};

type Errors = Partial<Record<keyof CreateEmployeeInput, string>>;

export function NewEmployeeDialog({
  open,
  onClose,
  onCreated,
  roles,
  isSuperAdmin,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (employee: Employee) => void;
  roles: Role[];
  isSuperAdmin: boolean;
  t: StaffDict;
}) {
  const reduceMotion = useReducedMotion();
  const [values, setValues] = useState<CreateEmployeeInput>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(empty);
      setErrors({});
      setFormError(null);
      setShowPassword(false);
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

  const set = <K extends keyof CreateEmployeeInput>(key: K, value: CreateEmployeeInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  function validate(): Errors {
    const next: Errors = {};
    if (!values.fullName.trim()) next.fullName = t.required;
    if (!values.email.trim()) next.email = t.required;
    else if (!EMAIL.test(values.email.trim())) next.email = t.invalidEmail;
    if (!values.password) next.password = t.required;
    else if (values.password.length < MIN_PASSWORD) next.password = t.shortPassword;
    if (!values.roleId) next.roleId = t.required;
    if (values.type === "SuperAdmin" && !isSuperAdmin) next.type = t.superAdminOnly;
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const created = await staffApi.create({
        ...values,
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
      });
      onCreated(created);
    } catch (error) {
      setFormError(problemMessage(error, t.createError));
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = EMPLOYEE_TYPES.map((type: EmployeeType) => ({
    value: type,
    label: t.types[type],
    disabled: type === "SuperAdmin" && !isSuperAdmin,
  }));

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
            aria-labelledby="new-employee-title"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-card border border-line bg-surface shadow-card"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 id="new-employee-title" className="text-[15px] font-semibold text-text-primary">
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

                <Field
                  id="employee-fullName"
                  label={t.fullName}
                  placeholder={t.fullNamePlaceholder}
                  value={values.fullName}
                  onChange={(event) => set("fullName", event.target.value)}
                  error={errors.fullName}
                  disabled={saving}
                  autoComplete="off"
                />
                <Field
                  id="employee-email"
                  type="email"
                  label={t.email}
                  placeholder={t.emailPlaceholder}
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                  error={errors.email}
                  disabled={saving}
                  autoComplete="off"
                  dir="ltr"
                />
                <div>
                  <Field
                    id="employee-password"
                    type={showPassword ? "text" : "password"}
                    label={t.password}
                    value={values.password}
                    onChange={(event) => set("password", event.target.value)}
                    error={errors.password}
                    disabled={saving}
                    autoComplete="new-password"
                    dir="ltr"
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-background"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                        ) : (
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                        )}
                      </button>
                    }
                  />
                  {!errors.password && (
                    <p className="mt-1.5 text-[12.5px] text-text-muted">{t.passwordHint}</p>
                  )}
                </div>

                <SelectField
                  id="employee-type"
                  label={t.type}
                  value={values.type}
                  onChange={(event) => set("type", event.target.value as EmployeeType)}
                  options={typeOptions}
                  error={errors.type}
                  disabled={saving}
                />
                <SelectField
                  id="employee-role"
                  label={t.role}
                  value={values.roleId}
                  onChange={(event) => set("roleId", event.target.value)}
                  placeholder={t.choose}
                  options={roles.map((role) => ({ value: role.id, label: role.name }))}
                  error={errors.roleId}
                  hint={roles.length === 0 ? t.noRoles : undefined}
                  disabled={saving}
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
