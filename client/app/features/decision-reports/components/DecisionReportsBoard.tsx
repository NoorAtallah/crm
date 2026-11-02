"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Ban, CheckCircle2, Download, EyeOff, FileSignature, History, Pencil, Plus, Undo2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,

  ExportButton,  Field,
  Modal,
  Pagination,
  SearchInput,
  Spinner,
  TextArea,
  type BadgeTone,
} from "../../../components/ui";
import { formatDate, formatTime } from "../../../lib/format";
import { HttpError, problemMessage } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { saveBlob } from "../../documents/saveBlob";
import { decisionReportsApi } from "../api";
import type { DecisionReportsDict } from "../i18n";
import type { DecisionReport, PagedResult, ReportInput, ReportRevision, ReportStatus } from "../types";

const statusTone: Record<ReportStatus, BadgeTone> = {
  Draft: "accent",
  Approved: "success",
  ReturnedForRevision: "warning",
  Rejected: "danger",
};
const isConflict = (e: unknown) => e instanceof HttpError && e.status === 409;
const editable = (r: DecisionReport) => r.status === "Draft" || r.status === "ReturnedForRevision";

type Review = { report: DecisionReport; kind: "return" | "reject" } | null;

export function DecisionReportsBoard({
  caseId,
  canWrite,
  canReview,
  names,
  t,
  locale,
}: {
  caseId: string;
  /** `cases.manage.all`, or `cases.manage.own` as assigned lawyer. */
  canWrite: boolean;
  /** `legal_decisions.approve`. */
  canReview: boolean;
  names: Map<string, string>;
  t: DecisionReportsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [data, setData] = useState<PagedResult<DecisionReport> | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [selected, setSelected] = useState<DecisionReport | null>(null);
  const [history, setHistory] = useState<ReportRevision[] | null>(null);
  const [form, setForm] = useState<{ report: DecisionReport | null } | null>(null);
  const [review, setReview] = useState<Review>(null);
  const [approving, setApproving] = useState<DecisionReport | null>(null);
  const [approveBusy, setApproveBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    return decisionReportsApi
      .search({ caseId, status: status || undefined, search: search.trim(), page, pageSize: 25 })
      .then(setData)
      .catch(() => setFailed(true));
  }, [caseId, status, search, page]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const loadHistory = (id: string) =>
    decisionReportsApi
      .history(id)
      .then((r) => setHistory(r.items))
      .catch(() => setHistory([]));

  const open = (report: DecisionReport) => {
    setSelected(report);
    setHistory(null);
    setActionError(null);
    // Search results can omit internal analysis — read the full record.
    decisionReportsApi.get(report.id).then(setSelected).catch(() => undefined);
    loadHistory(report.id);
  };

  /** Applies a result, or reloads on 409. Throws other errors to the caller. */
  const apply = async (id: string, fn: () => Promise<DecisionReport>) => {
    try {
      const next = await fn();
      setSelected((s) => (s?.id === next.id || !s ? next : s));
      setNotice(null);
      loadHistory(next.id);
      await load();
      return true;
    } catch (e) {
      if (!isConflict(e)) throw e;
      setNotice(t.conflict);
      const fresh = await decisionReportsApi.get(id).catch(() => null);
      if (fresh) setSelected(fresh);
      await load();
      return false;
    }
  };

  const actionLabel = (action: string | null) => {
    const a = (action ?? "").toLowerCase();
    if (a.includes("approv")) return t.actions.approved;
    if (a.includes("return")) return t.actions.returned;
    if (a.includes("reject")) return t.actions.rejected;
    if (a.includes("creat")) return t.actions.created;
    if (a.includes("updat") || a.includes("edit")) return t.actions.updated;
    return action ?? "—";
  };

  const sel = selected;
  const selectClass = "rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:outline-none";

  return (
    <div className="space-y-4">
      <Alert tone="warning" show={!!notice}>
        {notice}
      </Alert>

      <div className="overflow-hidden rounded-card border border-line">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <SearchInput value={search} placeholder={t.search} onChange={(e) => (setPage(1), setSearch(e.target.value))} />
          <select value={status} onChange={(e) => (setPage(1), setStatus(e.target.value as ReportStatus | ""))} className={selectClass}>
            <option value="">{t.allStatuses}</option>
            {(Object.keys(t.statuses) as ReportStatus[]).map((s) => (
              <option key={s} value={s}>
                {t.statuses[s]}
              </option>
            ))}
          </select>
          <div className="ms-auto">
            <ExportButton
              path="reports"
              filters={{ caseId, status: status || undefined, search: search.trim() }}
              fileName="reports"
              formats={["Xlsx"]}
              locale={locale}
              compact
            />
          </div>
          {canWrite && (
            <Button className=" h-9 px-3 text-[13px]" onClick={() => setForm({ report: null })}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.newReport}
            </Button>
          )}
        </div>

        <div className="px-5 pt-4">
          <Alert tone="danger" show={failed}>
            {t.loadError}
          </Alert>
        </div>

        {!data && !failed && <Spinner block />}
        {data && data.items.length === 0 && <EmptyState>{t.empty}</EmptyState>}

        {data && data.items.length > 0 && (
          <ul className="divide-y divide-line">
            {data.items.map((r, i) => (
              <motion.li
                key={r.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
              >
                <button type="button" onClick={() => open(r)} className="flex w-full items-start gap-3 px-5 py-3.5 text-start transition-colors hover:bg-background">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                    <FileSignature className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-text-primary">{r.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-text-muted">{r.publicSummary}</p>
                  </div>
                  <Badge tone={statusTone[r.status]}>{t.statuses[r.status]}</Badge>
                </button>
              </motion.li>
            ))}
          </ul>
        )}

        {data && (
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })} />
        )}
      </div>

      <Drawer
        open={!!sel}
        onClose={() => setSelected(null)}
        title={sel?.title ?? ""}
        subtitle={sel && <Badge tone={statusTone[sel.status]}>{t.statuses[sel.status]}</Badge>}
        closeLabel={t.close}
        dir={locale === "ar" ? "rtl" : "ltr"}
        width="max-w-xl"
        footer={
          sel && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                className="h-10 px-3 text-[13px]"
                onClick={async () => {
                  try {
                    saveBlob(await decisionReportsApi.exportPdf(sel.id), `${sel.title || "report"}.pdf`);
                  } catch (e) {
                    setActionError(problemMessage(e, t.loadError));
                  }
                }}
              >
                <Download className="h-4 w-4" strokeWidth={1.75} />
                {t.exportPdf}
              </Button>
              {canWrite && editable(sel) && (
                <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => setForm({ report: sel })}>
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  {t.edit}
                </Button>
              )}
              {canReview && sel.status === "Draft" && (
                <>
                  <Button variant="danger" className="h-10 px-3 text-[13px]" onClick={() => setReview({ report: sel, kind: "reject" })}>
                    <Ban className="h-4 w-4" strokeWidth={1.75} />
                    {t.reject}
                  </Button>
                  <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => setReview({ report: sel, kind: "return" })}>
                    <Undo2 className="h-4 w-4" strokeWidth={1.75} />
                    {t.returnForRevision}
                  </Button>
                  <Button className="h-10 px-3 text-[13px]" onClick={() => setApproving(sel)}>
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                    {t.approve}
                  </Button>
                </>
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
            {sel.status === "ReturnedForRevision" && <Alert tone="warning">{t.returnedBanner}</Alert>}
            {(sel.status === "Approved" || sel.status === "Rejected") && <Alert tone="info">{t.finalBanner}</Alert>}

            {sel.reviewNotes && (
              <div className={`rounded-lg px-4 py-3 ${sel.status === "Rejected" ? "bg-danger-surface" : "bg-warning-surface"}`}>
                <p className="text-[12px] font-medium text-text-muted">{t.reviewNotes}</p>
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] text-text-primary">{sel.reviewNotes}</p>
                {sel.reviewedByEmployeeId && (
                  <p className="mt-1.5 text-[11.5px] tabular-nums text-text-muted">
                    {names.get(sel.reviewedByEmployeeId) ?? ""} {sel.reviewedAtUtc ? `· ${formatDate(sel.reviewedAtUtc, locale)}` : ""}
                  </p>
                )}
              </div>
            )}

            <section>
              <p className="text-[12px] font-medium text-text-muted">{t.fields.publicSummary}</p>
              <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-primary">{sel.publicSummary}</p>
            </section>

            {sel.internalAnalysis && (
              <section className="rounded-lg border border-dashed border-line bg-background px-4 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t.fields.internalAnalysis}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-primary">{sel.internalAnalysis}</p>
              </section>
            )}

            {sel.approvedByEmployeeId && (
              <p className="text-[12.5px] text-text-muted">
                {t.fields.approvedBy}: {names.get(sel.approvedByEmployeeId) ?? "—"}
                {sel.approvedAtUtc ? ` · ${formatDate(sel.approvedAtUtc, locale)}` : ""}
              </p>
            )}

            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
                <History className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                {t.history}
              </h3>
              {history === null ? (
                <Spinner block />
              ) : history.length === 0 ? (
                <p className="text-[12.5px] text-text-muted">—</p>
              ) : (
                <ol className="space-y-3">
                  {history.map((h) => (
                    <li key={h.revision} className="rounded-lg border border-line px-3.5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-semibold tabular-nums text-text-primary">{interpolate(t.revision, { n: h.revision })}</span>
                        <Badge>{actionLabel(h.action)}</Badge>
                        <Badge tone={statusTone[h.status]}>{t.statuses[h.status]}</Badge>
                        <span className="ms-auto text-[11.5px] tabular-nums text-text-muted">
                          {names.get(h.actorId) ?? ""} · {formatDate(h.recordedAtUtc, locale)} {formatTime(h.recordedAtUtc, locale)}
                        </span>
                      </div>
                      {h.reviewNotes && <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] text-text-muted">{h.reviewNotes}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <ReportFormDialog
        state={form}
        onClose={() => setForm(null)}
        onSubmit={async (input) => {
          const editingReport = form?.report;
          if (!editingReport) {
            const created = await decisionReportsApi.create(caseId, input);
            setPage(1);
            await load();
            open(created);
            return;
          }
          await apply(editingReport.id, () => decisionReportsApi.update(editingReport.id, input));
        }}
        t={t}
      />

      <ReviewNotesDialog
        review={review}
        onClose={() => setReview(null)}
        onSubmit={async (notes) => {
          if (!review) return;
          const { report, kind } = review;
          await apply(report.id, () =>
            kind === "return" ? decisionReportsApi.returnForRevision(report.id, notes) : decisionReportsApi.reject(report.id, notes)
          );
        }}
        t={t}
      />

      <ConfirmDialog
        open={!!approving}
        onClose={() => setApproving(null)}
        busy={approveBusy}
        tone="primary"
        title={t.approve}
        confirmLabel={t.approve}
        cancelLabel={t.cancel}
        closeLabel={t.close}
        onConfirm={async () => {
          if (!approving) return;
          setApproveBusy(true);
          try {
            await apply(approving.id, () => decisionReportsApi.approve(approving.id));
          } catch (e) {
            setActionError(problemMessage(e, t.saveError));
          } finally {
            setApproveBusy(false);
            setApproving(null);
          }
        }}
      >
        <p className="font-medium">{approving?.title}</p>
        <p className="mt-1 text-text-muted">{t.approveConfirm}</p>
      </ConfirmDialog>
    </div>
  );
}

/* ───────────── dialogs ───────────── */

function ReportFormDialog({
  state,
  onClose,
  onSubmit,
  t,
}: {
  state: { report: DecisionReport | null } | null;
  onClose: () => void;
  onSubmit: (input: ReportInput) => Promise<void>;
  t: DecisionReportsDict;
}) {
  const [v, setV] = useState<ReportInput>({ title: "", publicSummary: "", internalAnalysis: "" });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state) {
      const r = state.report;
      setV({ title: r?.title ?? "", publicSummary: r?.publicSummary ?? "", internalAnalysis: r?.internalAnalysis ?? "" });
      setTouched(false);
      setError(null);
    }
  }
  const missing = (s: string) => (touched && !s.trim() ? t.required : undefined);

  const save = async () => {
    setTouched(true);
    if (!v.title.trim() || !v.publicSummary.trim() || !v.internalAnalysis.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ title: v.title.trim(), publicSummary: v.publicSummary.trim(), internalAnalysis: v.internalAnalysis.trim() });
      onClose();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      busy={busy}
      title={state?.report ? t.editReport : t.newReport}
      closeLabel={t.close}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button loading={busy} loadingLabel={t.saving} onClick={save}>
            {t.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <Field id="report-title" label={t.fields.title} maxLength={300} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} error={missing(v.title)} disabled={busy} />
        <TextArea
          id="report-summary"
          label={t.fields.publicSummary}
          hint={t.fields.publicSummaryHint}
          rows={4}
          maxLength={4000}
          value={v.publicSummary}
          onChange={(e) => setV({ ...v, publicSummary: e.target.value })}
          error={missing(v.publicSummary)}
          disabled={busy}
        />
        <TextArea
          id="report-analysis"
          label={t.fields.internalAnalysis}
          hint={t.fields.internalAnalysisHint}
          rows={8}
          value={v.internalAnalysis}
          onChange={(e) => setV({ ...v, internalAnalysis: e.target.value })}
          error={missing(v.internalAnalysis)}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

function ReviewNotesDialog({
  review,
  onClose,
  onSubmit,
  t,
}: {
  review: Review;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
  t: DecisionReportsDict;
}) {
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(review);
  if (review !== seen) {
    setSeen(review);
    if (review) {
      setNotes("");
      setTouched(false);
      setError(null);
    }
  }
  const reject = review?.kind === "reject";

  const save = async () => {
    setTouched(true);
    if (!notes.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(notes.trim());
      onClose();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!review}
      onClose={onClose}
      busy={busy}
      title={reject ? t.reject : t.returnForRevision}
      hint={reject ? t.rejectHint : review?.report.title}
      closeLabel={t.close}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button variant={reject ? "danger" : "primary"} loading={busy} loadingLabel={t.saving} onClick={save}>
            {reject ? t.reject : t.returnForRevision}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <TextArea
          id="review-notes"
          label={t.reviewNotes}
          rows={4}
          maxLength={4000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={touched && !notes.trim() ? t.required : undefined}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}
