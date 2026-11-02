"use client";

import { useState } from "react";
import { EyeOff, Pencil } from "lucide-react";
import { Alert, Button, CardBody, DescriptionList, Field, Modal, TextArea } from "../../../../components/ui";
import { formatDate } from "../../../../lib/format";
import { problemMessage } from "../../../../lib/http";
import type { Locale } from "../../../../lib/i18n";
import { casesApi } from "../../api";
import type { CasesDict } from "../../i18n";
import type { CaseFile, UpdateCaseFileInput } from "../../types";
import { isConflict, orNull } from "./shared";

const fromFile = (file: CaseFile) => ({
  courtName: file.case.courtName ?? "",
  courtDivision: file.courtDivision ?? "",
  courtCaseNumber: file.case.courtCaseNumber ?? "",
  caseType: file.caseType ?? "",
  description: file.description ?? "",
  internalNotes: file.internalNotes ?? "",
});

type Form = ReturnType<typeof fromFile>;

export function OverviewTab({
  file,
  version,
  canManage,
  onSaved,
  onConflict,
  t: dict,
  locale,
}: {
  file: CaseFile;
  version: string;
  canManage: boolean;
  onSaved: (file: CaseFile) => void;
  onConflict: () => Promise<void>;
  t: CasesDict;
  locale: Locale;
}) {
  const t = dict.detail;
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Form>(fromFile(file));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setValues(fromFile(file));
    setError(null);
    setEditing(true);
  };

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    // PUT replaces everything: blank fields are sent as null and cleared.
    const input: UpdateCaseFileInput = {
      courtName: orNull(values.courtName),
      courtDivision: orNull(values.courtDivision),
      courtCaseNumber: orNull(values.courtCaseNumber),
      caseType: orNull(values.caseType),
      description: orNull(values.description),
      internalNotes: orNull(values.internalNotes),
    };
    try {
      onSaved(await casesApi.updateFile(file.case.id, input, version));
      setEditing(false);
    } catch (e) {
      if (isConflict(e)) {
        setEditing(false);
        await onConflict();
      } else setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof Form, label: string, max: number) => (
    <Field
      id={`file-${key}`}
      label={label}
      maxLength={max}
      value={values[key]}
      onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
      disabled={busy}
    />
  );

  return (
    <CardBody className="space-y-6 py-5">
      <div className="flex items-start justify-between gap-3">
        <DescriptionList
          columns={2}
          items={[
            { label: t.court.name, value: file.case.courtName },
            { label: t.court.division, value: file.courtDivision },
            { label: t.court.number, value: file.case.courtCaseNumber && <span dir="ltr">{file.case.courtCaseNumber}</span> },
            { label: t.court.type, value: file.caseType },
            { label: t.description, value: file.description, full: true },
          ]}
        />
        {canManage && (
          <Button variant="secondary" className="h-9 shrink-0 px-3 text-[13px]" onClick={open}>
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.edit}
          </Button>
        )}
      </div>

      {file.internalNotes !== null && (
        <div className="rounded-lg border border-dashed border-line bg-background px-4 py-3.5">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
            <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.internalNotes}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] text-text-primary">{file.internalNotes || "—"}</p>
        </div>
      )}

      {file.updatedAtUtc && (
        <p className="text-[12px] tabular-nums text-text-muted">
          {t.updatedAt}: {formatDate(file.updatedAtUtc, locale)}
        </p>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        busy={busy}
        title={t.editFile}
        closeLabel={dict.close}
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>
              {dict.cancel}
            </Button>
            <Button loading={busy} loadingLabel={t.saving} onClick={save}>
              {t.save}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert tone="danger" show={!!error}>
            {error}
          </Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("courtName", t.court.name, 200)}
            {field("courtDivision", t.court.division, 200)}
            {field("courtCaseNumber", t.court.number, 100)}
            {field("caseType", t.court.type, 100)}
          </div>
          <TextArea
            id="file-description"
            label={t.description}
            hint={t.descriptionHint}
            maxLength={8000}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            disabled={busy}
          />
          <TextArea
            id="file-internal"
            label={t.internalNotes}
            hint={t.internalNotesHint}
            maxLength={8000}
            value={values.internalNotes}
            onChange={(e) => setValues((v) => ({ ...v, internalNotes: e.target.value }))}
            disabled={busy}
          />
        </div>
      </Modal>
    </CardBody>
  );
}
