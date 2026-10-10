/** Hands a Blob to the browser as a download under `fileName`. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Drag payload for moving files / folders inside the page (vs. OS file drops). */
export const DRAG_TYPE = "application/x-crm-item";
export type DragItem = { kind: "file" | "folder"; id: string };
