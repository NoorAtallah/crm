"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Ban, Plus, Receipt, RotateCcw } from "lucide-react";
import { Alert, Badge, Button, Field, IconButton, SelectField, Switch } from "../../../components/ui";
import { formatDate, formatMoney } from "../../../lib/format";
import { problemMessage } from "../../../lib/http";
import type { Locale } from "../../../lib/i18n";
import { financeApi } from "../api";
import type { FinanceDict } from "../i18n";
import type { CaseRef, ClientRef, Expense } from "../types";
import { ClientCaseFields, CURRENCIES, download, FormShell, isConflict, ListState, ReasonDialog, today, Toolbar, usePagedList, type FinanceScope } from "./shared";

export function ExpensesPanel({ scope, clients, cases, canManage, names, t, locale }: {
  scope: FinanceScope;
  clients: ClientRef[];
  cases: CaseRef[];
  canManage: boolean;
  names: Map<string, string>;
  t: FinanceDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const list = usePagedList(financeApi.expenses, { clientId: scope.clientId, caseId: scope.caseId });
  const [creating, setCreating] = useState(false);
  const [voiding, setVoiding] = useState<Expense | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <Toolbar
        search={list.search}
        onSearch={list.setSearch}
        t={t}
        onExport={() => download(financeApi.exportList("expenses", list.query), "expenses.xlsx", setNotice, t)}
        action={
          canManage && (
            <Button className="h-9 px-3 text-[13px]" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.expenses.new}
            </Button>
          )
        }
      />
      <div className="space-y-2 px-5 pt-4">
        <Alert tone="info">{t.expenses.staffOnly}</Alert>
        <Alert tone="warning" show={!!notice}>
          {notice}
        </Alert>
      </div>
      <ListState data={list.data} failed={list.failed} t={t} onPage={list.setPage}>
        <ul className="divide-y divide-line">
          {list.data?.items.map((x, i) => (
            <motion.li
              key={x.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
              className={`flex items-start gap-3 px-5 py-3.5 ${x.voidReason ? "opacity-60" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                <Receipt className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-[13.5px] text-text-primary ${x.voidReason ? "line-through" : ""}`}>{x.description}</p>
                  {x.reimbursable && (
                    <Badge tone="info">
                      <RotateCcw className="me-1 h-3 w-3" strokeWidth={2} />
                      {t.expenses.reimbursable}
                    </Badge>
                  )}
                  {x.voidReason && <Badge tone="danger">{t.expenses.voided}</Badge>}
                </div>
                <p className="mt-0.5 text-[12.5px] tabular-nums text-text-muted">
                  {formatDate(x.incurredOn, locale)}
                  {!scope.clientId && ` · ${names.get(x.clientId) ?? "—"}`}
                  {x.caseId && !scope.caseId ? ` · ${cases.find((c) => c.id === x.caseId)?.caseNumber ?? ""}` : ""}
                </p>
                {x.voidReason && <p className="mt-0.5 text-[12px] text-danger">{x.voidReason}</p>}
              </div>
              <span className="text-[14px] font-semibold tabular-nums text-text-primary">{formatMoney(x.amount, x.currency, locale)}</span>
              {canManage && !x.voidReason && <IconButton icon={Ban} label={t.expenses.void} tone="danger" onClick={() => setVoiding(x)} />}
            </motion.li>
          ))}
        </ul>
      </ListState>

      <NewExpenseDialog
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
      <ReasonDialog
        open={!!voiding}
        title={t.expenses.void}
        hint={voiding?.description ?? undefined}
        onClose={() => setVoiding(null)}
        onSubmit={async (reason) => {
          try {
            await financeApi.voidExpense(voiding!.id, reason, voiding!.version);
          } catch (e) {
            if (!isConflict(e)) throw e;
            setNotice(t.conflict);
          }
          await list.load();
        }}
        t={t}
      />
    </div>
  );
}

function NewExpenseDialog({ open, scope, clients, cases, onClose, onCreated, t }: {
  open: boolean;
  scope: FinanceScope;
  clients: ClientRef[];
  cases: CaseRef[];
  onClose: () => void;
  onCreated: () => void;
  t: FinanceDict;
}) {
  const blank = () => ({ clientId: scope.clientId ?? "", caseId: scope.caseId ?? "", description: "", amount: "", currency: "JOD", incurredOn: today(), reimbursable: false });
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
  const amount = Number(v.amount.replace(",", "."));
  const save = async () => {
    setTouched(true);
    if (!v.clientId || !v.description.trim() || !(amount > 0) || !v.incurredOn || busy) return;
    setBusy(true);
    setError(null);
    try {
      await financeApi.createExpense({
        clientId: v.clientId,
        caseId: v.caseId || null,
        consultationId: null,
        description: v.description.trim(),
        amount,
        currency: v.currency,
        incurredOn: v.incurredOn,
        reimbursable: v.reimbursable,
      });
      onClose();
      onCreated();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };
  return (
    <FormShell open={open} title={t.expenses.new} hint={t.expenses.staffOnly} busy={busy} error={error} onClose={onClose} onSave={save} t={t}>
      <ClientCaseFields scope={scope} clients={clients} cases={cases} clientId={v.clientId} caseId={v.caseId} onChange={(n) => setV({ ...v, ...n })} errorClient={touched && !v.clientId ? t.required : undefined} busy={busy} t={t} />
      <Field id="exp-desc" label={t.expenses.description} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} error={touched && !v.description.trim() ? t.required : undefined} disabled={busy} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="exp-amount" dir="ltr" inputMode="decimal" label={t.common.amount} value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} error={touched && !(amount > 0) ? t.positive : undefined} disabled={busy} />
        <SelectField id="exp-currency" label={t.common.currency} value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c, label: c }))} disabled={busy} />
        <Field id="exp-date" type="date" dir="ltr" label={t.expenses.incurredOn} max={today()} value={v.incurredOn} onChange={(e) => setV({ ...v, incurredOn: e.target.value })} disabled={busy} />
      </div>
      <Switch checked={v.reimbursable} onChange={(x) => setV({ ...v, reimbursable: x })} label={t.expenses.reimbursable} hint={t.expenses.reimbursableHint} disabled={busy} />
    </FormShell>
  );
}
