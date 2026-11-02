"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, EyeOff, Mail, MessageCircle, MessageSquare, Phone, Plus, Users, type LucideIcon } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,

  ExportButton,  Field,
  Modal,
  Pagination,
  SearchInput,
  SegmentedControl,
  SelectField,
  Spinner,
  Switch,
  TextArea,
} from "../../../components/ui";
import { formatDate, formatTime } from "../../../lib/format";
import { problemMessage } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { communicationsApi } from "../api";
import type { CommunicationsDict } from "../i18n";
import { CHANNELS, type Channel, type Communication, type Direction, type PagedResult } from "../types";

const channelIcon: Record<Channel, LucideIcon> = {
  Email: Mail,
  Phone,
  Sms: MessageSquare,
  WhatsApp: MessageCircle,
  Meeting: Users,
  Other: MessageSquare,
};

const pad = (n: number) => String(n).padStart(2, "0");
const nowLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Communication log filtered to a client, case and/or consultation.
 * New entries are linked to whatever this log is scoped to.
 */
export function CommunicationsLog({
  clientId,
  caseId,
  consultationId,
  clients = [],
  canLog,
  names,
  t,
  locale,
  compact = false,
}: {
  clientId?: string;
  caseId?: string;
  consultationId?: string;
  /** Needed only when `clientId` isn't fixed. */
  clients?: { id: string; fullName: string }[];
  canLog: boolean;
  names: Map<string, string>;
  t: CommunicationsDict;
  locale: Locale;
  /** Tighter layout for use inside a drawer. */
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<Channel | "">("");
  const [data, setData] = useState<PagedResult<Communication> | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logging, setLogging] = useState<object | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    return communicationsApi
      .search({ clientId, caseId, consultationId, channel: channel || undefined, search: search.trim(), page, pageSize: compact ? 10 : 25 })
      .then(setData)
      .catch(() => setFailed(true));
  }, [clientId, caseId, consultationId, channel, search, page, compact]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const selectClass = "rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:outline-none";

  return (
    <div className={compact ? "space-y-3" : "overflow-hidden rounded-card border border-line bg-surface"}>
      <div className={`flex flex-wrap items-center gap-3 ${compact ? "" : "border-b border-line px-5 py-4"}`}>
        {!compact && <SearchInput value={search} placeholder={t.search} onChange={(e) => (setPage(1), setSearch(e.target.value))} />}
        {!compact && (
          <select value={channel} onChange={(e) => (setPage(1), setChannel(e.target.value as Channel | ""))} className={selectClass}>
            <option value="">{t.allChannels}</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {t.channels[c]}
              </option>
            ))}
          </select>
        )}
        {compact && <h3 className="text-[13px] font-semibold text-text-primary">{t.title}</h3>}
        {!compact && (
          <div className={canLog ? "" : "ms-auto"}>
            <ExportButton
              path="communications"
              filters={{ clientId, caseId, consultationId, channel: channel || undefined, search: search.trim() }}
              fileName="correspondence"
              locale={locale}
              compact
            />
          </div>
        )}
        {canLog && (
          <Button className="ms-auto h-9 px-3 text-[13px]" variant={compact ? "secondary" : "primary"} onClick={() => setLogging({})}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t.log}
          </Button>
        )}
      </div>

      <Alert tone="danger" show={failed}>
        {t.loadError}
      </Alert>
      {!data && !failed && <Spinner block />}
      {data && data.items.length === 0 && <EmptyState>{t.empty}</EmptyState>}

      {data && data.items.length > 0 && (
        <ul className={compact ? "space-y-2" : "divide-y divide-line"}>
          {data.items.map((c, i) => {
            const Icon = channelIcon[c.channel];
            const Dir = c.direction === "Inbound" ? ArrowDownLeft : ArrowUpRight;
            const open = expanded === c.id;
            return (
              <motion.li
                key={c.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
                className={compact ? "rounded-lg border border-line" : ""}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : c.id)}
                  className={`flex w-full items-start gap-3 text-start transition-colors hover:bg-background ${compact ? "px-3 py-2.5" : "px-5 py-3.5"}`}
                >
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                    <Icon className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                    <Dir className={`absolute -bottom-1 -end-1 h-3.5 w-3.5 rounded-full bg-surface ${c.direction === "Inbound" ? "text-info" : "text-success"}`} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-medium text-text-primary">{c.subject}</p>
                      <Badge>{t.channels[c.channel]}</Badge>
                      {!c.visibleToClient && <EyeOff className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />}
                    </div>
                    <p className="mt-0.5 text-[12px] tabular-nums text-text-muted">
                      {t.directions[c.direction]} · {formatDate(c.occurredAtUtc, locale)} {formatTime(c.occurredAtUtc, locale)}
                      {c.participant ? ` · ${c.participant}` : ""}
                      {c.actorId && names.get(c.actorId) ? ` · ${names.get(c.actorId)}` : ""}
                    </p>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {open && (c.body || c.internalNotes) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`space-y-2 pb-3 ${compact ? "px-3" : "px-5 ps-[68px]"}`}>
                        {c.body && <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-primary">{c.body}</p>}
                        {c.internalNotes && (
                          <p className="whitespace-pre-wrap rounded-md border border-dashed border-line bg-background px-3 py-2 text-[12.5px] text-text-muted">
                            {c.internalNotes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}

      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })} />
      )}

      <LogDialog
        open={logging}
        onClose={() => setLogging(null)}
        fixedClientId={clientId}
        clients={clients}
        onSubmit={async (input) => {
          await communicationsApi.create({ ...input, caseId: caseId ?? null, consultationId: consultationId ?? null });
          setPage(1);
          await load();
        }}
        t={t}
      />
    </div>
  );
}

function LogDialog({
  open,
  onClose,
  fixedClientId,
  clients,
  onSubmit,
  t,
}: {
  open: object | null;
  onClose: () => void;
  fixedClientId?: string;
  clients: { id: string; fullName: string }[];
  onSubmit: (input: {
    clientId: string;
    channel: Channel;
    direction: Direction;
    participant: string | null;
    subject: string;
    body: string | null;
    internalNotes: string | null;
    visibleToClient: boolean;
    occurredAtUtc: string;
  }) => Promise<void>;
  t: CommunicationsDict;
}) {
  const blank = () => ({
    clientId: fixedClientId ?? "",
    channel: "Phone" as Channel,
    direction: "Outbound" as Direction,
    participant: "",
    subject: "",
    body: "",
    internalNotes: "",
    visibleToClient: false,
    occurredAt: nowLocal(),
  });
  const [v, setV] = useState(blank);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) {
      setV(blank());
      setTouched(false);
      setError(null);
    }
  }

  const save = async () => {
    setTouched(true);
    if (!v.clientId || !v.subject.trim() || !v.occurredAt || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        clientId: v.clientId,
        channel: v.channel,
        direction: v.direction,
        participant: v.participant.trim() || null,
        subject: v.subject.trim(),
        body: v.body.trim() || null,
        internalNotes: v.internalNotes.trim() || null,
        visibleToClient: v.visibleToClient,
        occurredAtUtc: new Date(v.occurredAt).toISOString(),
      });
      onClose();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!open}
      onClose={onClose}
      busy={busy}
      title={t.log}
      hint={t.logHint}
      closeLabel={t.close}
      maxWidth="max-w-xl"
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
        <Alert tone="info">{t.immutable}</Alert>
        {!fixedClientId && (
          <SelectField
            id="comm-client"
            label={t.fields.client}
            value={v.clientId}
            placeholder="—"
            onChange={(e) => setV({ ...v, clientId: e.target.value })}
            options={clients.map((c) => ({ value: c.id, label: c.fullName }))}
            error={touched && !v.clientId ? t.required : undefined}
            disabled={busy}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="comm-channel"
            label={t.fields.channel}
            value={v.channel}
            onChange={(e) => setV({ ...v, channel: e.target.value as Channel })}
            options={CHANNELS.map((c) => ({ value: c, label: t.channels[c] }))}
            disabled={busy}
          />
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-text-primary">{t.fields.direction}</p>
            <SegmentedControl<Direction>
              id="comm-direction"
              value={v.direction}
              onChange={(d) => setV({ ...v, direction: d })}
              options={[
                { key: "Outbound", label: t.directions.Outbound },
                { key: "Inbound", label: t.directions.Inbound },
              ]}
            />
          </div>
        </div>
        <Field id="comm-subject" label={t.fields.subject} maxLength={300} value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value })} error={touched && !v.subject.trim() ? t.required : undefined} disabled={busy} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="comm-participant" label={t.fields.participant} placeholder={t.fields.participantPlaceholder} maxLength={1000} value={v.participant} onChange={(e) => setV({ ...v, participant: e.target.value })} disabled={busy} />
          <Field id="comm-when" type="datetime-local" dir="ltr" label={t.fields.occurredAt} max={nowLocal()} value={v.occurredAt} onChange={(e) => setV({ ...v, occurredAt: e.target.value })} disabled={busy} />
        </div>
        <TextArea id="comm-body" label={t.fields.body} rows={4} maxLength={16000} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} disabled={busy} />
        <TextArea id="comm-notes" label={t.fields.internalNotes} hint={t.fields.internalNotesHint} rows={2} maxLength={8000} value={v.internalNotes} onChange={(e) => setV({ ...v, internalNotes: e.target.value })} disabled={busy} />
        <Switch checked={v.visibleToClient} onChange={(x) => setV({ ...v, visibleToClient: x })} label={t.fields.visibleToClient} disabled={busy} />
      </div>
    </Modal>
  );
}
