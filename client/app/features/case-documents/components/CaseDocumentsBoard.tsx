"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  BadgeCheck,
  Download,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  History,
  Pencil,
  Upload,
  X,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  DescriptionList,
  Drawer,
  EmptyState,

  ExportButton,  IconButton,
  Pagination,
  SearchInput,
  SegmentedControl,
  Spinner,
  Switch,
} from "../../../components/ui";
import { formatDate, formatFileSize } from "../../../lib/format";
import { HttpError, problemMessage } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { saveBlob } from "../../documents/saveBlob";
import { caseDocumentsApi } from "../api";
import type { CaseDocumentsDict } from "../i18n";
import { MAX_UPLOAD_BYTES, type CaseDocument, type DocumentStatus, type DocumentVersion, type PagedResult } from "../types";
import { ArchiveDialog, MetadataDialog, ReviewDialog } from "./Dialogs";

const isConflict = (e: unknown) => e instanceof HttpError && e.status === 409;

interface QueueItem {
  key: string;
  name: string;
  share: number;
  error?: string;
}

type View = "active" | "archived";

export function CaseDocumentsBoard({
  caseId,
  canUpload,
  canReview,
  names,
  t,
  locale,
}: {
  caseId: string;
  /** `documents.upload` — upload, edit, archive, new versions. */
  canUpload: boolean;
  /** `documents.review`. */
  canReview: boolean;
  names: Map<string, string>;
  t: CaseDocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const fileInput = useRef<HTMLInputElement>(null);
  const versionInput = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<View>("active");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DocumentStatus | "">("");
  const [category, setCategory] = useState("");
  const [data, setData] = useState<PagedResult<CaseDocument> | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [visibleOnUpload, setVisibleOnUpload] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);

  const [selected, setSelected] = useState<CaseDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[] | null>(null);
  const [versionShare, setVersionShare] = useState<number | null>(null);
  const [editing, setEditing] = useState<CaseDocument | null>(null);
  const [archiving, setArchiving] = useState<CaseDocument | null>(null);
  const [reviewing, setReviewing] = useState<CaseDocument | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    return caseDocumentsApi
      .search({
        caseId,
        isArchived: view === "archived",
        status: status || undefined,
        category: category || undefined,
        search: search.trim(),
        page,
        pageSize: 25,
      })
      .then(setData)
      .catch(() => setFailed(true));
  }, [caseId, view, status, category, search, page]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  // Categories seen so far, for the filter.
  const [knownCategories, setKnownCategories] = useState<string[]>([]);
  useEffect(() => {
    if (!data) return;
    setKnownCategories((prev) => {
      const next = new Set(prev);
      data.items.forEach((d) => d.category && next.add(d.category));
      return next.size === prev.length ? prev : [...next].sort();
    });
  }, [data]);

  /* ── upload ── */

  async function uploadFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      if (file.size > MAX_UPLOAD_BYTES) {
        setQueue((q) => [...q, { key, name: file.name, share: 0, error: interpolate(t.tooLarge, { name: file.name }) }]);
        continue;
      }
      setQueue((q) => [...q, { key, name: file.name, share: 0 }]);
      try {
        await caseDocumentsApi.upload(caseId, file, visibleOnUpload, (share) =>
          setQueue((q) => q.map((i) => (i.key === key ? { ...i, share } : i)))
        );
        setQueue((q) => q.filter((i) => i.key !== key));
      } catch (e) {
        const msg = problemMessage(e, interpolate(t.uploadFailed, { name: file.name }));
        setQueue((q) => q.map((i) => (i.key === key ? { ...i, error: msg } : i)));
      }
    }
    if (view !== "active") setView("active");
    setPage(1);
    await load();
  }

  /* ── selection & writes ── */

  const open = (doc: CaseDocument) => {
    setSelected(doc);
    setVersions(null);
    setActionError(null);
    caseDocumentsApi.versions(doc.id).then(setVersions).catch(() => setVersions([]));
  };

  const refreshSelected = async (id: string) => {
    const fresh = await caseDocumentsApi.get(id).catch(() => null);
    if (fresh) setSelected(fresh);
    caseDocumentsApi.versions(id).then(setVersions).catch(() => undefined);
  };

  /** Applies a write's result, or refreshes on 409. */
  const write = async (doc: CaseDocument, fn: (version: string) => Promise<CaseDocument>) => {
    try {
      const next = await fn(doc.version);
      setSelected((s) => (s?.id === next.id ? next : s));
      setNotice(null);
      caseDocumentsApi.versions(next.id).then(setVersions).catch(() => undefined);
      await load();
      return true;
    } catch (e) {
      if (!isConflict(e)) throw e;
      setNotice(t.conflict);
      await refreshSelected(doc.id);
      await load();
      return false;
    }
  };

  const download = async (doc: CaseDocument) => {
    try {
      saveBlob(await caseDocumentsApi.download(doc.id), doc.fileName ?? "document");
    } catch (e) {
      setActionError(problemMessage(e, t.loadError));
    }
  };

  const restore = async (doc: CaseDocument) => {
    setActionError(null);
    try {
      await write(doc, (v) => caseDocumentsApi.setArchived(doc.id, false, null, v));
    } catch (e) {
      setActionError(problemMessage(e, t.saveError));
    }
  };

  const uploadVersion = async (file: File) => {
    if (!selected) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setActionError(interpolate(t.tooLarge, { name: file.name }));
      return;
    }
    setActionError(null);
    setVersionShare(0);
    try {
      await write(selected, (v) => caseDocumentsApi.uploadVersion(selected.id, file, v, setVersionShare));
    } catch (e) {
      setActionError(problemMessage(e, t.saveError));
    } finally {
      setVersionShare(null);
    }
  };

  const displayName = (d: CaseDocument) => d.title || d.fileName || "—";
  const selectClass = "rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:outline-none";
  const items = data?.items ?? [];
  const sel = selected;
  const locked = !!sel?.isArchived;

  const versionList = useMemo(() => versions ?? [], [versions]);

  return (
    <div className="space-y-4">
      <Alert tone="warning" show={!!notice}>
        {notice}
      </Alert>

      {canUpload && view === "active" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
          }}
          className={`rounded-card border-2 border-dashed px-5 py-5 transition-colors ${
            dragging ? "border-brand-champagne bg-brand-champagne-light" : "border-line"
          }`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
              <Upload className="h-5 w-5 text-text-muted" strokeWidth={1.75} />
            </span>
            <p className="min-w-[200px] flex-1 text-[13px] text-text-muted">{t.dropHint}</p>
            <div className="w-56">
              <Switch checked={visibleOnUpload} onChange={setVisibleOnUpload} label={t.visibleOnUpload} />
            </div>
            <Button className="h-9 px-3 text-[13px]" onClick={() => fileInput.current?.click()}>
              <FileUp className="h-4 w-4" strokeWidth={1.75} />
              {t.upload}
            </Button>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <AnimatePresence initial={false}>
            {queue.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {queue.map((q) => (
                  <li key={q.key} className="rounded-lg border border-line bg-surface px-3 py-2">
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="min-w-0 flex-1 truncate text-text-primary">{q.name}</span>
                      {q.error ? (
                        <>
                          <span className="text-danger">{q.error}</span>
                          <IconButton icon={X} label={t.close} onClick={() => setQueue((all) => all.filter((i) => i.key !== q.key))} />
                        </>
                      ) : (
                        <span className="tabular-nums text-text-muted">{Math.round(q.share * 100)}%</span>
                      )}
                    </div>
                    {!q.error && (
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background">
                        <motion.div className="h-full bg-brand-charcoal" animate={{ width: `${q.share * 100}%` }} transition={{ duration: 0.2 }} />
                      </div>
                    )}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-line">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <SearchInput value={search} placeholder={t.search} onChange={(e) => (setPage(1), setSearch(e.target.value))} />
          <select value={status} onChange={(e) => (setPage(1), setStatus(e.target.value as DocumentStatus | ""))} className={selectClass}>
            <option value="">{t.allStatuses}</option>
            <option value="Uploaded">{t.statuses.Uploaded}</option>
            <option value="Reviewed">{t.statuses.Reviewed}</option>
          </select>
          {knownCategories.length > 0 && (
            <select value={category} onChange={(e) => (setPage(1), setCategory(e.target.value))} className={selectClass}>
              <option value="">{t.allCategories}</option>
              {knownCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <div className="ms-auto flex items-center gap-2">
            <ExportButton
              path="documents"
              filters={{ caseId, isArchived: view === "archived", status: status || undefined, category: category || undefined, search: search.trim() }}
              fileName="documents"
              formats={["Xlsx"]}
              locale={locale}
              compact
            />
            <SegmentedControl<View>
              id="doc-view"
              value={view}
              onChange={(v) => (setPage(1), setView(v))}
              options={[
                { key: "active", label: t.tab },
                { key: "archived", label: t.showArchived },
              ]}
            />
          </div>
        </div>

        <div className="px-5 pt-4">
          <Alert tone="danger" show={failed}>
            {t.loadError}
          </Alert>
        </div>

        {!data && !failed && <Spinner block />}
        {data && items.length === 0 && <EmptyState>{view === "archived" ? t.emptyArchived : t.empty}</EmptyState>}

        {items.length > 0 && (
          <ul className="divide-y divide-line">
            {items.map((d, i) => (
              <motion.li
                key={d.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
              >
                <button
                  type="button"
                  onClick={() => open(d)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-start transition-colors hover:bg-background"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                    <FileText className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13.5px] font-medium text-text-primary">{displayName(d)}</p>
                      {d.category && <Badge>{d.category}</Badge>}
                      {d.versionNumber > 1 && <Badge tone="info">v{d.versionNumber}</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-text-muted" dir="auto">
                      {d.title && d.fileName ? `${d.fileName} · ` : ""}
                      {d.sizeBytes ? formatFileSize(d.sizeBytes, locale) : ""}
                      {names.get(d.uploadedByEmployeeId) ? ` · ${names.get(d.uploadedByEmployeeId)}` : ""}
                    </p>
                  </div>
                  {d.visibleToClient ? (
                    <Eye className="h-4 w-4 shrink-0 text-success" strokeWidth={1.75} aria-label={t.visible} />
                  ) : (
                    <EyeOff className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} aria-label={t.hidden} />
                  )}
                  <Badge tone={d.isArchived ? "warning" : d.status === "Reviewed" ? "success" : "accent"}>
                    {d.isArchived ? t.archived : t.statuses[d.status]}
                  </Badge>
                </button>
              </motion.li>
            ))}
          </ul>
        )}

        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={setPage}
            label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })}
          />
        )}
      </div>

      <Drawer
        open={!!sel}
        onClose={() => setSelected(null)}
        title={sel ? displayName(sel) : ""}
        subtitle={
          sel && (
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={sel.status === "Reviewed" ? "success" : "accent"}>{t.statuses[sel.status]}</Badge>
              {sel.isArchived && <Badge tone="warning">{t.archived}</Badge>}
              <Badge>{interpolate(t.versionLabel, { n: sel.versionNumber })}</Badge>
            </span>
          )
        }
        closeLabel={t.close}
        dir={locale === "ar" ? "rtl" : "ltr"}
        width="max-w-lg"
        footer={
          sel && (
            <div className="flex flex-wrap justify-end gap-2">
              {sel.contentUrl && (
                <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => download(sel)}>
                  <Download className="h-4 w-4" strokeWidth={1.75} />
                  {t.download}
                </Button>
              )}
              {canUpload && locked && (
                <Button className="h-10 px-3 text-[13px]" onClick={() => restore(sel)}>
                  <ArchiveRestore className="h-4 w-4" strokeWidth={1.75} />
                  {t.restore}
                </Button>
              )}
              {canReview && !locked && sel.status !== "Reviewed" && (
                <Button className="h-10 px-3 text-[13px]" onClick={() => setReviewing(sel)}>
                  <BadgeCheck className="h-4 w-4" strokeWidth={1.75} />
                  {t.review}
                </Button>
              )}
            </div>
          )
        }
      >
        {sel && (
          <div className="space-y-5">
            <Alert tone="danger" show={!!actionError}>
              {actionError}
            </Alert>
            {locked && <Alert tone="info">{t.archivedLocked}</Alert>}
            {!sel.contentUrl && <Alert tone="info">{t.noFile}</Alert>}

            {canUpload && !locked && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={() => setEditing(sel)}>
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t.edit}
                </Button>
                {sel.contentUrl && (
                  <Button
                    variant="secondary"
                    className="h-9 px-3 text-[13px]"
                    loading={versionShare !== null}
                    loadingLabel={`${Math.round((versionShare ?? 0) * 100)}%`}
                    onClick={() => versionInput.current?.click()}
                    title={t.newVersionHint}
                  >
                    <FileUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {t.newVersion}
                  </Button>
                )}
                <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={() => setArchiving(sel)}>
                  <Archive className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t.archive}
                </Button>
                <input
                  ref={versionInput}
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadVersion(f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}

            <DescriptionList
              columns={2}
              items={[
                { label: t.fields.fileName, value: sel.fileName && <span dir="auto">{sel.fileName}</span>, full: true },
                { label: t.fields.category, value: sel.category },
                { label: t.fields.size, value: sel.sizeBytes ? formatFileSize(sel.sizeBytes, locale) : null },
                { label: t.fields.uploadedBy, value: names.get(sel.uploadedByEmployeeId) },
                { label: t.fields.reviewedBy, value: sel.reviewedByEmployeeId ? names.get(sel.reviewedByEmployeeId) ?? "✓" : null },
                { label: t.fields.visibleToClient, value: sel.visibleToClient ? t.visible : t.hidden },
                { label: t.fields.description, value: sel.description, full: true },
                ...(sel.isArchived
                  ? [
                      { label: t.fields.archiveReason, value: sel.archiveReason, full: true },
                      { label: t.fields.archivedAt, value: sel.archivedAtUtc ? formatDate(sel.archivedAtUtc, locale) : null },
                    ]
                  : []),
              ]}
            />

            {sel.internalNotes && (
              <div className="rounded-lg border border-dashed border-line bg-background px-4 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t.fields.reviewNotes}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] text-text-primary">{sel.internalNotes}</p>
              </div>
            )}

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
                <History className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                {t.versions}
              </h3>
              {versions === null ? (
                <Spinner block />
              ) : versionList.length === 0 ? (
                <p className="text-[12.5px] text-text-muted">—</p>
              ) : (
                <ul className="space-y-2">
                  {versionList.map((v) => (
                    <li key={v.versionNumber} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-[12px] font-semibold tabular-nums text-text-primary">
                        v{v.versionNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-text-primary" dir="auto">
                          {v.fileName}
                        </p>
                        <p className="text-[11.5px] tabular-nums text-text-muted">
                          {formatDate(v.createdAtUtc, locale)} · {formatFileSize(v.sizeBytes, locale)}
                          {names.get(v.uploadedByEmployeeId) ? ` · ${names.get(v.uploadedByEmployeeId)}` : ""}
                        </p>
                      </div>
                      {v.isCurrent && <Badge tone="info">{t.current}</Badge>}
                      <Badge tone={v.status === "Reviewed" ? "success" : "neutral"}>{t.statuses[v.status]}</Badge>
                      <IconButton
                        icon={Download}
                        label={t.download}
                        onClick={async () => {
                          try {
                            saveBlob(await caseDocumentsApi.downloadVersion(sel.id, v.versionNumber), v.fileName ?? "document");
                          } catch (e) {
                            setActionError(problemMessage(e, t.loadError));
                          }
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <MetadataDialog
        doc={editing}
        onClose={() => setEditing(null)}
        onSubmit={(input) => write(editing!, (v) => caseDocumentsApi.updateMetadata(editing!.id, input, v))}
        t={t}
      />
      <ArchiveDialog
        doc={archiving}
        onClose={() => setArchiving(null)}
        onSubmit={async (reason) => {
          const ok = await write(archiving!, (v) => caseDocumentsApi.setArchived(archiving!.id, true, reason, v));
          if (ok) setSelected(null);
          return ok;
        }}
        t={t}
      />
      <ReviewDialog
        doc={reviewing}
        onClose={() => setReviewing(null)}
        onSubmit={(notes) => write(reviewing!, (v) => caseDocumentsApi.review(reviewing!.id, notes, v))}
        t={t}
      />
    </div>
  );
}
