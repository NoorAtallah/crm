"use client";

import { useState, type DragEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Folder as FolderIcon, FolderInput, Trash2 } from "lucide-react";
import { formatDate } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import type { DocumentsDict } from "../i18n";
import { DRAG_TYPE, type DragItem } from "../saveBlob";
import type { Folder } from "../types";

/**
 * Folder cards. Click opens; each card is draggable (to move the folder)
 * and a drop target (for files or folders dragged from this page).
 */
export function FolderGrid({
  folders,
  onOpen,
  onMove,
  onDelete,
  onDropItem,
  t,
  locale,
}: {
  folders: Folder[];
  onOpen: (folder: Folder) => void;
  onMove: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  onDropItem: (item: DragItem, destination: Folder) => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [over, setOver] = useState<string | null>(null);

  const onDragOver = (event: DragEvent, folder: Folder) => {
    if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setOver(folder.id);
  };

  const onDrop = (event: DragEvent, folder: Folder) => {
    const raw = event.dataTransfer.getData(DRAG_TYPE);
    setOver(null);
    if (!raw) return;
    event.preventDefault();
    event.stopPropagation();
    const item = JSON.parse(raw) as DragItem;
    if (item.kind === "folder" && item.id === folder.id) return;
    onDropItem(item, folder);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {folders.map((folder, index) => (
        <motion.div
          key={folder.id}
          layout={!reduceMotion}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, scale: over === folder.id ? 1.02 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: Math.min(index * 0.03, 0.18) }}
          className={`group relative rounded-card border bg-surface transition-colors ${
            over === folder.id ? "border-brand-charcoal bg-brand-champagne-light" : "border-line hover:border-brand-charcoal"
          }`}
          onDragOver={(event) => onDragOver(event, folder)}
          onDragLeave={() => setOver((current) => (current === folder.id ? null : current))}
          onDrop={(event) => onDrop(event, folder)}
        >
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ kind: "folder", id: folder.id } satisfies DragItem));
              event.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onOpen(folder)}
            className="flex w-full items-center gap-3 p-4 text-start"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-champagne-light">
              <FolderIcon className="h-5 w-5 text-brand-charcoal" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1 pe-14">
              <span className="block truncate text-[14px] font-semibold text-text-primary">{folder.name}</span>
              <span className="block text-[12px] tabular-nums text-text-muted">
                {formatDate(folder.createdAtUtc, locale)}
              </span>
            </span>
          </button>

          <div className="absolute end-2 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onMove(folder)}
              aria-label={t.move}
              title={t.move}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background hover:text-text-primary"
            >
              <FolderInput className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(folder)}
              aria-label={t.delete}
              title={t.delete}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-surface hover:text-danger"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
