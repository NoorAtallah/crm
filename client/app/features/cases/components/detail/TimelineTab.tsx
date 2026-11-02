"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Gavel, Plus, Sparkles, StickyNote } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  Modal,
  Pagination,
  SearchInput,
  SegmentedControl,
  Spinner,
  Switch,
  TextArea,
} from "../../../../components/ui";
import { formatDate, formatTime } from "../../../../lib/format";
import { problemMessage } from "../../../../lib/http";
import { interpolate, type Locale } from "../../../../lib/i18n";
import { casesApi } from "../../api";
import type { CasesDict } from "../../i18n";
import type { AddTimelineInput, CaseTimelineEntry, CaseTimelineKind, ManualTimelineKind, PagedResult } from "../../types";
import { isConflict, orNull } from "./shared";

type KindFilter = "all" | "Note" | "Procedure";

export function TimelineTab({
  caseId,
  version,
  onVersion,
  canManage,
  names,
  onConflict,
  t: dict,
  locale,
}: {
  caseId: string;
  version: string;
  onVersion: (v: string) => void;
  canManage: boolean;
  names: Map<string, string>;
  onConflict: () => Promise<void>;
  t: CasesDict;
  locale: Locale;
}) {
  const t = dict.detail;
  const tt = t.timeline;
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<PagedResult<CaseTimelineEntry> | null>(null);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    return casesApi
      .timeline(caseId, { page, pageSize: 25, search: search.trim(), kind: kind === "all" ? undefined : (kind as CaseTimelineKind) })
      .then(setData)
      .catch(() => setFailed(true));
  }, [caseId, page, search, kind]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const iconOf = (k: CaseTimelineKind) => (k === "Note" ? StickyNote : k === "Procedure" ? Gavel : Sparkles);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <SearchInput
          value={search}
          placeholder={tt.search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <SegmentedControl
          id="timeline-kind"
          value={kind}
          onChange={(k) => {
            setPage(1);
            setKind(k);
          }}
          options={[
            { key: "all", label: tt.allKinds },
            { key: "Note", label: tt.kinds.Note },
            { key: "Procedure", label: tt.kinds.Procedure },
          ]}
        />
        {canManage && (
          <Button className="ms-auto h-9 px-3 text-[13px]" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            {tt.add}
          </Button>
        )}
      </div>

      <div className="px-5 pt-4">
        <Alert tone="danger" show={failed}>
          {t.loadError}
        </Alert>
      </div>

      {!data && !failed && <Spinner block />}

      {data &&
        (data.items.length === 0 ? (
          <EmptyState>{tt.empty}</EmptyState>
        ) : (
          <ol className="relative px-5 py-4">
            {data.items.map((entry, index) => {
              const Icon = iconOf(entry.kind);
              const manual = entry.kind === "Note" || entry.kind === "Procedure";
              return (
                <motion.li
                  key={entry.id}
                  initial={reduceMotion ? false : { opacity: 0, x: locale === "ar" ? 8 : -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {index < data.items.length - 1 && (
                    <span className="absolute start-[17px] top-9 bottom-0 w-px bg-line" />
                  )}
                  <span
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                      manual ? "border-brand-champagne bg-brand-champagne-light" : "border-line bg-background"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={manual ? "accent" : "neutral"}>{tt.kinds[entry.kind]}</Badge>
                      {entry.title && <p className="text-[13.5px] font-medium text-text-primary">{entry.title}</p>}
                      {entry.visibleToClient ? (
                        <Eye className="h-3.5 w-3.5 text-success" strokeWidth={1.75} aria-label={tt.visibleToClient} />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />
                      )}
                    </div>
                    {entry.details && (
                      <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-text-primary">{entry.details}</p>
                    )}
                    <p className="mt-1.5 text-[12px] tabular-nums text-text-muted">
                      {formatDate(entry.occurredAtUtc, locale)} · {formatTime(entry.occurredAtUtc, locale)}
                      {entry.actorEmployeeId && names.get(entry.actorEmployeeId) && ` · ${names.get(entry.actorEmployeeId)}`}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        ))}

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onChange={setPage}
          label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })}
        />
      )}

      <AddEntryDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSubmit={async (input) => {
          try {
            const res = await casesApi.addTimeline(caseId, input, version);
            onVersion(res.version);
            setPage(1);
            await load();
            return true;
          } catch (e) {
            if (isConflict(e)) {
              setAdding(false);
              await onConflict();
              return false;
            }
            throw e;
          }
        }}
        t={dict}
      />
    </div>
  );
}

function AddEntryDialog({
  open,
  onClose,
  onSubmit,
  t: dict,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: AddTimelineInput) => Promise<boolean>;
  t: CasesDict;
}) {
  const tt = dict.detail.timeline;
  const [kind, setKind] = useState<ManualTimelineKind>("Note");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedFor, setOpenedFor] = useState(false);
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) {
      setKind("Note");
      setTitle("");
      setDetails("");
      setOccurredAt("");
      setVisible(false);
      setTouched(false);
      setError(null);
    }
  }

  async function save() {
    setTouched(true);
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onSubmit({
        kind,
        title: title.trim(),
        details: orNull(details),
        visibleToClient: visible,
        // datetime-local is local time; the API wants UTC.
        occurredAtUtc: occurredAt ? new Date(occurredAt).toISOString() : undefined,
      });
      if (ok) onClose();
    } catch (e) {
      setError(problemMessage(e, dict.detail.saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={tt.add}
      hint={tt.appendOnly}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {dict.cancel}
          </Button>
          <Button loading={busy} loadingLabel={dict.detail.saving} onClick={save}>
            {dict.detail.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-text-primary">{tt.kind}</p>
          <SegmentedControl
            id="new-entry-kind"
            value={kind}
            onChange={setKind}
            options={[
              { key: "Note", label: tt.kinds.Note },
              { key: "Procedure", label: tt.kinds.Procedure },
            ]}
          />
        </div>
        <Field
          id="entry-title"
          label={tt.title}
          maxLength={300}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={touched && !title.trim() ? dict.required : undefined}
          disabled={busy}
        />
        <TextArea
          id="entry-details"
          label={tt.details}
          maxLength={8000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          disabled={busy}
        />
        <Field
          id="entry-occurred"
          type="datetime-local"
          label={tt.occurredAt}
          max={new Date().toISOString().slice(0, 16)}
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          disabled={busy}
          dir="ltr"
        />
        <p className="-mt-2 text-[12.5px] text-text-muted">{tt.occurredAtHint}</p>
        <Switch checked={visible} onChange={setVisible} label={tt.visibleToClient} disabled={busy} />
      </div>
    </Modal>
  );
}
