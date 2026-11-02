"use client";

import { Field, SegmentedControl, SelectField, Switch, TextArea } from "../../../components/ui";
import type { AppointmentsDict } from "../i18n";
import type { AppointmentKind, LawyerOption } from "../types";
import type { AppointmentForm, FormErrors } from "./form";

/** The editable appointment fields. Shared by schedule, edit and follow-up. */
export function DetailsFields({
  idPrefix,
  values,
  onChange,
  errors,
  lawyers,
  disabled,
  t,
}: {
  idPrefix: string;
  values: AppointmentForm;
  onChange: (next: AppointmentForm) => void;
  errors: FormErrors;
  lawyers: LawyerOption[];
  disabled: boolean;
  t: AppointmentsDict;
}) {
  const set = <K extends keyof AppointmentForm>(key: K, value: AppointmentForm[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-text-primary">{t.fields.kind}</p>
        <SegmentedControl<AppointmentKind>
          id={`${idPrefix}-kind`}
          value={values.kind}
          onChange={(k) => set("kind", k)}
          options={[
            { key: "Hearing", label: t.kinds.Hearing },
            { key: "Meeting", label: t.kinds.Meeting },
          ]}
        />
      </div>
      <Field
        id={`${idPrefix}-title`}
        label={t.fields.title}
        placeholder={t.fields.titlePlaceholder}
        maxLength={300}
        value={values.title}
        onChange={(e) => set("title", e.target.value)}
        error={errors.title}
        disabled={disabled}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${idPrefix}-start`}
          type="datetime-local"
          dir="ltr"
          label={t.fields.startsAt}
          value={values.startsAt}
          onChange={(e) => {
            // Keep the duration when the start moves.
            const oldStart = new Date(values.startsAt).getTime();
            const oldEnd = new Date(values.endsAt).getTime();
            const next = e.target.value;
            const dur = oldEnd - oldStart;
            if (next && dur > 0) {
              const end = new Date(new Date(next).getTime() + dur);
              const pad = (n: number) => String(n).padStart(2, "0");
              const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
              onChange({ ...values, startsAt: next, endsAt: endStr });
            } else set("startsAt", next);
          }}
          error={errors.startsAt}
          disabled={disabled}
        />
        <Field
          id={`${idPrefix}-end`}
          type="datetime-local"
          dir="ltr"
          label={t.fields.endsAt}
          value={values.endsAt}
          onChange={(e) => set("endsAt", e.target.value)}
          error={errors.endsAt}
          disabled={disabled}
        />
      </div>
      <Field
        id={`${idPrefix}-location`}
        label={t.fields.location}
        placeholder={t.fields.locationPlaceholder}
        maxLength={1000}
        value={values.location}
        onChange={(e) => set("location", e.target.value)}
        error={errors.location}
        disabled={disabled}
      />
      <SelectField
        id={`${idPrefix}-lawyer`}
        label={t.fields.lawyer}
        value={values.lawyerId}
        placeholder="—"
        onChange={(e) => set("lawyerId", e.target.value)}
        options={lawyers.map((l) => ({ value: l.id, label: l.fullName }))}
        error={errors.lawyerId}
        disabled={disabled}
      />
      <TextArea
        id={`${idPrefix}-notes`}
        label={t.fields.internalNotes}
        hint={t.fields.internalNotesHint}
        rows={3}
        maxLength={8000}
        value={values.internalNotes}
        onChange={(e) => set("internalNotes", e.target.value)}
        disabled={disabled}
      />
      <Switch
        checked={values.visibleToClient}
        onChange={(v) => set("visibleToClient", v)}
        label={t.fields.visibleToClient}
        hint={t.fields.visibleHint}
        disabled={disabled}
      />
    </div>
  );
}
