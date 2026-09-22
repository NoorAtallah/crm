"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Folder, Plus } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card, CardHeader } from "../../../components/ui/Card";
import { formatNumber } from "../../../lib/format";
import { interpolate, type Locale } from "../../../lib/i18n";
import { documentsApi } from "../api";
import {
  emptyQuery,
  type DocumentAbilities,
  type DocumentRow,
  type DocumentsQuery,
  type DocumentsSummary,
  type UploadDocumentInput,
} from "../types";
import type { DocumentsDict } from "../i18n";
import { DocumentDrawer } from "./DocumentDrawer";
import { DocumentFilters } from "./DocumentFilters";
import { DocumentsTable } from "./DocumentsTable";
import { FolderGrid, foldersOf } from "./FolderGrid";
import { QuickAccess } from "./QuickAccess";
import { StoragePanel } from "./StoragePanel";
import { UploadDialog } from "./UploadDialog";

const RECENT_LIMIT = 6;

/**
 * Drive-style documents screen. The API hangs every document off a caseId,
 * so a case *is* a folder: the root shows folders, opening one lists its
 * files. Filtering or searching from anywhere jumps straight to results.
 */
export function DocumentsView({
  initial,
  abilities,
  t,
  locale,
}: {
  initial: DocumentsSummary;
  abilities: DocumentAbilities;
  t: DocumentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  const [documents, setDocuments] = useState<DocumentRow[]>(initial.documents);
  const [query, setQuery] = useState<DocumentsQuery>(emptyQuery);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  const folders = useMemo(
    () => foldersOf(initial.cases, documents),
    [initial.cases, documents]
  );
  const openFolder = folders.find((folder) => folder.id === openFolderId) ?? null;

  /** A filter narrower than "everything" means the viewer is looking for a file. */
  const filtering =
    query.search.trim() !== "" ||
    query.status !== "all" ||
    query.visibility !== "all";

  const matches = useMemo(() => filter(documents, query), [documents, query]);
  const inFolder = openFolder
    ? matches.filter((document) => document.caseId === openFolder.id)
    : [];
  const recent = matches.slice(0, RECENT_LIMIT);

  const listing = openFolder ? inFolder : matches;
  const showList = !!openFolder || showAll || filtering;

  const selected = documents.find((item) => item.id === selectedId) ?? null;

  async function upload(input: UploadDocumentInput) {
    setUploading(true);
    setUploadError(null);
    try {
      const created = await documentsApi.upload(input);
      setDocuments((current) => [created, ...current]);
      setUploadOpen(false);
      setNotice(t.uploadSuccess);
    } catch {
      setUploadError(t.errorGeneric);
    } finally {
      setUploading(false);
    }
  }

  async function review(documentId: string, internalNotes: string) {
    setReviewing(true);
    setReviewError(null);
    try {
      const reviewed = await documentsApi.review(documentId, { internalNotes });
      setDocuments((current) =>
        current.map((item) => (item.id === documentId ? reviewed : item))
      );
      setNotice(t.reviewSuccess);
    } catch {
      setReviewError(t.errorGeneric);
    } finally {
      setReviewing(false);
    }
  }

  function openDocument(document: DocumentRow) {
    setReviewError(null);
    setSelectedId(document.id);
  }

  function backToFolders() {
    setOpenFolderId(null);
    setShowAll(false);
    setQuery(emptyQuery);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {openFolder ? (
            <>
              <button
                type="button"
                onClick={backToFolders}
                className="inline-flex items-center gap-1.5 text-[13px] text-text-muted transition-colors hover:text-brand-charcoal"
              >
                <Back className="h-3.5 w-3.5" strokeWidth={2} />
                {t.backToFolders}
              </button>
              <h1 className="mt-1.5 flex items-center gap-2.5 text-[26px] font-semibold tracking-tight text-text-primary">
                <Folder
                  className="h-6 w-6 text-brand-champagne"
                  strokeWidth={1.75}
                />
                {openFolder.caseNumber}
              </h1>
              <p className="mt-1 text-[14px] text-text-muted">
                {openFolder.title}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
                {t.title}
              </h1>
              <p className="mt-1 text-[14px] text-text-muted">{t.subtitle}</p>
            </>
          )}
        </div>

        {abilities.canUpload && (
          <Button
            variant="accent"
            onClick={() => {
              setUploadError(null);
              setUploadOpen(true);
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t.upload}
          </Button>
        )}
      </header>

      <Alert tone="success" show={!!notice}>
        {notice}
      </Alert>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <DocumentFilters
            cases={initial.cases}
            query={query}
            onChange={(next) => {
              setQuery(next);
              setNotice(null);
              // Picking a case from the filter is the same as opening its folder.
              if (next.caseId !== query.caseId) setOpenFolderId(next.caseId);
            }}
            t={t}
          />

          <AnimatePresence mode="wait" initial={false}>
            {showList ? (
              <motion.div
                key="list"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Card>
                  <CardHeader
                    title={openFolder ? openFolder.caseNumber : t.allFiles}
                    action={
                      <span className="text-[13px] text-text-muted">
                        {interpolate(t.filesCount, {
                          count: formatNumber(listing.length, locale),
                        })}
                      </span>
                    }
                  />
                  <DocumentsTable
                    documents={listing}
                    onOpen={openDocument}
                    emptyLabel={
                      openFolder && !filtering ? t.emptyFolder : t.empty
                    }
                    t={t}
                    locale={locale}
                  />
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="root"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-6"
              >
                {recent.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-[15px] font-semibold text-text-primary">
                      {t.quickAccess}
                    </h2>
                    <QuickAccess
                      documents={documents.slice(0, 3)}
                      onOpen={openDocument}
                      t={t}
                      locale={locale}
                    />
                  </section>
                )}

                <section>
                  <h2 className="mb-3 text-[15px] font-semibold text-text-primary">
                    {t.folders}
                  </h2>
                  <FolderGrid
                    folders={folders}
                    onOpen={(folder) => {
                      setOpenFolderId(folder.id);
                      setQuery({ ...emptyQuery, caseId: folder.id });
                    }}
                    t={t}
                    locale={locale}
                  />
                </section>

                <section>
                  <Card>
                    <CardHeader
                      title={t.recentFiles}
                      action={
                        <button
                          type="button"
                          onClick={() => setShowAll(true)}
                          className="text-[13px] font-medium text-text-muted underline-offset-4 transition-colors hover:text-brand-charcoal hover:underline"
                        >
                          {t.viewAll}
                        </button>
                      }
                    />
                    <DocumentsTable
                      documents={recent}
                      onOpen={openDocument}
                      t={t}
                      locale={locale}
                    />
                  </Card>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <StoragePanel
          documents={openFolder ? inFolder : documents}
          t={t}
          locale={locale}
        />
      </div>

      <UploadDialog
        open={uploadOpen}
        cases={initial.cases}
        defaultCaseId={openFolder?.id ?? query.caseId}
        submitting={uploading}
        error={uploadError}
        onSubmit={upload}
        onClose={() => setUploadOpen(false)}
        t={t}
        locale={locale}
      />

      <DocumentDrawer
        document={selected}
        canReview={abilities.canReview}
        submitting={reviewing}
        error={reviewError}
        onReview={review}
        onClose={() => setSelectedId(null)}
        t={t}
        locale={locale}
      />
    </div>
  );
}

/** Mirrors `api/mock.ts` so moving the filter server-side is a no-op. */
function filter(documents: DocumentRow[], query: DocumentsQuery): DocumentRow[] {
  const term = query.search.trim().toLowerCase();

  return documents.filter((document) => {
    if (query.caseId && document.caseId !== query.caseId) return false;
    if (query.status !== "all" && document.status !== query.status) return false;
    if (query.visibility === "client" && !document.visibleToClient) return false;
    if (query.visibility === "internal" && document.visibleToClient) return false;
    if (!term) return true;
    return [document.fileName, document.caseNumber, document.caseTitle].some(
      (value) => value.toLowerCase().includes(term)
    );
  });
}
