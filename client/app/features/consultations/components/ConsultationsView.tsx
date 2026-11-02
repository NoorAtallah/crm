"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Ban, Briefcase, CheckCircle2, EyeOff, MessageSquareQuote, Pencil, Plus, UserCog } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  DescriptionList,
  Drawer,
  EmptyState,

  ExportButton,  Field,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  SelectField,
  Spinner,
  TextArea,
  type BadgeTone,
} from "../../../components/ui";
import { HttpError, problemMessage } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { CommunicationsLog, type CommunicationsDict } from "../../communications";
import { consultationsApi } from "../api";
import type { ConsultationsDict } from "../i18n";
import { CONSULTATION_STATUSES, type Consultation, type ConsultationStatus, type PagedResult, type PersonRef } from "../types";

const statusTone: Record<ConsultationStatus, BadgeTone> = {
  Requested: "accent",
  Assigned: "info",
  Completed: "success",
  Cancelled: "neutral",
  Converted: "success",
};
const isOpen = (s: ConsultationStatus) => s === "Requested" || s === "Assigned";
const isConflict = (e: unknown) => e instanceof HttpError && e.status === 409;

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; item: Consultation }
  | { kind: "assign"; item: Consultation }
  | { kind: "finish"; item: Consultation; cancel: boolean }
  | { kind: "convert"; item: Consultation }
  | null;

