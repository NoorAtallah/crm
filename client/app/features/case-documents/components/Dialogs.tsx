"use client";

import { useState } from "react";
import { Alert, Button, Field, Modal, Switch, TextArea } from "../../../components/ui";
import { problemMessage } from "../../../lib/http";
import type { CaseDocumentsDict } from "../i18n";
import type { CaseDocument, MetadataInput } from "../types";

/** Returns false when the caller already handled a conflict. */
type Submit<A extends unknown[]> = (...args: A) => Promise<boolean>;

function useForm(t: CaseDocumentsDict) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<boolean>, close: () => void) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      close();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

function useOnOpen<T>(key: T, reset: (key: T) => void) {
  const [seen, setSeen] = useState<T>(key);
  if (key !== seen) {
    setSeen(key);
    if (key) reset(key);
  }
}

const footer = (t: CaseDocumentsDict, busy: boolean, onClose: () => void, onSave: () => void, label = t.save, danger = false) => (
  <>
    <Button variant="secondary" onClick={onClose} disabled={busy}>
      {t.cancel}
    </Button>
    <Button variant={danger ? "danger" : "primary"} loading={busy} loadingLabel={t.saving} onClick={onSave}>
      {label}
    </Button>
  </>
);

export function MetadataDialog({
  doc,
  onClose,
  onSubmit,
  t,
}: {
  doc: CaseDocument | null;
  onClose: () => void;
  onSubmit: Submit<[MetadataInput]>;
  t: CaseDocumentsDict;
}) {
  const [v, setV] = useState({ title: "", category: "", description: "", visibleToClient: false });
  const { busy, error, setError, run } = useForm(t);
  useOnOpen(doc, (d) => {
    if (!d) return;
    setV({ title: d.title ?? "", category: d.category ?? "", description: d.description ?? "", visibleToClient: d.visibleToClient });
    setError(null);
  });
  const save = () =>
    run(
      () =>
        onSubmit({
          title: v.title.trim() || null,
          category: v.category.trim() || null,
          description: v.description.trim() || null,
          visibleToClient: v.visibleToClient,
        }),
      onClose
    );

  return (
    <Modal open={!!doc} onClose={onClose} busy={busy} title={t.edit} hint={doc?.fileName} closeLabel={t.close} footer={footer(t, busy, onClose, save)}>
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <Field id="doc-title" label={t.fields.title} maxLength={300} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} disabled={busy} />
        <Field
          id="doc-category"
          label={t.fields.category}
          placeholder={t.fields.categoryPlaceholder}
          maxLength={100}
          value={v.category}
          onChange={(e) => setV({ ...v, category: e.target.value })}
          disabled={busy}
        />
        <TextArea
          id="doc-description"
          label={t.fields.description}
          hint={t.fields.descriptionHint}
          rows={3}
          maxLength={4000}
          value={v.description}
          onChange={(e) => setV({ ...v, description: e.target.value })}
          disabled={busy}
        />
        <Switch checked={v.visibleToClient} onChange={(x) => setV({ ...v, visibleToClient: x })} label={t.fields.visibleToClient} disabled={busy} />
      </div>
    </Modal>
  );
}

export function ArchiveDialog({
  doc,
  onClose,
  onSubmit,
  t,
}: {
  doc: CaseDocument | null;
  onClose: () => void;
  onSubmit: Submit<[reason: string]>;
  t: CaseDocumentsDict;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, error, setError, run } = useForm(t);
  useOnOpen(doc, () => {
    setReason("");
    setTouched(false);
    setError(null);
  });
  const save = () => {
    setTouched(true);
    if (reason.trim()) run(() => onSubmit(reason.trim()), onClose);
  };
  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      busy={busy}
      title={t.archive}
      hint={doc?.title ?? doc?.fileName}
      closeLabel={t.close}
      footer={footer(t, busy, onClose, save, t.archive, true)}
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <TextArea
          id="archive-reason"
          label={t.fields.archiveReason}
          rows={3}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={touched && !reason.trim() ? t.required : undefined}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

export function ReviewDialog({
  doc,
  onClose,
  onSubmit,
  t,
}: {
  doc: CaseDocument | null;
  onClose: () => void;
  onSubmit: Submit<[notes: string | null]>;
  t: CaseDocumentsDict;
}) {
  const [notes, setNotes] = useState("");
  const { busy, error, setError, run } = useForm(t);
  useOnOpen(doc, (d) => {
    setNotes(d?.internalNotes ?? "");
    setError(null);
  });
  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      busy={busy}
      title={t.review}
      hint={doc?.title ?? doc?.fileName}
      closeLabel={t.close}
      footer={footer(t, busy, onClose, () => run(() => onSubmit(notes.trim() || null), onClose), t.review)}
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <TextArea
          id="review-notes"
          label={t.fields.reviewNotes}
          hint={t.fields.reviewNotesHint}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}
