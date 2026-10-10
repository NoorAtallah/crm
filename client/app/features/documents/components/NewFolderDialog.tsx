"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { problemMessage } from "../../../lib/http";
import { interpolate } from "../../../lib/i18n";
import { documentsApi } from "../api";
import type { DocumentsDict } from "../i18n";
import type { Folder } from "../types";
import { Modal } from "./Modal";

export function NewFolderDialog({
  open,
  parent,
  onClose,
  onCreated,
  t,
}: {
  open: boolean;
  parent: { id: string | null; name: string };
  onClose: () => void;
  onCreated: (folder: Folder) => void;
  t: DocumentsDict;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fresh form each time it opens (state adjusted during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setError(undefined);
      setFormError(null);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) return setError(t.required);
    setError(undefined);
    setSaving(true);
    setFormError(null);
    try {
      onCreated(await documentsApi.createFolder(name.trim(), parent.id));
    } catch (err) {
      setFormError(problemMessage(err, t.actionError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={t.newFolderTitle}
      hint={interpolate(t.newFolderHint, { folder: parent.name })}
      labelledBy="new-folder-title"
      closeLabel={t.close}
    >
      <form id="new-folder-form" onSubmit={submit} noValidate className="space-y-4">
        <Alert tone="danger" show={!!formError}>
          {formError}
        </Alert>
        <Field
          id="folder-name"
          label={t.folderName}
          placeholder={t.folderNamePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={error}
          disabled={saving}
          autoFocus
          maxLength={200}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t.cancel}
          </Button>
          <Button type="submit" loading={saving} loadingLabel={t.creating}>
            {t.create}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
