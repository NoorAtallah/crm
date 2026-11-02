"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Ban, CreditCard, Download, FileText, Plus, Send, Trash2, Undo2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DescriptionList,

  ExportButton,  Drawer,
  Field,
  IconButton,
  SelectField,
  Spinner,
  type BadgeTone,
} from "../../../components/ui";
import { formatDate, formatMoney } from "../../../lib/format";
import { problemMessage } from "../../../lib/http";
import type { Locale } from "../../../lib/i18n";
import { financeApi } from "../api";
import type { FinanceDict } from "../i18n";
import { lineTotal, type CaseRef, type ClientRef, type FeeAgreement, type Invoice, type InvoiceStatus, type Payment } from "../types";
import {
  ClientCaseFields,
  CURRENCIES,
  download,
  FormShell,
  isConflict,
  ListState,
  ReasonDialog,
  today,
  Toolbar,
  usePagedList,
  type FinanceScope,
} from "./shared";

const statusTone: Record<InvoiceStatus, BadgeTone> = { Draft: "accent", Issued: "info", Void: "neutral" };
const METHODS = ["Cash", "BankTransfer", "Cheque", "Card", "Other"] as const;

export function InvoicesPanel({
  scope,
  clients,
  cases,
  canManage,
  names,
  t,
  locale,
}: {
  scope: FinanceScope;
  clients: ClientRef[];
  cases: CaseRef[];
  canManage: boolean;
  names: Map<string, string>;
  t: FinanceDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [clientFilter, setClientFilter] = useState("");
  const [overdue, setOverdue] = useState(false);
  const list = usePagedList(financeApi.invoices, {
    clientId: scope.clientId ?? (clientFilter || undefined),
    caseId: scope.caseId,
    status: status || undefined,
    overdue: overdue || undefined,
  });

  const [selected, setSelected] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueBusy, setIssueBusy] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [paying, setPaying] = useState(false);
  const [reversing, setReversing] = useState<Payment | null>(null);

  const open = (inv: Invoice) => {
    setSelected(inv);
    setActionError(null);
    setPayments(null);
    financeApi.invoice(inv.id).then(setSelected).catch(() => undefined);
    financeApi.payments(inv.id).then((r) => setPayments(r.items)).catch(() => setPayments([]));
  };

  /** Versioned invoice write; on 409 refresh and tell the user. */
  const apply = async (fn: (version: string) => Promise<Invoice>) => {
    if (!selected) return;
    try {
      const next = await fn(selected.version);
      setSelected(next);
      setNotice(null);
      financeApi.payments(next.id).then((r) => setPayments(r.items)).catch(() => undefined);
      await list.load();
    } catch (e) {
      if (!isConflict(e)) throw e;
      setNotice(t.conflict);
      const fresh = await financeApi.invoice(selected.id).catch(() => null);
      if (fresh) setSelected(fresh);
      await list.load();
    }
  };

  const selectClass = "rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:outline-none";
  const sel = selected;

  return (
    <div>
      <Toolbar
        search={list.search}
        onSearch={list.setSearch}
        t={t}
        onExport={() => download(financeApi.exportList("invoices", list.query), "invoices.xlsx", setNotice, t)}
        action={
          canManage && (
            <Button className="h-9 px-3 text-[13px]" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.invoices.new}
            </Button>
          )
        }
      >
        <select value={status} onChange={(e) => (list.setPage(1), setStatus(e.target.value as InvoiceStatus | ""))} className={selectClass}>
          <option value="">{t.allStatuses}</option>
          {(["Draft", "Issued", "Void"] as const).map((s) => (
            <option key={s} value={s}>
              {t.invoices.statuses[s]}
            </option>
          ))}
        </select>
        {!scope.clientId && clients.length > 0 && (
          <select value={clientFilter} onChange={(e) => (list.setPage(1), setClientFilter(e.target.value))} className={selectClass}>
            <option value="">{t.allClients}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-[13px] text-text-muted">
          <input type="checkbox" checked={overdue} onChange={(e) => (list.setPage(1), setOverdue(e.target.checked))} className="h-4 w-4 accent-brand-charcoal" />
          {t.overdueOnly}
        </label>
      </Toolbar>

      <div className="px-5 pt-4">
        <Alert tone="warning" show={!!notice}>
          {notice}
        </Alert>
      </div>

      <ListState data={list.data} failed={list.failed} t={t} onPage={list.setPage}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-start">
            <thead>
              <tr className="border-b border-line text-[12.5px] text-text-muted">
                <th className="px-5 py-3 text-start font-medium">{t.invoices.number}</th>
                {!scope.clientId && <th className="px-5 py-3 text-start font-medium">{t.common.client}</th>}
                <th className="px-5 py-3 text-start font-medium">{t.invoices.dueOn}</th>
                <th className="px-5 py-3 text-end font-medium">{t.invoices.total}</th>
                <th className="px-5 py-3 text-end font-medium">{t.invoices.balance}</th>
                <th className="px-5 py-3 text-start font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.data?.items.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
                  onClick={() => open(inv)}
                  className={`cursor-pointer transition-colors hover:bg-background ${inv.status === "Void" ? "opacity-60" : ""}`}
                >
                  <td className="px-5 py-3.5 text-[13.5px] font-medium tabular-nums text-text-primary" dir="ltr">
                    {inv.number}
                  </td>
                  {!scope.clientId && <td className="px-5 py-3.5 text-[13px] text-text-primary">{names.get(inv.clientId) ?? "—"}</td>}
                  <td className={`px-5 py-3.5 text-[12.5px] tabular-nums ${inv.isOverdue ? "text-danger" : "text-text-muted"}`}>{formatDate(inv.dueOn, locale)}</td>
                  <td className="px-5 py-3.5 text-end text-[13px] tabular-nums text-text-primary">{formatMoney(inv.total, inv.currency, locale)}</td>
                  <td className="px-5 py-3.5 text-end text-[13px] font-medium tabular-nums text-text-primary">{formatMoney(inv.balance, inv.currency, locale)}</td>
                  <td className="px-5 py-3.5">
                    <span className="flex justify-end gap-1.5">
                      {inv.isOverdue && <Badge tone="danger">{t.invoices.overdue}</Badge>}
                      <Badge tone={statusTone[inv.status]}>{t.invoices.statuses[inv.status]}</Badge>
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </ListState>

      <Drawer
        open={!!sel}
        onClose={() => setSelected(null)}
        title={sel ? sel.number : ""}
        subtitle={
          sel && (
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone[sel.status]}>{t.invoices.statuses[sel.status]}</Badge>
              {sel.isOverdue && <Badge tone="danger">{t.invoices.overdue}</Badge>}
            </span>
          )
        }
        closeLabel={t.close}
        dir={locale === "ar" ? "rtl" : "ltr"}
        width="max-w-xl"
        footer={
          sel && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => download(financeApi.invoicePdf(sel.id), `${sel.number}.pdf`, setActionError, t)}>
                <Download className="h-4 w-4" strokeWidth={1.75} />
                {t.invoices.pdf}
              </Button>
              {canManage && sel.status !== "Void" && (
                <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => setVoiding(true)}>
                  <Ban className="h-4 w-4" strokeWidth={1.75} />
                  {t.invoices.void}
                </Button>
              )}
              {canManage && sel.status === "Draft" && (
                <Button className="h-10 px-3 text-[13px]" onClick={() => setIssuing(true)}>
                  <Send className="h-4 w-4" strokeWidth={1.75} />
                  {t.invoices.issue}
                </Button>
              )}
              {canManage && sel.status === "Issued" && sel.balance > 0 && (
                <Button className="h-10 px-3 text-[13px]" onClick={() => setPaying(true)}>
                  <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                  {t.payments.record}
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
            {sel.status === "Draft" && <Alert tone="info">{t.invoices.draftHint}</Alert>}
            {sel.voidReason && <Alert tone="warning">{sel.voidReason}</Alert>}

            <DescriptionList
              columns={2}
              items={[
                { label: t.common.client, value: names.get(sel.clientId) },
                { label: t.common.case, value: sel.caseId ? cases.find((c) => c.id === sel.caseId)?.caseNumber ?? "✓" : null },
                { label: t.invoices.issueOn, value: <span className="tabular-nums">{formatDate(sel.issueOn, locale)}</span> },
                { label: t.invoices.dueOn, value: <span className={`tabular-nums ${sel.isOverdue ? "text-danger" : ""}`}>{formatDate(sel.dueOn, locale)}</span> },
              ]}
            />

            <section className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-start text-[13px]">
                <thead className="bg-background text-[12px] text-text-muted">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t.invoices.description}</th>
                    <th className="px-3 py-2 text-end font-medium">{t.invoices.quantity}</th>
                    <th className="px-3 py-2 text-end font-medium">{t.invoices.unitPrice}</th>
                    <th className="px-3 py-2 text-end font-medium">{t.invoices.lineTotal}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(sel.lines ?? []).map((l, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-text-primary">{l.description}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{l.quantity}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{formatMoney(l.unitPrice, sel.currency, locale)}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{formatMoney(l.total ?? lineTotal(l.quantity, l.unitPrice), sel.currency, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="space-y-1 border-t border-line bg-background px-3 py-3 text-[13px]">
                {[
                  [t.invoices.net, sel.net],
                  [t.invoices.tax, sel.tax],
                  [t.invoices.total, sel.total],
                  [t.invoices.paid, sel.paid],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <dt className="text-text-muted">{label}</dt>
                    <dd className="tabular-nums text-text-primary">{formatMoney(value as number, sel.currency, locale)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
                  <dt>{t.invoices.balance}</dt>
                  <dd className="tabular-nums">{formatMoney(sel.balance, sel.currency, locale)}</dd>
                </div>
              </dl>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-text-primary">{t.payments.title}</h3>
                {payments && payments.length > 0 && (
                  <ExportButton path={`invoices/${sel.id}/payments`} fileName={`${sel.number}-payments`} formats={["Xlsx"]} locale={locale} compact />
                )}
              </div>
              {payments === null ? (
                <Spinner block />
              ) : payments.length === 0 ? (
                <p className="text-[12.5px] text-text-muted">{t.payments.empty}</p>
              ) : (
                <ul className="space-y-2">
                  {payments.map((p) => (
                    <li key={p.id} className={`flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 ${p.reversedAtUtc ? "opacity-60" : ""}`}>
                      <CreditCard className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-medium tabular-nums text-text-primary ${p.reversedAtUtc ? "line-through" : ""}`}>
                          {formatMoney(p.amount, sel.currency, locale)}
                        </p>
                        <p className="text-[11.5px] tabular-nums text-text-muted">
                          {formatDate(p.paidOn, locale)} · {(p.method && (t.payments.methods as Record<string, string>)[p.method]) || p.method} · {p.reference}
                        </p>
                        {p.reversalReason && <p className="text-[11.5px] text-danger">{p.reversalReason}</p>}
                      </div>
                      {p.reversedAtUtc ? (
                        <Badge tone="danger">{t.payments.reversed}</Badge>
                      ) : (
                        canManage && <IconButton icon={Undo2} label={t.payments.reverse} tone="danger" onClick={() => setReversing(p)} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <NewInvoiceDialog
        open={creating}
        scope={scope}
        clients={clients}
        cases={cases}
        onClose={() => setCreating(false)}
        onCreated={async (inv) => {
          list.setPage(1);
          await list.load();
          open(inv);
        }}
        t={t}
        locale={locale}
      />

      <ConfirmDialog
        open={issuing}
        onClose={() => setIssuing(false)}
        busy={issueBusy}
        tone="primary"
        title={t.invoices.issue}
        confirmLabel={t.invoices.issue}
        cancelLabel={t.cancel}
        closeLabel={t.close}
        onConfirm={async () => {
          setIssueBusy(true);
          try {
            await apply((v) => financeApi.issueInvoice(sel!.id, v));
          } catch (e) {
            setActionError(problemMessage(e, t.saveError));
          } finally {
            setIssueBusy(false);
            setIssuing(false);
          }
        }}
      >
        <p>{t.invoices.issueConfirm}</p>
      </ConfirmDialog>

      <ReasonDialog
        open={voiding}
        title={t.invoices.void}
        hint={t.invoices.voidHint}
        onClose={() => setVoiding(false)}
        onSubmit={(reason) => apply((v) => financeApi.voidInvoice(sel!.id, reason, v))}
        t={t}
      />

      <ReasonDialog
        open={!!reversing}
        title={t.payments.reverse}
        hint={reversing && sel ? formatMoney(reversing.amount, sel.currency, locale) : undefined}
        onClose={() => setReversing(null)}
        onSubmit={(reason) => apply(async (v) => (await financeApi.reversePayment(sel!.id, reversing!.id, reason, v)).invoice)}
        t={t}
      />

      <PaymentDialog
        open={paying}
        invoice={sel}
        onClose={() => setPaying(false)}
        onSubmit={(input) => apply(async (v) => (await financeApi.recordPayment(sel!.id, input, v)).invoice)}
        t={t}
        locale={locale}
      />
    </div>
  );
}

/* ───────────── new invoice ───────────── */

interface LineDraft {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
}

function NewInvoiceDialog({ open, scope, clients, cases, onClose, onCreated, t, locale }: {
  open: boolean;
  scope: FinanceScope;
  clients: ClientRef[];
  cases: CaseRef[];
  onClose: () => void;
  onCreated: (inv: Invoice) => void;
  t: FinanceDict;
  locale: Locale;
}) {
  const due = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  };
  const blankLine = (key: number): LineDraft => ({ key, description: "", quantity: "1", unitPrice: "" });
  const [clientId, setClientId] = useState(scope.clientId ?? "");
  const [caseId, setCaseId] = useState(scope.caseId ?? "");
  const [number, setNumber] = useState("");
  const [currency, setCurrency] = useState("JOD");
  const [issueOn, setIssueOn] = useState(today());
  const [dueOn, setDueOn] = useState(due());
  const [tax, setTax] = useState("0");
  const [agreementId, setAgreementId] = useState("");
  const [agreements, setAgreements] = useState<FeeAgreement[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([blankLine(1)]);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) {
      setClientId(scope.clientId ?? "");
      setCaseId(scope.caseId ?? "");
      setNumber("");
      setCurrency("JOD");
      setIssueOn(today());
      setDueOn(due());
      setTax("0");
      setAgreementId("");
      setLines([blankLine(1)]);
      setTouched(false);
      setError(null);
    }
  }

  // Agreements for the chosen client — the invoice must share client and currency.
  useEffect(() => {
    if (!open || !clientId) {
      setAgreements([]);
      return;
    }
    financeApi
      .agreements({ clientId, pageSize: 100 })
      .then((r) => setAgreements(r.items))
      .catch(() => setAgreements([]));
  }, [open, clientId]);

  const num = (s: string) => Number(s.replace(",", "."));
  const net = useMemo(
    () => lines.reduce((sum, l) => sum + (num(l.quantity) > 0 && num(l.unitPrice) > 0 ? lineTotal(num(l.quantity), num(l.unitPrice)) : 0), 0),
    [lines]
  );
  const taxValue = Math.max(0, num(tax) || 0);

  const validLines = lines.filter((l) => l.description.trim() && num(l.quantity) > 0 && num(l.unitPrice) > 0);
  const dateError = issueOn && dueOn && dueOn < issueOn ? t.invoices.dueBeforeIssue : undefined;

  const save = async () => {
    setTouched(true);
    if (!clientId || !number.trim() || !issueOn || !dueOn || dateError || validLines.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const inv = await financeApi.createInvoice({
        clientId,
        caseId: caseId || null,
        consultationId: null,
        feeAgreementId: agreementId || null,
        number: number.trim(),
        currency,
        issueOn,
        dueOn,
        tax: taxValue,
        lines: validLines.map((l) => ({ description: l.description.trim(), quantity: num(l.quantity), unitPrice: num(l.unitPrice) })),
      });
      onClose();
      onCreated(inv);
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };

  const matchingAgreements = agreements.filter((a) => a.currency === currency && (!caseId || !a.caseId || a.caseId === caseId));
  const inputClass = "h-10 w-full rounded-lg border border-line bg-surface px-2.5 text-[13.5px] text-text-primary outline-none focus:border-brand-charcoal";

  return (
    <FormShell open={open} title={t.invoices.new} busy={busy} error={error} onClose={onClose} onSave={save} t={t} wide>
      <ClientCaseFields
        scope={scope}
        clients={clients}
        cases={cases}
        clientId={clientId}
        caseId={caseId}
        onChange={(n) => (setClientId(n.clientId), setCaseId(n.caseId), setAgreementId(""))}
        errorClient={touched && !clientId ? t.required : undefined}
        busy={busy}
        t={t}
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Field id="inv-number" dir="ltr" label={t.invoices.number} placeholder="INV-2026-0001" value={number} onChange={(e) => setNumber(e.target.value)} error={touched && !number.trim() ? t.required : undefined} disabled={busy} />
        </div>
        <SelectField id="inv-currency" label={t.common.currency} value={currency} onChange={(e) => (setCurrency(e.target.value), setAgreementId(""))} options={CURRENCIES.map((c) => ({ value: c, label: c }))} disabled={busy} />
        <SelectField
          id="inv-agreement"
          label={t.invoices.agreement}
          value={agreementId}
          onChange={(e) => setAgreementId(e.target.value)}
          options={[{ value: "", label: t.common.none }, ...matchingAgreements.map((a) => ({ value: a.id, label: `${formatMoney(a.amount, a.currency, locale)} — ${(a.terms ?? "").slice(0, 40)}` }))]}
          disabled={busy || matchingAgreements.length === 0}
        />
        <div className="sm:col-span-2">
          <Field id="inv-issue" type="date" dir="ltr" label={t.invoices.issueOn} value={issueOn} onChange={(e) => setIssueOn(e.target.value)} disabled={busy} />
        </div>
        <div className="sm:col-span-2">
          <Field id="inv-due" type="date" dir="ltr" label={t.invoices.dueOn} min={issueOn} value={dueOn} onChange={(e) => setDueOn(e.target.value)} error={dateError} disabled={busy} />
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-medium text-text-primary">{t.invoices.lines}</p>
          <Button variant="secondary" className="h-8 px-2.5 text-[12.5px]" disabled={busy || lines.length >= 200} onClick={() => setLines((ls) => [...ls, blankLine(Date.now())])}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            {t.invoices.addLine}
          </Button>
        </div>
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_80px_120px_110px_32px] gap-2 px-1 text-[11.5px] text-text-muted sm:grid">
            <span>{t.invoices.description}</span>
            <span>{t.invoices.quantity}</span>
            <span>{t.invoices.unitPrice}</span>
            <span className="text-end">{t.invoices.lineTotal}</span>
            <span />
          </div>
          <AnimatePresence initial={false}>
            {lines.map((l) => {
              const total = num(l.quantity) > 0 && num(l.unitPrice) > 0 ? lineTotal(num(l.quantity), num(l.unitPrice)) : 0;
              const set = (patch: Partial<LineDraft>) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, ...patch } : x)));
              return (
                <motion.div
                  key={l.key}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="grid grid-cols-[1fr_80px_120px_110px_32px] items-center gap-2 overflow-hidden"
                >
                  <input className={inputClass} value={l.description} placeholder={t.invoices.description} onChange={(e) => set({ description: e.target.value })} disabled={busy} />
                  <input className={`${inputClass} tabular-nums`} dir="ltr" inputMode="decimal" value={l.quantity} onChange={(e) => set({ quantity: e.target.value })} disabled={busy} />
                  <input className={`${inputClass} tabular-nums`} dir="ltr" inputMode="decimal" value={l.unitPrice} placeholder="0.000" onChange={(e) => set({ unitPrice: e.target.value })} disabled={busy} />
                  <span className="text-end text-[13px] tabular-nums text-text-primary">{formatMoney(total, currency, locale)}</span>
                  <IconButton icon={Trash2} label="×" tone="danger" disabled={busy || lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} />
                </motion.div>
              );
            })}
          </AnimatePresence>
          {touched && validLines.length === 0 && <p className="text-[12.5px] text-danger">{t.invoices.atLeastOneLine}</p>}
        </div>
      </section>

      <div className="ms-auto max-w-xs space-y-2 rounded-lg bg-background px-4 py-3 text-[13px]">
        <div className="flex justify-between">
          <span className="text-text-muted">{t.invoices.net}</span>
          <span className="tabular-nums">{formatMoney(net, currency, locale)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-muted" title={t.invoices.taxHint}>
            {t.invoices.tax}
          </span>
          <input className={`${inputClass} h-8 w-28 text-end tabular-nums`} dir="ltr" inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} disabled={busy} />
        </div>
        <div className="flex justify-between border-t border-line pt-2 font-semibold">
          <span>{t.invoices.total}</span>
          <span className="tabular-nums">{formatMoney(net + taxValue, currency, locale)}</span>
        </div>
      </div>
    </FormShell>
  );
}

/* ───────────── record payment ───────────── */

function PaymentDialog({ open, invoice, onClose, onSubmit, t, locale }: {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSubmit: (input: { amount: number; reference: string; method: string; idempotencyKey: string; paidOn: string }) => Promise<void>;
  t: FinanceDict;
  locale: Locale;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("BankTransfer");
  const [reference, setReference] = useState("");
  const [paidOn, setPaidOn] = useState(today());
  // One key per dialog opening: a retried submit can't double-record.
  const [key, setKey] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open && invoice) {
      setAmount(String(invoice.balance));
      setMethod("BankTransfer");
      setReference("");
      setPaidOn(today());
      setKey(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
      setTouched(false);
      setError(null);
    }
  }
  const value = Number(amount.replace(",", "."));
  const amountError = !touched ? undefined : !(value > 0) ? t.positive : invoice && value > invoice.balance ? t.payments.exceeds : undefined;

  const save = async () => {
    setTouched(true);
    if (!(value > 0) || (invoice && value > invoice.balance) || !reference.trim() || !paidOn || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ amount: value, reference: reference.trim(), method, idempotencyKey: key, paidOn });
      onClose();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormShell
      open={open}
      title={t.payments.record}
      hint={invoice ? `${invoice.number} · ${t.invoices.balance}: ${formatMoney(invoice.balance, invoice.currency, locale)}` : undefined}
      busy={busy}
      error={error}
      onClose={onClose}
      onSave={save}
      t={t}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pay-amount" dir="ltr" inputMode="decimal" label={`${t.common.amount} (${invoice?.currency ?? ""})`} value={amount} onChange={(e) => setAmount(e.target.value)} error={amountError} disabled={busy} />
        <Field id="pay-date" type="date" dir="ltr" label={t.payments.paidOn} max={today()} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} disabled={busy} />
        <SelectField id="pay-method" label={t.payments.method} value={method} onChange={(e) => setMethod(e.target.value)} options={METHODS.map((m) => ({ value: m, label: t.payments.methods[m] }))} disabled={busy} />
        <Field id="pay-ref" dir="ltr" label={t.payments.reference} placeholder={t.payments.referencePlaceholder} value={reference} onChange={(e) => setReference(e.target.value)} error={touched && !reference.trim() ? t.required : undefined} disabled={busy} />
      </div>
    </FormShell>
  );
}

export const InvoiceIcon = FileText;
