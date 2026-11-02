"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Alert, Button, Field, Modal, SelectField, TextArea } from "../../../components/ui";
import { problemMessage } from "../../../lib/http";
import type { AccountsDict } from "../i18n";
import { PASSWORD_MAX, PASSWORD_MIN, type AccountProfile, type ContactInput, type OfficeRef, type ProfessionalInput } from "../types";

const orNull = (s: string) => (s.trim() ? s.trim() : null);

function useOnOpen(open: boolean, reset: () => void) {
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) reset();
  }
}

function Shell({ open, title, hint, busy, error, onClose, onSave, t, children }: {
  open: boolean;
  title: string;
  hint?: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  t: AccountsDict;
  children: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={title}
      hint={hint}
      closeLabel={t.close}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button loading={busy} loadingLabel={t.saving} onClick={onSave}>
            {t.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        {children}
      </div>
    </Modal>
  );
}

/** Runs a save, keeps the modal open with the API's message on failure. */
function useSave(t: AccountsDict, onClose: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

/* ── account basics ── */

export function AccountDialog({ open, kind, initial, onClose, onSubmit, t }: {
  open: boolean;
  kind: "employee" | "client";
  initial: { fullName: string; email: string; clientType?: string };
  onClose: () => void;
  onSubmit: (v: { fullName: string; email: string; clientType: string }) => Promise<void>;
  t: AccountsDict;
}) {
  const [v, setV] = useState({ fullName: "", email: "", clientType: "Individual" });
  const [touched, setTouched] = useState(false);
  const { busy, error, setError, run } = useSave(t, onClose);
  useOnOpen(open, () => {
    setV({ fullName: initial.fullName, email: initial.email, clientType: initial.clientType || "Individual" });
    setTouched(false);
    setError(null);
  });
  const save = () => {
    setTouched(true);
    if (!v.fullName.trim() || !v.email.trim()) return;
    run(() => onSubmit({ fullName: v.fullName.trim(), email: v.email.trim(), clientType: v.clientType }));
  };
  return (
    <Shell open={open} title={t.editAccount} hint={t.signsOut} busy={busy} error={error} onClose={onClose} onSave={save} t={t}>
      <Field id="acc-name" label={t.fields.fullName} value={v.fullName} onChange={(e) => setV({ ...v, fullName: e.target.value })} error={touched && !v.fullName.trim() ? t.required : undefined} disabled={busy} />
      <Field id="acc-email" type="email" dir="ltr" label={t.fields.email} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} error={touched && !v.email.trim() ? t.required : undefined} disabled={busy} />
      {kind === "client" && (
        <SelectField
          id="acc-type"
          label={t.fields.clientType}
          value={v.clientType}
          onChange={(e) => setV({ ...v, clientType: e.target.value })}
          options={(["Individual", "Company"] as const).map((x) => ({ value: x, label: t.clientTypes[x] }))}
          disabled={busy}
        />
      )}
    </Shell>
  );
}

/* ── contact ── */

export function ContactDialog({ open, profile, onClose, onSubmit, t }: {
  open: boolean;
  profile: AccountProfile | null;
  onClose: () => void;
  onSubmit: (input: ContactInput) => Promise<void>;
  t: AccountsDict;
}) {
  const keys = ["phone", "alternatePhone", "city", "country", "identifier", "organizationName", "address"] as const;
  const [v, setV] = useState<Record<(typeof keys)[number], string>>({ phone: "", alternatePhone: "", city: "", country: "", identifier: "", organizationName: "", address: "" });
  const { busy, error, setError, run } = useSave(t, onClose);
  useOnOpen(open, () => {
    setV(Object.fromEntries(keys.map((k) => [k, profile?.[k] ?? ""])) as typeof v);
    setError(null);
  });
  const field = (k: (typeof keys)[number], max: number, ltr = false) => (
    <Field id={`contact-${k}`} label={t.fields[k]} maxLength={max} dir={ltr ? "ltr" : undefined} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} disabled={busy} />
  );
  return (
    <Shell
      open={open}
      title={t.editContact}
      busy={busy}
      error={error}
      onClose={onClose}
      onSave={() =>
        run(() =>
          onSubmit({
            phone: orNull(v.phone),
            alternatePhone: orNull(v.alternatePhone),
            address: orNull(v.address),
            city: orNull(v.city),
            country: orNull(v.country),
            identifier: orNull(v.identifier),
            organizationName: orNull(v.organizationName),
          })
        )
      }
      t={t}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("phone", 50, true)}
        {field("alternatePhone", 50, true)}
        {field("city", 120)}
        {field("country", 120)}
        {field("identifier", 100, true)}
        {field("organizationName", 200)}
      </div>
      <TextArea id="contact-address" label={t.fields.address} rows={2} maxLength={1000} value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} disabled={busy} />
    </Shell>
  );
}

/* ── professional (staff) ── */

