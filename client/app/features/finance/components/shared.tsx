"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { Alert, Button, Modal, Pagination, SearchInput, SelectField, Spinner, EmptyState, TextArea } from "../../../components/ui";
import { HttpError, problemMessage } from "../../../lib/http";
import { interpolate } from "../../../lib/i18n";
import { saveBlob } from "../../documents/saveBlob";
import type { FinanceDict } from "../i18n";
import type { CaseRef, ClientRef, FinanceQuery, PagedResult } from "../types";

export const isConflict = (e: unknown) => e instanceof HttpError && e.status === 409;
export const today = () => new Date().toISOString().slice(0, 10);
export const CURRENCIES = ["JOD", "USD", "EUR", "SAR", "AED", "KWD", "QAR", "BHD", "EGP", "GBP"];

/** Scope shared by every panel: fixed client/case on a case page, free on /billing. */
export interface FinanceScope {
  clientId?: string;
  caseId?: string;
}

/** Paged list with search + extra filters; reloads on change, debounced search. */
export function usePagedList<T>(fetcher: (q: FinanceQuery) => Promise<PagedResult<T>>, filters: FinanceQuery) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PagedResult<T> | null>(null);
  const [failed, setFailed] = useState(false);
  const key = JSON.stringify(filters);

  const load = useCallback(() => {
    setFailed(false);
    return fetcher({ ...filters, search: search.trim(), page, pageSize: 25 })
      .then(setData)
      .catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, search, page]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  return {
    data,
    failed,
    load,
    page,
    setPage,
    search,
    setSearch: (s: string) => {
      setPage(1);
      setSearch(s);
    },
    query: { ...filters, search: search.trim() } as FinanceQuery,
  };
}

/** Toolbar row used by every panel. */
export function Toolbar({ children, search, onSearch, t, onExport, action }: {
  children?: ReactNode;
  search: string;
  onSearch: (s: string) => void;
  t: FinanceDict;
  onExport?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
      <SearchInput value={search} placeholder={t.search} onChange={(e) => onSearch(e.target.value)} />
      {children}
      <div className="ms-auto flex gap-2">
        {onExport && (
          <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={onExport}>
            <Download className="h-4 w-4" strokeWidth={1.75} />
            {t.exportExcel}
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

export function ListState<T>({ data, failed, t, children, onPage }: {
  data: PagedResult<T> | null;
  failed: boolean;
  t: FinanceDict;
  children: ReactNode;
  onPage: (p: number) => void;
}) {
  return (
    <>
      <div className="px-5 pt-4">
        <Alert tone="danger" show={failed}>
          {t.loadError}
        </Alert>
      </div>
      {!data && !failed && <Spinner block />}
      {data && data.items.length === 0 && <EmptyState>{t.empty}</EmptyState>}
      {data && data.items.length > 0 && children}
      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={onPage} label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })} />
      )}
    </>
  );
}

export async function download(blob: Promise<Blob>, name: string, onError: (m: string) => void, t: FinanceDict) {
  try {
    saveBlob(await blob, name);
  } catch (e) {
    onError(problemMessage(e, t.loadError));
  }
}

/** Client + case pickers; hidden when the scope fixes them. */
export function ClientCaseFields({ scope, clients, cases, clientId, caseId, onChange, errorClient, busy, t }: {
  scope: FinanceScope;
  clients: ClientRef[];
  cases: CaseRef[];
  clientId: string;
  caseId: string;
  onChange: (next: { clientId: string; caseId: string }) => void;
  errorClient?: string;
  busy: boolean;
  t: FinanceDict;
}) {
  if (scope.clientId && scope.caseId) return null;
  const clientCases = cases.filter((c) => c.clientId === clientId);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {!scope.clientId && (
        <SelectField
          id="fin-client"
          label={t.common.client}
          value={clientId}
          placeholder="—"
          onChange={(e) => onChange({ clientId: e.target.value, caseId: "" })}
          options={clients.map((c) => ({ value: c.id, label: c.fullName }))}
          error={errorClient}
          disabled={busy}
        />
      )}
      {!scope.caseId && (
        <SelectField
          id="fin-case"
          label={t.common.case}
          value={caseId}
          onChange={(e) => onChange({ clientId, caseId: e.target.value })}
          options={[{ value: "", label: t.common.none }, ...clientCases.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.title}` }))]}
          disabled={busy || !clientId}
        />
      )}
    </div>
  );
}

/** "Give a reason" modal for void/reverse actions. */
export function ReasonDialog({ open, title, hint, onClose, onSubmit, t }: {
  open: boolean;
  title: string;
  hint?: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  t: FinanceDict;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) {
      setReason("");
      setTouched(false);
      setError(null);
    }
  }
  const save = async () => {
    setTouched(true);
    if (!reason.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(reason.trim());
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
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button variant="danger" loading={busy} loadingLabel={t.saving} onClick={save}>
            {title}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <TextArea id="fin-reason" label={t.reason} rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} error={touched && !reason.trim() ? t.required : undefined} disabled={busy} />
      </div>
    </Modal>
  );
}

/** Generic save/cancel modal shell with error + busy state. */
export function FormShell({ open, title, hint, busy, error, onClose, onSave, t, wide, children }: {
  open: boolean;
  title: string;
  hint?: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  t: FinanceDict;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={title}
      hint={hint}
      closeLabel={t.close}
      maxWidth={wide ? "max-w-3xl" : "max-w-xl"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button loading={busy} loadingLabel={t.saving} onClick={onSave}>
            {t.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        {children}
      </div>
    </Modal>
  );
}
