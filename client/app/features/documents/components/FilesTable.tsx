"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Download, Eye, FolderInput, Trash2 } from "lucide-react";
import { formatDate, formatFileSize } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import { kindOf, kindStyles } from "../fileKind";
import type { DocumentsDict } from "../i18n";
import { DRAG_TYPE, type DragItem } from "../saveBlob";
import type { FileEntry } from "../types";

export function FilesTable({
  files,
  onOpen,
  onDownload,
  onMove,
  onDelete,
  t,
  locale,
}: {
  files: FileEntry[];
  onOpen: (file: FileEntry) => void;
  onDownload: (file: FileEntry) => void;
  onMove: (file: FileEntry) => void;
  onDelete: (file: FileEntry) => void;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();

  const action = (label: string, Icon: typeof Eye, onClick: () => void, danger = false) => (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors ${
        danger ? "hover:bg-danger-surface hover:text-danger" : "hover:bg-background hover:text-text-primary"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-start">
        <thead>
          <tr className="border-b border-line text-[12.5px] text-text-muted">
            <th className="px-5 py-3 text-start font-medium">{t.columns.name}</th>
            <th className="px-5 py-3 text-start font-medium">{t.columns.type}</th>
            <th className="px-5 py-3 text-start font-medium">{t.columns.size}</th>
            <th className="px-5 py-3 text-start font-medium">{t.columns.added}</th>
            <th className="px-5 py-3">
              <span className="sr-only">{t.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {files.map((file, index) => {
            const kind = kindOf(file.fileName);
            const { Icon, surface, text } = kindStyles[kind];
            return (
              // Plain <tr>: framer-motion claims onDragStart for its own gestures,
              // and rows need the native HTML drag to move files onto folders.
              <tr
                key={file.id}
                draggable
                onDragStart={(event) => {
                  const dt = event.dataTransfer;
                  dt.setData(DRAG_TYPE, JSON.stringify({ kind: "file", id: file.id } satisfies DragItem));
                  dt.effectAllowed = "move";
                }}
                onClick={() => onOpen(file)}
                className="group cursor-pointer transition-colors hover:bg-background"
              >
                <td className="max-w-[340px] px-5 py-3">
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(index * 0.02, 0.18) }}
                    className="flex items-center gap-3"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${surface}`}>
                      <Icon className={`h-4 w-4 ${text}`} strokeWidth={1.75} />
                    </span>
                    <span className="truncate text-[13.5px] font-medium text-text-primary">{file.fileName}</span>
                  </motion.div>
                </td>
                <td className="px-5 py-3 text-[13px] text-text-muted">{t.kinds[kind]}</td>
                <td className="px-5 py-3 text-[13px] tabular-nums text-text-muted">
                  {formatFileSize(file.sizeBytes, locale)}
                </td>
                <td className="px-5 py-3 text-[12.5px] tabular-nums text-text-muted">
                  {formatDate(file.createdAtUtc, locale)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                    {action(t.open, Eye, () => onOpen(file))}
                    {action(t.download, Download, () => onDownload(file))}
                    {action(t.move, FolderInput, () => onMove(file))}
                    {action(t.delete, Trash2, () => onDelete(file), true)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