export function ConsultationsView({
  clients,
  lawyers,
  viewerId,
  manageAll,
  canManageOwn,
  t,
  commsT,
  locale,
}: {
  clients: PersonRef[];
  lawyers: PersonRef[];
  viewerId: string;
  /** `cases.manage.all` — create, assign, convert. */
  manageAll: boolean;
  /** `cases.manage.own` — edit/finish when assigned. */
  canManageOwn: boolean;
  t: ConsultationsDict;
  commsT: CommunicationsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ConsultationStatus | "">("");
  const [clientId, setClientId] = useState("");
  const [data, setData] = useState<PagedResult<Consultation> | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const names = useMemo(() => new Map([...clients, ...lawyers].map((p) => [p.id, p.fullName])), [clients, lawyers]);

  const load = useCallback(() => {
    setFailed(false);
    return consultationsApi
      .search({ clientId: clientId || undefined, status: status || undefined, search: search.trim(), page, pageSize: 25 })
      .then(setData)
      .catch(() => setFailed(true));
  }, [clientId, status, search, page]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const canEdit = (c: Consultation) => isOpen(c.status) && (manageAll || (canManageOwn && c.lawyerId === viewerId));

  /** Runs a versioned write; on 409 refreshes and returns quietly. */
  const apply = async (item: Consultation, fn: (version: string) => Promise<Consultation>) => {
    try {
      const next = await fn(item.version);
      setSelected(next);
      setNotice(null);
      await load();
    } catch (e) {
      if (!isConflict(e)) throw e;
      setNotice(t.conflict);
      const fresh = await consultationsApi.get(item.id).catch(() => null);
      if (fresh) setSelected(fresh);
      await load();
    }
  };

  const selectClass = "rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:outline-none";
  const sel = selected;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            <ExportButton
              path="consultations"
              filters={{ clientId: clientId || undefined, status: status || undefined, search: search.trim() }}
              fileName="consultations"
              locale={locale}
            />
            {manageAll && (
              <Button onClick={() => setDialog({ kind: "create" })}>
                <Plus className="h-4 w-4" strokeWidth={2} />
                {t.newConsultation}
              </Button>
            )}
          </>
        }
      />

      <Alert tone="warning" show={!!notice}>
        {notice}
      </Alert>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <SearchInput value={search} placeholder={t.search} onChange={(e) => (setPage(1), setSearch(e.target.value))} />
          <select value={status} onChange={(e) => (setPage(1), setStatus(e.target.value as ConsultationStatus | ""))} className={selectClass}>
            <option value="">{t.allStatuses}</option>
            {CONSULTATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.statuses[s]}
              </option>
            ))}
          </select>
          {clients.length > 0 && (
            <select value={clientId} onChange={(e) => (setPage(1), setClientId(e.target.value))} className={selectClass}>
              <option value="">{t.allClients}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
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
            {data.items.map((c, i) => (
              <motion.li
                key={c.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
              >
                <button type="button" onClick={() => setSelected(c)} className="flex w-full items-start gap-3 px-5 py-3.5 text-start transition-colors hover:bg-background">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                    <MessageSquareQuote className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-text-primary">{c.subject}</p>
                    <p className="mt-0.5 text-[12.5px] text-text-muted">
                      {names.get(c.clientId) ?? "—"} · {c.lawyerId ? names.get(c.lawyerId) ?? "—" : t.unassigned}
                    </p>
                  </div>
                  <Badge tone={statusTone[c.status]}>{t.statuses[c.status]}</Badge>
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
        title={sel?.subject ?? ""}
        subtitle={sel && <Badge tone={statusTone[sel.status]}>{t.statuses[sel.status]}</Badge>}
        closeLabel={t.close}
        dir={locale === "ar" ? "rtl" : "ltr"}
        width="max-w-xl"
        footer={
          sel && (
            <div className="flex flex-wrap justify-end gap-2">
              {sel.caseId && (
                <Link href={`/cases/${sel.caseId}`}>
                  <Button variant="secondary" className="h-10 px-3 text-[13px]">
                    <Briefcase className="h-4 w-4" strokeWidth={1.75} />
                    {t.openCase}
                  </Button>
                </Link>
              )}
              {manageAll && sel.status === "Completed" && !sel.caseId && (
                <Button className="h-10 px-3 text-[13px]" onClick={() => setDialog({ kind: "convert", item: sel })}>
                  <Briefcase className="h-4 w-4" strokeWidth={1.75} />
                  {t.convert}
                </Button>
              )}
              {canEdit(sel) && (
                <>
                  <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => setDialog({ kind: "finish", item: sel, cancel: true })}>
                    <Ban className="h-4 w-4" strokeWidth={1.75} />
                    {t.cancelConsultation}
                  </Button>
                  <Button className="h-10 px-3 text-[13px]" onClick={() => setDialog({ kind: "finish", item: sel, cancel: false })}>
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                    {t.complete}
                  </Button>
                </>
              )}
            </div>
          )
        }
      >
        {sel && (
          <div className="space-y-5">
            {!isOpen(sel.status) && <Alert tone="info">{t.closedBanner}</Alert>}
            {(canEdit(sel) || (manageAll && isOpen(sel.status))) && (
              <div className="flex flex-wrap gap-2">
                {canEdit(sel) && (
                  <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={() => setDialog({ kind: "edit", item: sel })}>
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {t.edit}
                  </Button>
                )}
                {manageAll && isOpen(sel.status) && (
                  <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={() => setDialog({ kind: "assign", item: sel })}>
                    <UserCog className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {sel.lawyerId ? t.reassign : t.assign}
                  </Button>
                )}
              </div>
            )}
            <DescriptionList
              columns={2}
              items={[
                { label: t.fields.client, value: names.get(sel.clientId) },
                { label: t.fields.lawyer, value: sel.lawyerId ? names.get(sel.lawyerId) : t.unassigned },
                { label: t.fields.publicSummary, value: sel.publicSummary, full: true },
                ...(sel.outcome ? [{ label: t.fields.outcome, value: sel.outcome, full: true }] : []),
              ]}
            />
            {sel.internalNotes && (
              <div className="rounded-lg border border-dashed border-line bg-background px-4 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t.fields.internalNotes}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] text-text-primary">{sel.internalNotes}</p>
              </div>
            )}
            <div className="border-t border-line pt-4">
              <CommunicationsLog
                key={sel.id}
                clientId={sel.clientId}
                consultationId={sel.id}
                canLog={canEdit(sel) || manageAll}
                names={names}
                t={commsT}
                locale={locale}
                compact
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* create / edit */}
      <FormModal<"clientId" | "subject" | "publicSummary" | "internalNotes">
        open={dialog?.kind === "create" || dialog?.kind === "edit"}
        resetKey={dialog}
        title={dialog?.kind === "edit" ? t.editConsultation : t.newConsultation}
        t={t}
        initial={() => {
          const item = dialog?.kind === "edit" ? dialog.item : null;
          return { clientId: item?.clientId ?? "", subject: item?.subject ?? "", publicSummary: item?.publicSummary ?? "", internalNotes: item?.internalNotes ?? "" };
        }}
        required={dialog?.kind === "create" ? ["clientId", "subject", "publicSummary"] : ["subject", "publicSummary"]}
        onClose={() => setDialog(null)}
        onSubmit={async (v) => {
          const input = { subject: v.subject.trim(), publicSummary: v.publicSummary.trim(), internalNotes: v.internalNotes.trim() || null };
          if (dialog?.kind === "edit") await apply(dialog.item, (ver) => consultationsApi.update(dialog.item.id, input, ver));
          else {
            const created = await consultationsApi.create(v.clientId, input);
            setPage(1);
            await load();
            setSelected(created);
          }
        }}
        render={(v, set, err, busy) => (
          <>
            {dialog?.kind === "create" && (
              <SelectField id="c-client" label={t.fields.client} value={v.clientId} placeholder="—" onChange={(e) => set("clientId", e.target.value)} options={clients.map((c) => ({ value: c.id, label: c.fullName }))} error={err("clientId")} disabled={busy} />
            )}
            <Field id="c-subject" label={t.fields.subject} maxLength={300} value={v.subject} onChange={(e) => set("subject", e.target.value)} error={err("subject")} disabled={busy} />
            <TextArea id="c-summary" label={t.fields.publicSummary} hint={t.fields.publicSummaryHint} rows={4} maxLength={8000} value={v.publicSummary} onChange={(e) => set("publicSummary", e.target.value)} error={err("publicSummary")} disabled={busy} />
            <TextArea id="c-notes" label={t.fields.internalNotes} hint={t.fields.internalNotesHint} rows={3} maxLength={8000} value={v.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} disabled={busy} />
          </>
        )}
      />

      {/* assign */}
      <FormModal
        open={dialog?.kind === "assign"}
        resetKey={dialog}
        title={t.assign}
        t={t}
        initial={() => ({ lawyerId: dialog?.kind === "assign" ? dialog.item.lawyerId ?? "" : "" })}
        required={["lawyerId"]}
        onClose={() => setDialog(null)}
        onSubmit={async (v) => {
          if (dialog?.kind === "assign") await apply(dialog.item, (ver) => consultationsApi.assignLawyer(dialog.item.id, v.lawyerId, ver));
        }}
        render={(v, set, err, busy) => (
          <SelectField id="c-lawyer" label={t.fields.lawyer} value={v.lawyerId} placeholder="—" onChange={(e) => set("lawyerId", e.target.value)} options={lawyers.map((l) => ({ value: l.id, label: l.fullName }))} error={err("lawyerId")} disabled={busy} />
        )}
      />

      {/* finish / cancel */}
      <FormModal
        open={dialog?.kind === "finish"}
        resetKey={dialog}
        title={dialog?.kind === "finish" && dialog.cancel ? t.cancelConsultation : t.complete}
        danger={dialog?.kind === "finish" && dialog.cancel}
        t={t}
        initial={() => ({ outcome: "" })}
        required={["outcome"]}
        onClose={() => setDialog(null)}
        onSubmit={async (v) => {
          if (dialog?.kind === "finish") await apply(dialog.item, (ver) => consultationsApi.finish(dialog.item.id, dialog.cancel, v.outcome.trim(), ver));
        }}
        render={(v, set, err, busy) => (
          <TextArea id="c-outcome" label={t.fields.outcome} hint={t.fields.outcomeHint} rows={4} maxLength={8000} value={v.outcome} onChange={(e) => set("outcome", e.target.value)} error={err("outcome")} disabled={busy} />
        )}
      />

      {/* convert */}
      <FormModal<"caseNumber" | "title">
        open={dialog?.kind === "convert"}
        resetKey={dialog}
        title={t.convert}
        hint={t.convertHint}
        t={t}
        initial={() => ({ caseNumber: "", title: dialog?.kind === "convert" ? dialog.item.subject : "" })}
        required={["caseNumber", "title"]}
        onClose={() => setDialog(null)}
        onSubmit={async (v) => {
          if (dialog?.kind === "convert") await apply(dialog.item, (ver) => consultationsApi.convertToCase(dialog.item.id, v.caseNumber.trim(), v.title.trim(), ver));
        }}
        render={(v, set, err, busy) => (
          <>
            <Field id="c-case-number" dir="ltr" label={t.fields.caseNumber} placeholder="LC-2026-0001" value={v.caseNumber} onChange={(e) => set("caseNumber", e.target.value)} error={err("caseNumber")} disabled={busy} />
            <Field id="c-case-title" label={t.fields.caseTitle} value={v.title} onChange={(e) => set("title", e.target.value)} error={err("title")} disabled={busy} />
          </>
        )}
      />
    </div>
  );
}

/** Small generic form-in-a-modal: string fields, required checks, error/busy handling. */
function FormModal<K extends string>({
  open,
  resetKey,
  title,
  hint,
  danger = false,
  t,
  initial,
  required,
  onClose,
  onSubmit,
  render,
}: {
  open: boolean;
  resetKey: unknown;
  title: string;
  hint?: string;
  danger?: boolean;
  t: ConsultationsDict;
  initial: () => Record<K, string>;
  required: K[];
  onClose: () => void;
  onSubmit: (values: Record<K, string>) => Promise<void>;
  render: (
    values: Record<K, string>,
    set: (key: K, value: string) => void,
    error: (key: K) => string | undefined,
    busy: boolean
  ) => ReactNode;
}) {
  const [values, setValues] = useState<Record<K, string>>(initial);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(resetKey);
  if (resetKey !== seen) {
    setSeen(resetKey);
    if (open) {
      setValues(initial());
      setTouched(false);
      setError(null);
    }
  }
  const err = (k: K) => (touched && required.includes(k) && !values[k]?.trim() ? t.required : undefined);

  const save = async () => {
    setTouched(true);
    if (required.some((k) => !values[k]?.trim()) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={title}
      hint={hint}
      closeLabel={t.close}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={busy} loadingLabel={t.saving} onClick={save}>
            {danger ? title : t.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        {render(values, (k, v) => setValues((all) => ({ ...all, [k]: v })), err, busy)}
      </div>
    </Modal>
  );
}
