"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FolderPlus,
  Home,
  RotateCw,
  Search,
  UploadCloud,
} from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { formatNumber } from "../../../lib/format";
import { problemMessage } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { documentsApi } from "../api";
import type { DocumentsDict } from "../i18n";
import { DRAG_TYPE, saveBlob, type DragItem } from "../saveBlob";
import {
  MAX_FILE_BYTES,
  type Crumb,
  type FileEntry,
  type Folder,
  type FolderContents,
  type UploadItem,
} from "../types";
import { DeleteDialog, type DeleteTarget } from "./DeleteDialog";
import { FilePreviewDrawer } from "./FilePreviewDrawer";
import { FilesTable } from "./FilesTable";
import { FolderGrid } from "./FolderGrid";
import { MoveDialog, type MoveTarget } from "./MoveDialog";
import { NewFolderDialog } from "./NewFolderDialog";
import { StoragePanel } from "./StoragePanel";
import { UploadQueue } from "./UploadQueue";

export function DocumentsView({
  initial,
  failed: initialFailed,
  t,
  locale,
}: {
  initial: FolderContents;
  failed: boolean;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;

  const [path, setPath] = useState<Crumb[]>([{ id: null, name: t.root }]);
  const [contents, setContents] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(initialFailed);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [preview, setPreview] = useState<FileEntry | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [crumbOver, setCrumbOver] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const here = path[path.length - 1];
  const hereRef = useRef(here.id);
  hereRef.current = here.id;

  // Auto-dismiss notices.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const load = useCallback(async (folderId: string | null, page = 1) => {
    setLoading(true);
    setFailed(false);
    try {
      const next = await documentsApi.contents(folderId, page);
      if (hereRef.current === folderId) setContents(next);
    } catch {
      if (hereRef.current === folderId) setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function navigate(nextPath: Crumb[]) {
    const target = nextPath[nextPath.length - 1];
    hereRef.current = target.id;
    setPath(nextPath);
    setSearch("");
    void load(target.id, 1);
  }

  const openFolder = (folder: Folder) => navigate([...path, { id: folder.id, name: folder.name }]);

  // ── Upload ────────────────────────────────────────────────
  function startUploads(list: FileList | File[]) {
    const folderId = here.id;
    const files = Array.from(list);
    if (files.length === 0) return;

    const items: UploadItem[] = files.map((file, index) => ({
      key: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      size: file.size,
      progress: 0,
      state: file.size > MAX_FILE_BYTES || file.size === 0 ? "error" : "uploading",
      error: file.size > MAX_FILE_BYTES ? t.tooLarge : file.size === 0 ? t.uploadFailed : undefined,
    }));
    setUploads((prev) => [...items, ...prev]);

    const patch = (key: string, change: Partial<UploadItem>) =>
      setUploads((prev) => prev.map((item) => (item.key === key ? { ...item, ...change } : item)));

    const jobs = files.map((file, index) => {
      const item = items[index];
      if (item.state === "error") return Promise.resolve();
      return documentsApi
        .upload(file, folderId, (share) => patch(item.key, { progress: share }))
        .then(() => patch(item.key, { state: "done", progress: 1 }))
        .catch((error) => patch(item.key, { state: "error", error: problemMessage(error, t.uploadFailed) }));
    });

    void Promise.all(jobs).then(() => {
      if (hereRef.current === folderId) void load(folderId, contents.page);
    });
  }

  // OS file drag over the whole page (ignored for in-page moves).
  const isFileDrag = (event: DragEvent) =>
    event.dataTransfer.types.includes("Files") && !event.dataTransfer.types.includes(DRAG_TYPE);

  // ── Moves (dialog or drag) ────────────────────────────────
  async function moveItem(item: DragItem, destinationId: string | null) {
    if (destinationId === here.id) return;
    try {
      if (item.kind === "file") await documentsApi.moveFile(item.id, destinationId);
      else await documentsApi.moveFolder(item.id, destinationId);
      removeLocal(item.kind, item.id);
      setNotice({ tone: "success", text: t.moved });
    } catch (error) {
      setNotice({ tone: "danger", text: problemMessage(error, t.actionError) });
    }
  }

  function removeLocal(kind: "file" | "folder", id: string) {
    setContents((prev) =>
      kind === "file"
        ? { ...prev, files: prev.files.filter((f) => f.id !== id), totalFiles: Math.max(0, prev.totalFiles - 1) }
        : {
            ...prev,
            folders: prev.folders.filter((f) => f.id !== id),
            totalFolders: Math.max(0, prev.totalFolders - 1),
          }
    );
  }

  async function download(file: FileEntry) {
    try {
      saveBlob(await documentsApi.content(file.id), file.fileName);
    } catch (error) {
      setNotice({ tone: "danger", text: problemMessage(error, t.previewError) });
    }
  }

  // ── Derived ───────────────────────────────────────────────
  const term = search.trim().toLowerCase();
  const folders = useMemo(
    () => (term ? contents.folders.filter((f) => f.name.toLowerCase().includes(term)) : contents.folders),
    [contents.folders, term]
  );
  const files = useMemo(
    () => (term ? contents.files.filter((f) => f.fileName.toLowerCase().includes(term)) : contents.files),
    [contents.files, term]
  );

  const pages = Math.max(
    1,
    Math.ceil(Math.max(contents.totalFolders, contents.totalFiles) / contents.pageSize)
  );
  const isEmpty = contents.folders.length === 0 && contents.files.length === 0;

  return (
    <div
      className="relative space-y-5"
      onDragOver={(event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        setFileDragOver(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setFileDragOver(false);
      }}
      onDrop={(event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        setFileDragOver(false);
        startUploads(event.dataTransfer.files);
      }}
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">{t.title}</h1>
          <p className="mt-1 text-[13.5px] text-text-muted">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-4 w-4" strokeWidth={1.75} />
            {t.newFolder}
          </Button>
          <Button type="button" onClick={() => inputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" strokeWidth={1.75} />
            {t.upload}
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) startUploads(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </header>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Alert tone={notice.tone} show>
              {notice.text}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <Card>
          {/* Breadcrumb + search */}
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
            <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[13px]">
              {path.map((crumb, index) => {
                const last = index === path.length - 1;
                const key = crumb.id ?? "root";
                return (
                  <span key={key} className="flex items-center gap-1">
                    {index > 0 && <Chevron className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />}
                    <button
                      type="button"
                      disabled={last}
                      onClick={() => navigate(path.slice(0, index + 1))}
                      onDragOver={(event) => {
                        if (last || !event.dataTransfer.types.includes(DRAG_TYPE)) return;
                        event.preventDefault();
                        setCrumbOver(key);
                      }}
                      onDragLeave={() => setCrumbOver(null)}
                      onDrop={(event) => {
                        const raw = event.dataTransfer.getData(DRAG_TYPE);
                        setCrumbOver(null);
                        if (!raw || last) return;
                        event.preventDefault();
                        event.stopPropagation();
                        void moveItem(JSON.parse(raw) as DragItem, crumb.id);
                      }}
                      className={`flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors ${
                        last ? "font-semibold text-text-primary" : "text-text-muted hover:bg-background hover:text-text-primary"
                      } ${crumbOver === key ? "bg-brand-champagne-light text-text-primary" : ""}`}
                    >
                      {index === 0 && <Home className="h-3.5 w-3.5" strokeWidth={1.75} />}
                      <span className="max-w-[180px] truncate">{crumb.name}</span>
                    </button>
                  </span>
                );
              })}
              {loading && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
                  className="ms-1 inline-flex text-text-muted"
                >
                  <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                </motion.span>
              )}
            </nav>

            <label className="relative w-full sm:w-[240px]">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.search}
                className="w-full rounded-lg border border-line bg-surface py-2 pe-3 ps-9 text-[13.5px] text-text-primary placeholder:text-text-muted focus:border-text-muted focus:outline-none"
              />
            </label>
          </div>

          <div className="px-5 pt-3 text-[12.5px] tabular-nums text-text-muted">
            {interpolate(t.summary, {
              folders: formatNumber(contents.totalFolders, locale),
              files: formatNumber(contents.totalFiles, locale),
            })}
          </div>

          {failed ? (
            <div className="space-y-3 px-5 py-6">
              <Alert tone="danger" show>
                {t.loadError}
              </Alert>
              <Button type="button" variant="secondary" onClick={() => load(here.id, contents.page)}>
                <RotateCw className="h-4 w-4" strokeWidth={1.75} />
                {t.retry}
              </Button>
            </div>
          ) : isEmpty && !loading ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="m-5 flex w-[calc(100%-2.5rem)] flex-col items-center gap-2 rounded-card border border-dashed border-line py-14 text-center transition-colors hover:border-brand-charcoal"
            >
              <FolderOpen className="h-8 w-8 text-text-muted" strokeWidth={1.5} />
              <span className="text-[14px] font-medium text-text-primary">{t.emptyFolder}</span>
              <span className="text-[12.5px] text-text-muted">{t.emptyHint}</span>
            </button>
          ) : (
            <motion.div
              key={here.id ?? "root"}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: loading ? 0.6 : 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 py-4"
            >
              {folders.length > 0 && (
                <section className="px-5">
                  <h2 className="mb-2.5 text-[12.5px] font-medium text-text-muted">{t.folders}</h2>
                  <FolderGrid
                    folders={folders}
                    onOpen={openFolder}
                    onMove={(folder) =>
                      setMoveTarget({ kind: "folder", id: folder.id, name: folder.name, currentParentId: here.id })
                    }
                    onDelete={(folder) => setDeleteTarget({ kind: "folder", id: folder.id, name: folder.name })}
                    onDropItem={(item, destination) => void moveItem(item, destination.id)}
                    t={t}
                    locale={locale}
                  />
                </section>
              )}

              {files.length > 0 && (
                <section>
                  <h2 className="mb-1 px-5 text-[12.5px] font-medium text-text-muted">{t.files}</h2>
                  <FilesTable
                    files={files}
                    onOpen={setPreview}
                    onDownload={download}
                    onMove={(file) =>
                      setMoveTarget({ kind: "file", id: file.id, name: file.fileName, currentParentId: here.id })
                    }
                    onDelete={(file) => setDeleteTarget({ kind: "file", id: file.id, name: file.fileName })}
                    t={t}
                    locale={locale}
                  />
                </section>
              )}

              {term && folders.length === 0 && files.length === 0 && (
                <p className="px-5 py-8 text-center text-[13px] text-text-muted">{t.noMatches}</p>
              )}
            </motion.div>
          )}

          {pages > 1 && !failed && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <p className="text-[12.5px] tabular-nums text-text-muted">
                {interpolate(t.page, {
                  page: formatNumber(contents.page, locale),
                  pages: formatNumber(pages, locale),
                })}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={contents.page <= 1 || loading}
                  onClick={() => load(here.id, contents.page - 1)}
                  aria-label={t.prev}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-text-muted transition-colors hover:text-text-primary disabled:opacity-40"
                >
                  <Prev className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  disabled={contents.page >= pages || loading}
                  onClick={() => load(here.id, contents.page + 1)}
                  aria-label={t.next}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-text-muted transition-colors hover:text-text-primary disabled:opacity-40"
                >
                  <Chevron className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}
        </Card>

        <StoragePanel files={contents.files} t={t} locale={locale} />
      </div>

      {/* OS file drop overlay */}
      <AnimatePresence>
        {fileDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-brand-charcoal/30 p-6"
          >
            <motion.div
              initial={reduceMotion ? false : { scale: 0.96 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-brand-champagne bg-surface px-10 py-8 shadow-card"
            >
              <UploadCloud className="h-9 w-9 text-brand-charcoal" strokeWidth={1.5} />
              <p className="text-[14px] font-medium text-text-primary">
                {interpolate(t.dropHere, { folder: here.name })}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NewFolderDialog
        open={newFolderOpen}
        parent={here}
        onClose={() => setNewFolderOpen(false)}
        onCreated={(folder) => {
          setNewFolderOpen(false);
          setNotice({ tone: "success", text: interpolate(t.folderCreated, { name: folder.name }) });
          void load(here.id, contents.page);
        }}
        t={t}
      />

      <MoveDialog
        target={moveTarget}
        onClose={() => setMoveTarget(null)}
        onMoved={(target) => {
          setMoveTarget(null);
          removeLocal(target.kind, target.id);
          setNotice({ tone: "success", text: t.moved });
        }}
        t={t}
        locale={locale}
      />

      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={(target) => {
          setDeleteTarget(null);
          removeLocal(target.kind, target.id);
          setNotice({ tone: "success", text: t.deleted });
        }}
        t={t}
      />

      <FilePreviewDrawer file={preview} onClose={() => setPreview(null)} t={t} locale={locale} />

      <UploadQueue
        items={uploads}
        onClear={() => setUploads((prev) => prev.filter((item) => item.state === "uploading"))}
        t={t}
        locale={locale}
      />
    </div>
  );
}
