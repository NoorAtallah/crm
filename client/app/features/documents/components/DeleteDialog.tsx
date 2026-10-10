"use client";

import { useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { problemMessage } from "../../../lib/http";
import { interpolate } from "../../../lib/i18n";
import { documentsApi } from "../api";
import type { DocumentsDict } from "../i18n";
import { Modal } from "./Modal";

export type DeleteTarget = { kind: "file" | "folder"; id: string; name: string };


export function DeleteDialog({
  target,
  onClose,
  onDeleted,
  t,
}: {
  target: DeleteTarget | null;
  onClose: () => void;
  onDeleted: (target: DeleteTarget) => void;
  t: DocumentsDict;
}) {
  const [recursive, setRecursive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastTarget, setLastTarget] = useState(target);
  if (target !== lastTarget) {
    setLastTarget(target);
    setRecursive(false);
    setError(null);
  }

  async function confirm() {
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (target.kind === "file") await documentsApi.deleteFile(target.id);
      else await documentsApi.deleteFolder(target.id, recursive);
      onDeleted(target);
    } catch (err) {
      setError(problemMessage(err, t.actionError));
    } finally {
      setBusy(false);
    }
  }

  const isFolder = target?.kind === "folder";

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      busy={busy}
      title={isFolder ? t.deleteFolderTitle : t.deleteFileTitle}
      labelledBy="delete-title"
      closeLabel={t.close}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button type="button" variant="danger" onClick={confirm} loading={busy} loadingLabel={t.deleting}>
            {t.delete}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <p className="text-[13.5px] text-text-primary">
          {interpolate(isFolder ? t.deleteFolderBody : t.deleteFileBody, { name: target?.name ?? "" })}
        </p>
        {isFolder && (
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-primary">
            <input
              type="checkbox"
              checked={recursive}
              onChange={(event) => setRecursive(event.target.checked)}
              disabled={busy}
              className="h-4 w-4 accent-danger"
            />
            {t.deleteRecursive}
          </label>
        )}
      </div>
    </Modal>
  );
}
