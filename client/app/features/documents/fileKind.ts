import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

/**
 * File kinds drive the icon and its colour everywhere on this page — the
 * table, the folder cards and the storage panel all read from here.
 */
export type FileKind = "pdf" | "image" | "sheet" | "doc" | "archive" | "other";

export const FILE_KINDS: FileKind[] = [
  "pdf",
  "doc",
  "image",
  "sheet",
  "archive",
  "other",
];

const BY_EXTENSION: Record<string, FileKind> = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  heic: "image",
  gif: "image",
  tif: "image",
  tiff: "image",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  doc: "doc",
  docx: "doc",
  txt: "doc",
  rtf: "doc",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
};

export function kindOf(fileName: string): FileKind {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[extension] ?? "other";
}

export const kindStyles: Record<
  FileKind,
  { Icon: LucideIcon; surface: string; text: string }
> = {
  pdf: { Icon: FileText, surface: "bg-danger-surface", text: "text-danger" },
  image: { Icon: FileImage, surface: "bg-info-surface", text: "text-info" },
  sheet: {
    Icon: FileSpreadsheet,
    surface: "bg-success-surface",
    text: "text-success",
  },
  doc: { Icon: FileText, surface: "bg-info-surface", text: "text-info" },
  archive: {
    Icon: FileArchive,
    surface: "bg-warning-surface",
    text: "text-warning",
  },
  other: { Icon: File, surface: "bg-background", text: "text-text-muted" },
};

/** Ring colours for the storage donut, in the same order as FILE_KINDS. */
export const kindStroke: Record<FileKind, string> = {
  pdf: "var(--color-danger)",
  doc: "var(--color-info)",
  image: "var(--color-brand-champagne)",
  sheet: "var(--color-success)",
  archive: "var(--color-warning)",
  other: "var(--color-line)",
};
