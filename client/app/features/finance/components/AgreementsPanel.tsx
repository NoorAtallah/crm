"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Handshake, Plus } from "lucide-react";
import { Alert, Button, Field, SelectField, TextArea } from "../../../components/ui";
import { formatMoney } from "../../../lib/format";
import { problemMessage } from "../../../lib/http";
import type { Locale } from "../../../lib/i18n";
import { financeApi } from "../api";
import type { FinanceDict } from "../i18n";
import type { CaseRef, ClientRef } from "../types";
import { ClientCaseFields, CURRENCIES, download, FormShell, ListState, Toolbar, usePagedList, type FinanceScope } from "./shared";

export function AgreementsPanel({ scope, clients, cases, canManage, names, t, locale }: {
  scope: FinanceScope;
  clients: ClientRef[];
  cases: CaseRef[];
  canManage: boolean;
  names: Map<string, string>;
  t: FinanceDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const list = usePagedList(financeApi.agreements, { clientId: scope.clientId, caseId: scope.caseId });
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <Toolbar
        search={list.search}
        onSearch={list.setSearch}
        t={t}
        onExport={() => download(financeApi.exportList("fee-agreements", list.query), "fee-agreements.xlsx", setNotice, t)}
        action={
          canManage && (
            <Button className="h-9 px-3 text-[13px]" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.agreements.new}
            </Button>
          )
        }
      />
      <div className="px-5 pt-4">
        <Alert tone="danger" show={!!notice}>
          {notice}
        </Alert>
      </div>
      <ListState data={list.data} failed={list.failed} t={t} onPage={list.setPage}>
        <ul className="divide-y divide-line">
          {list.data?.items.map((a, i) => (
            <motion.li
              key={a.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
              className="flex items-start gap-3 px-5 py-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                <Handshake className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-[13.5px] text-text-primary">{a.terms}</p>
                <p className="mt-0.5 text-[12.5px] text-text-muted">
                  {!scope.clientId && (names.get(a.clientId) ?? "—")}
                  {a.caseId && !scope.caseId ? ` · ${cases.find((c) => c.id === a.caseId)?.caseNumber ?? ""}` : ""}
                </p>
              </div>
              <span className="text-[14px] font-semibold tabular-nums text-text-primary">{formatMoney(a.amount, a.currency, locale)}</span>
            </motion.li>
          ))}
        </ul>
      </ListState>

      <NewAgreementDialog
        open={creating}
        scope={scope}
        clients={clients}
        cases={cases}
        onClose={() => setCreating(false)}
        onCreated={async () => {
          list.setPage(1);
          await list.load();
        }}
        t={t}
      />
    </div>
  );
}

function NewAgreementDialog({ open, scope, clients, cases, onClose, onCreated, t }: {
  open: boolean;
  scope: FinanceScope;
  clients: ClientRef[];
  cases: CaseRef[];
  onClose: () => void;
  onCreated: () => void;
  t: FinanceDict;
}) {
  const [v, setV] = useState({ clientId: "", caseId: "", terms: "", amount: "", currency: "JOD" });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) {
      setV({ clientId: scope.clientId ?? "", caseId: scope.caseId ?? "", terms: "", amount: "", currency: "JOD" });
      setTouched(false);
      setError(null);
    }
  }
  const amount = Number(v.amount.replace(",", "."));
  const save = async () => {
    setTouched(true);
    if (!v.clientId || !v.terms.trim() || !(amount > 0) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await financeApi.createAgreement({ clientId: v.clientId, caseId: v.caseId || null, consultationId: null, terms: v.terms.trim(), amount, currency: v.currency });
      onClose();
      onCreated();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };
  return (
    <FormShell open={open} title={t.agreements.new} hint={t.common.immutable} busy={busy} error={error} onClose={onClose} onSave={save} t={t}>
      <ClientCaseFields
        scope={scope}
        clients={clients}
        cases={cases}
        clientId={v.clientId}
        caseId={v.caseId}
        onChange={(n) => setV({ ...v, ...n })}
        errorClient={touched && !v.clientId ? t.required : undefined}
        busy={busy}
        t={t}
      />
      <TextArea id="agr-terms" label={t.agreements.terms} placeholder={t.agreements.termsPlaceholder} rows={4} value={v.terms} onChange={(e) => setV({ ...v, terms: e.target.value })} error={touched && !v.terms.trim() ? t.required : undefined} disabled={busy} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="agr-amount" dir="ltr" inputMode="decimal" label={t.common.amount} value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} error={touched && !(amount > 0) ? t.positive : undefined} disabled={busy} />
        <SelectField id="agr-currency" label={t.common.currency} value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c, label: c }))} disabled={busy} />
      </div>
    </FormShell>
  );
}
