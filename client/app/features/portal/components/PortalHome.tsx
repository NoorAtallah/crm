"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Briefcase, MessageSquareQuote } from "lucide-react";
import { Alert, Badge, Card, CardBody, CardHeader, EmptyState } from "../../../components/ui";
import { interpolate, type Locale } from "../../../lib/i18n";
import { portalApi } from "../api";
import type { PortalDict } from "../i18n";
import type { PortalAppointment, PortalCase, PortalConsultation, PortalInvoice } from "../types";
import { AppointmentRow, InvoiceRow } from "./bits";

export function PortalHome({ name, cases, upcoming, invoices, consultations, status, t, locale }: {
  name: string;
  /** Why the case list may be empty: "forbidden" = missing client_portal.read.own. */
  status: "ok" | "forbidden" | "error";
  cases: PortalCase[];
  upcoming: PortalAppointment[];
  invoices: PortalInvoice[];
  consultations: PortalConsultation[];
  t: PortalDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const caseLabel = new Map(cases.map((c) => [c.id, c.caseNumber]));
  const shownInvoices = invoices.filter((i) => i.status !== "Draft");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-text-primary">{interpolate(t.greeting, { name: name.split(" ")[0] })}</h1>
        <p className="mt-1 text-[14px] text-text-muted">{t.subtitle}</p>
      </header>

      <Alert tone={status === "forbidden" ? "warning" : "danger"} show={status !== "ok"}>
        {status === "forbidden" ? t.noAccess : t.loadError}
      </Alert>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-text-primary">{t.myCases}</h2>
        {cases.length === 0 && status === "ok" ? (
          <Card>
            <EmptyState>{t.noCases}</EmptyState>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c, i) => (
              <motion.div key={c.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.25), duration: 0.25 }}>
                <Link href={`/portal/cases/${c.id}`} className="group block h-full rounded-card border border-line bg-surface p-5 transition-colors hover:border-brand-charcoal">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-champagne-light">
                      <Briefcase className="h-5 w-5 text-warning" strokeWidth={1.75} />
                    </span>
                    <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? t.active : t.closed}</Badge>
                  </div>
                  <p className="mt-4 text-[12.5px] tabular-nums text-text-muted">{c.caseNumber}</p>
                  <p className="mt-0.5 line-clamp-2 text-[15px] font-semibold text-text-primary">{c.title}</p>
                  <div className="mt-3 flex items-center justify-between text-[12.5px] text-text-muted">
                    <span>
                      {t.stage}: {t.stages[c.stage] ?? c.stage}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      {t.openCase}
                      <ArrowLeft className="h-3.5 w-3.5 ltr:rotate-180" strokeWidth={1.75} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t.upcoming} />
          <CardBody>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-text-muted">{t.noUpcoming}</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((a) => (
                  <AppointmentRow key={a.id} a={a} caseLabel={caseLabel.get(a.caseId)} t={t} locale={locale} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t.invoices} />
          {shownInvoices.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-text-muted">{t.noInvoices}</p>
          ) : (
            <ul className="divide-y divide-line">
              {shownInvoices.map((inv) => (
                <InvoiceRow key={inv.id} inv={inv} fetchPdf={() => portalApi.invoicePdf(inv.id)} t={t} locale={locale} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {consultations.length > 0 && (
        <Card>
          <CardHeader title={t.consultations} />
          <ul className="divide-y divide-line">
            {consultations.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-5 py-3.5">
                <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-text-primary">{c.subject}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] text-text-muted">{c.outcome ?? c.publicSummary}</p>
                </div>
                {c.caseId ? (
                  <Link href={`/portal/cases/${c.caseId}`}>
                    <Badge tone="success">{t.consultationStatuses[c.status] ?? c.status}</Badge>
                  </Link>
                ) : (
                  <Badge>{t.consultationStatuses[c.status] ?? c.status}</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
