"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Folder as FolderIcon, Home, Loader2 } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { problemMessage } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { documentsApi } from "../api";
import type { DocumentsDict } from "../i18n";
import type { Crumb, Folder } from "../types";
import { Modal } from "./Modal";

export type MoveTarget = {
  kind: "file" | "folder";
  id: string;
  name: string;
  /** Where it lives now — moving there is a no-op. */
  currentParentId: string | null;
};

/**
 * Browse the folder tree one level at a time (the API only lists direct
 * children) and move the item into whichever folder is open.
 */
export function MoveDialog({
  target,
  onClose,
  onMoved,
  t,
  locale,
}: {
  target: MoveTarget | null;
  onClose: () => void;
  onMoved: (target: MoveTarget, destinationId: string | null) => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const [path, setPath] = useState<Crumb[]>([]);
  // Listing tagged with the folder it belongs to — a mismatch means "loading".
  const [listing, setListing] = useState<{ id: string | null; folders: Folder[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const here = path[path.length - 1] ?? { id: null, name: t.root };

  const [lastTarget, setLastTarget] = useState(target);
  if (target !== lastTarget) {
    setLastTarget(target);
    if (target) {
      setPath([{ id: null, name: t.root }]);
      setError(null);
    }
  }

  const folders = listing && listing.id === here.id ? listing.folders : null;

  useEffect(() => {
    if (!target || path.length === 0) return;
    let cancelled = false;
    const id = here.id;
    documentsApi
      .contents(id, 1)
      .then((contents) => !cancelled && setListing({ id, folders: contents.folders }))
      .catch((err) => {
        if (cancelled) return;
        setListing({ id, folders: [] });
        setError(problemMessage(err, t.actionError));
      });
    return () => {
      cancelled = true;
    };
  }, [target, here.id, path.length, t.actionError]);

  // A folder can't go into itself or anything below it.
  const insideSelf = target?.kind === "folder" && path.some((crumb) => crumb.id === target.id);
  const isCurrent = here.id === target?.currentParentId;

  async function move() {
    if (!target || busy || insideSelf || isCurrent) return;
    setBusy(true);
    setError(null);
    try {
      if (target.kind === "file") await documentsApi.moveFile(target.id, here.id);
      else await documentsApi.moveFolder(target.id, here.id);
      onMoved(target, here.id);
    } catch (err) {
      setError(problemMessage(err, t.actionError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      busy={busy}
      title={interpolate(t.moveTitle, { name: target?.name ?? "" })}
      hint={t.moveHint}
      labelledBy="move-title"
      closeLabel={t.close}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button
            type="button"
            onClick={move}
            loading={busy}
            loadingLabel={t.moving}
            disabled={insideSelf || isCurrent}
          >
            {t.moveHere}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>

        <nav className="flex flex-wrap items-center gap-1 text-[12.5px]">
          {path.map((crumb, index) => (
            <span key={crumb.id ?? "root"} className="flex items-center gap-1">
              {index > 0 && <Chevron className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />}
              <button
                type="button"
                onClick={() => setPath(path.slice(0, index + 1))}
                className={`flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-background ${
                  index === path.length - 1 ? "font-semibold text-text-primary" : "text-text-muted"
                }`}
              >
                {index === 0 && <Home className="h-3.5 w-3.5" strokeWidth={1.75} />}
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>

        {isCurrent && <p className="text-[12px] text-text-muted">{t.currentLocation}</p>}

        <div className="min-h-[180px] rounded-lg border border-line">
          {folders === null ? (
            <div className="flex h-[180px] items-center justify-center text-text-muted">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
                className="inline-flex"
              >
                <Loader2 className="h-5 w-5" strokeWidth={1.75} />
              </motion.span>
            </div>
          ) : folders.length === 0 ? (
            <p className="flex h-[180px] items-center justify-center text-[13px] text-text-muted">
              {t.noSubfolders}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {folders.map((folder) => {
                const disabled = target?.kind === "folder" && folder.id === target.id;
                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setPath([...path, { id: folder.id, name: folder.name }])}
                      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-start transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FolderIcon className="h-4 w-4 text-brand-charcoal" strokeWidth={1.75} />
                      <span className="flex-1 truncate text-[13.5px] text-text-primary">{folder.name}</span>
                      <Chevron className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
