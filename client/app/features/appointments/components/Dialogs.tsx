"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Alert, Button, Modal, SelectField, Switch, TextArea } from "../../../components/ui";
import { problemMessage } from "../../../lib/http";
import type { AppointmentsDict } from "../i18n";
import type { AppointmentDetails, CaseAppointment, CaseOption, LawyerOption } from "../types";
import { DetailsFields } from "./DetailsFields";
import { blankForm, formFrom, toDetails, validate, type AppointmentForm, type FormErrors } from "./form";

/** Runs a submit; returns false on a handled conflict so the caller closes. */
type Submit<A extends unknown[]> = (...args: A) => Promise<boolean>;

function useRun(t: AppointmentsDict) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<boolean>, onDone: () => void) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // true = saved, false = conflict handled by the caller; close either way.
      await fn();
      onDone();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

/** Resets local state whenever `key` changes to a new non-null value. */
function useOnOpen<T>(key: T, reset: (key: T) => void) {
  const [seen, setSeen] = useState<T>(key);
  if (key !== seen) {
    setSeen(key);
    if (key) reset(key);
  }
}

/* ───────────── schedule / edit ───────────── */

export function AppointmentFormDialog({
  open,
  editing,
  fixedCaseId,
  cases,
  lawyers,
  defaultLawyerId,
  onClose,
  onSubmit,
  t,
}: {
  /** Truthy while open. A new object each time it opens. */
  open: object | null;
  editing: CaseAppointment | null;
  /** Set on a case page; otherwise the user picks from `cases`. */
  fixedCaseId?: string;
  cases: CaseOption[];
  lawyers: LawyerOption[];
  defaultLawyerId?: string;
  onClose: () => void;
  onSubmit: Submit<[caseId: string, details: AppointmentDetails, reason: string]>;
  t: AppointmentsDict;
}) {
  const [values, setValues] = useState<AppointmentForm>(blankForm());
  const [caseId, setCaseId] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<FormErrors & { case?: string; reason?: string }>({});
  const { busy, error, setError, run } = useRun(t);

  useOnOpen(open, () => {
    const initialCase = fixedCaseId ?? editing?.caseId ?? "";
    const caseLawyer = cases.find((c) => c.id === initialCase)?.assignedLawyerEmployeeId;
    setValues(editing ? formFrom(editing) : blankForm(defaultLawyerId ?? caseLawyer ?? ""));
    setCaseId(initialCase);
    setReason("");
    setErrors({});
    setError(null);
  });

  const submit = () => {
    const e: typeof errors = validate(values, t);
    if (!caseId) e.case = t.required;
    if (editing && !reason.trim()) e.reason = t.required;
    setErrors(e);
    if (Object.keys(e).length) return;
    run(() => onSubmit(caseId, toDetails(values), reason.trim()), onClose);
  };

  const activeCases = cases.filter((c) => c.isActive);

  return (
    <Modal
      open={!!open}
      onClose={onClose}
      busy={busy}
      title={editing ? t.edit : t.schedule}
      closeLabel={t.close}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.back}
          </Button>
          <Button loading={busy} loadingLabel={t.saving} onClick={submit}>
            {t.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        {!fixedCaseId && !editing && activeCases.length === 0 && (
          <Alert tone="info">
            {t.noCases}{" "}
            <Link href="/cases" className="font-medium underline underline-offset-2">
              {t.goToCases}
            </Link>
          </Alert>
        )}
        {!fixedCaseId && !editing && activeCases.length > 0 && (
          <SelectField
            id="appt-case"
            label={t.fields.case}
            value={caseId}
            placeholder="—"
            onChange={(e) => {
              const id = e.target.value;
              setCaseId(id);
              const lawyer = cases.find((c) => c.id === id)?.assignedLawyerEmployeeId;
              if (lawyer && !values.lawyerId) setValues((v) => ({ ...v, lawyerId: lawyer }));
            }}
            options={activeCases.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.title}` }))}
            error={errors.case}
            disabled={busy}
          />
        )}
        <DetailsFields
          idPrefix="appt"
          values={values}
          onChange={setValues}
          errors={errors}
          lawyers={lawyers}
          disabled={busy}
          t={t}
        />
        {editing && (
          <TextArea
            id="appt-reason"
            label={t.fields.reason}
            hint={t.fields.reasonHint}
            rows={2}
            maxLength={4000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={errors.reason}
            disabled={busy}
          />
        )}
      </div>
    </Modal>
  );
}

/* ───────────── cancel ───────────── */

export function CancelDialog({
  target,
  onClose,
  onSubmit,
  t,
}: {
  target: CaseAppointment | null;
  onClose: () => void;
  onSubmit: Submit<[reason: string]>;
  t: AppointmentsDict;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, error, setError, run } = useRun(t);
  useOnOpen(target, () => {
    setReason("");
    setTouched(false);
    setError(null);
  });

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      busy={busy}
      title={t.cancel}
      hint={target?.title}
      closeLabel={t.close}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.back}
          </Button>
          <Button
            variant="danger"
            loading={busy}
            loadingLabel={t.saving}
            onClick={() => {
              setTouched(true);
              if (reason.trim()) run(() => onSubmit(reason.trim()), onClose);
            }}
          >
            {t.cancel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <TextArea
          id="cancel-reason"
          label={t.fields.cancelReason}
          rows={3}
          maxLength={4000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={touched && !reason.trim() ? t.required : undefined}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

/* ───────────── complete (+ optional follow-up) ───────────── */

export function CompleteDialog({
  target,
  caseIsActive,
  lawyers,
  onClose,
  onSubmit,
  t,
}: {
  target: CaseAppointment | null;
  /** Follow-ups can't be added to a closed case. */
  caseIsActive: boolean;
  lawyers: LawyerOption[];
  onClose: () => void;
  onSubmit: Submit<[outcome: string, followUp: AppointmentDetails | null]>;
  t: AppointmentsDict;
}) {
  const [outcome, setOutcome] = useState("");
  const [withFollowUp, setWithFollowUp] = useState(false);
  const [follow, setFollow] = useState<AppointmentForm>(blankForm());
  const [errors, setErrors] = useState<FormErrors & { outcome?: string }>({});
  const { busy, error, setError, run } = useRun(t);
  useOnOpen(target, (item) => {
    if (!item) return;
    setOutcome("");
    setWithFollowUp(false);
    setFollow({ ...blankForm(item.assignedLawyerEmployeeId ?? "", item.startsAtUtc), kind: item.kind, title: item.title, location: item.location ?? "" });
    setErrors({});
    setError(null);
  });

  const notStarted = !!target && new Date(target.startsAtUtc).getTime() > Date.now();

  const submit = () => {
    if (!target) return;
    const e: typeof errors = withFollowUp ? validate(follow, t, target.startsAtUtc) : {};
    if (!outcome.trim()) e.outcome = t.required;
    setErrors(e);
    if (Object.keys(e).length) return;
    run(() => onSubmit(outcome.trim(), withFollowUp ? toDetails(follow) : null), onClose);
  };

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      busy={busy}
      title={t.complete}
      hint={target?.title}
      closeLabel={t.close}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.back}
          </Button>
          <Button loading={busy} loadingLabel={t.saving} disabled={notStarted} onClick={submit}>
            {t.complete}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="warning" show={notStarted}>
          {t.errors.completeTooEarly}
        </Alert>
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <TextArea
          id="complete-outcome"
          label={t.fields.outcome}
          hint={t.fields.outcomeHint}
          rows={3}
          maxLength={8000}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          error={errors.outcome}
          disabled={busy}
        />
        <div className="rounded-lg border border-line px-4 py-3">
          <Switch
            checked={withFollowUp}
            onChange={setWithFollowUp}
            label={t.fields.followUp}
            hint={caseIsActive ? t.fields.followUpHint : t.errors.closedCase}
            disabled={busy || !caseIsActive}
          />
          <AnimatePresence initial={false}>
            {withFollowUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <DetailsFields
                    idPrefix="followup"
                    values={follow}
                    onChange={setFollow}
                    errors={errors}
                    lawyers={lawyers}
                    disabled={busy}
                    t={t}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