export function ProfessionalDialog({ open, profile, offices, onClose, onSubmit, t }: {
  open: boolean;
  profile: AccountProfile | null;
  offices: OfficeRef[];
  onClose: () => void;
  onSubmit: (input: ProfessionalInput) => Promise<void>;
  t: AccountsDict;
}) {
  const [v, setV] = useState({ officeId: "", jobTitle: "", barAssociationNumber: "", specialization: "", licenseExpiresOn: "" });
  const [touched, setTouched] = useState(false);
  const { busy, error, setError, run } = useSave(t, onClose);
  useOnOpen(open, () => {
    setV({
      officeId: profile?.officeId ?? "",
      jobTitle: profile?.jobTitle ?? "",
      barAssociationNumber: profile?.barAssociationNumber ?? "",
      specialization: profile?.specialization ?? "",
      licenseExpiresOn: profile?.licenseExpiresOn?.slice(0, 10) ?? "",
    });
    setTouched(false);
    setError(null);
  });
  const save = () => {
    setTouched(true);
    if (!v.officeId || !v.jobTitle.trim()) return;
    run(() =>
      onSubmit({
        officeId: v.officeId,
        jobTitle: v.jobTitle.trim(),
        barAssociationNumber: orNull(v.barAssociationNumber),
        specialization: orNull(v.specialization),
        licenseExpiresOn: v.licenseExpiresOn || null,
      })
    );
  };
  return (
    <Shell open={open} title={t.editProfessional} busy={busy} error={error} onClose={onClose} onSave={save} t={t}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="pro-office" label={t.fields.office} value={v.officeId} placeholder="—" onChange={(e) => setV({ ...v, officeId: e.target.value })} options={offices.map((o) => ({ value: o.id, label: o.name }))} error={touched && !v.officeId ? t.required : undefined} disabled={busy} />
        <Field id="pro-title" label={t.fields.jobTitle} maxLength={120} value={v.jobTitle} onChange={(e) => setV({ ...v, jobTitle: e.target.value })} error={touched && !v.jobTitle.trim() ? t.required : undefined} disabled={busy} />
        <Field id="pro-bar" dir="ltr" label={t.fields.barAssociationNumber} maxLength={80} value={v.barAssociationNumber} onChange={(e) => setV({ ...v, barAssociationNumber: e.target.value })} disabled={busy} />
        <Field id="pro-license" type="date" dir="ltr" label={t.fields.licenseExpiresOn} value={v.licenseExpiresOn} onChange={(e) => setV({ ...v, licenseExpiresOn: e.target.value })} disabled={busy} />
      </div>
      <Field id="pro-spec" label={t.fields.specialization} maxLength={300} value={v.specialization} onChange={(e) => setV({ ...v, specialization: e.target.value })} disabled={busy} />
    </Shell>
  );
}

/* ── passwords ── */

function PasswordField({ id, label, value, onChange, error, disabled }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field
      id={id}
      type={show ? "text" : "password"}
      dir="ltr"
      // "new-password" stops browsers from autofilling a saved login here.
      autoComplete="new-password"
      name={id}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={disabled}
      trailing={
        <button type="button" onClick={() => setShow((s) => !s)} className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:text-text-primary" tabIndex={-1}>
          {show ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      }
    />
  );
}

/** New password + confirmation, with the API's length rule. `withCurrent` adds the current-password field. */
export function PasswordFields({ withCurrent, busy, touched, values, onChange, t }: {
  withCurrent: boolean;
  busy: boolean;
  touched: boolean;
  values: { current: string; next: string; confirm: string };
  onChange: (v: { current: string; next: string; confirm: string }) => void;
  t: AccountsDict;
}) {
  const lenOk = values.next.length >= PASSWORD_MIN && values.next.length <= PASSWORD_MAX;
  return (
    <>
      {withCurrent && (
        <PasswordField id="pw-current" label={t.currentPassword} value={values.current} onChange={(x) => onChange({ ...values, current: x })} error={touched && !values.current ? t.required : undefined} disabled={busy} />
      )}
      <PasswordField id="pw-new" label={t.newPassword} value={values.next} onChange={(x) => onChange({ ...values, next: x })} error={touched && !lenOk ? t.passwordLength : undefined} disabled={busy} />
      <PasswordField id="pw-confirm" label={t.confirmPassword} value={values.confirm} onChange={(x) => onChange({ ...values, confirm: x })} error={touched && values.confirm !== values.next ? t.passwordMismatch : undefined} disabled={busy} />
      {!touched && <p className="-mt-2 text-[12px] text-text-muted">{t.passwordLength}</p>}
    </>
  );
}

export const passwordsValid = (v: { current: string; next: string; confirm: string }, withCurrent: boolean) =>
  (!withCurrent || !!v.current) && v.next.length >= PASSWORD_MIN && v.next.length <= PASSWORD_MAX && v.next === v.confirm;

export function ResetPasswordDialog({ open, name, onClose, onSubmit, t }: {
  open: boolean;
  name: string;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
  t: AccountsDict;
}) {
  const [v, setV] = useState({ current: "", next: "", confirm: "" });
  const [touched, setTouched] = useState(false);
  const { busy, error, setError, run } = useSave(t, onClose);
  useOnOpen(open, () => {
    setV({ current: "", next: "", confirm: "" });
    setTouched(false);
    setError(null);
  });
  return (
    <Shell
      open={open}
      title={t.resetPassword}
      hint={`${name} — ${t.resetHint}`}
      busy={busy}
      error={error}
      onClose={onClose}
      onSave={() => {
        setTouched(true);
        if (passwordsValid(v, false)) run(() => onSubmit(v.next));
      }}
      t={t}
    >
      <PasswordFields withCurrent={false} busy={busy} touched={touched} values={v} onChange={setV} t={t} />
    </Shell>
  );
}
