"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, FileSignature, FileText } from "lucide-react";
import { Alert, Badge, Card, CardBody, CardHeader, DescriptionList } from "../../../components/ui";
import { formatDate, formatFileSize, formatTime } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import { portalApi } from "../api";
import type { PortalDict } from "../i18n";
import type { PortalAppointment, PortalCaseFile, PortalCommunication, PortalDocument, PortalInvoice, PortalReport, PortalTimelineEntry } from "../types";
import { AppointmentRow, DownloadButton, InvoiceRow } from "./bits";

export function PortalCaseView({ file, documents, reports, appointments, timeline, communications, invoices, t, locale }: {
  file: PortalCaseFile;
  documents: PortalDocument[];
  reports: PortalReport[];
  appointments: PortalAppointment[];
  timeline: PortalTimelineEntry[];
  communications: PortalCommunication[];
  invoices: PortalInvoice[];
  t: PortalDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [error, setError] = useState<string | null>(null);
  const c = file.case;
  const shownInvoices = invoices.filter((i) => i.status !== "Draft");
  const fade = (i: number) => ({ initial: reduceMotion ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.25 } });

  return (
    <div className="space-y-5">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
        {t.back}
      </Link>

      <motion.header {...fade(0)} className="rounded-card border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] tabular-nums text-text-muted">{c.caseNumber}</span>
          <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? t.active : t.closed}</Badge>
          <Badge tone="accent">{t.stages[c.stage] ?? c.stage}</Badge>
        </div>
        <h1 className="mt-2 text-[22px] font-semibold text-text-primary">{c.title}</h1>
        <div className="mt-5">
          <DescriptionList
            columns={3}
            items={[
              { label: t.court, value: c.courtName },
              { label: t.courtNumber, value: c.courtCaseNumber && <span dir="ltr">{c.courtCaseNumber}</span> },
              { label: t.caseType, value: file.caseType },
              { label: t.openedOn, value: formatDate(c.createdAtUtc, locale) },
            ]}
          />
        </div>
        {file.description && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[12px] font-medium text-text-muted">{t.description}</p>
            <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-text-primary">{file.description}</p>
          </div>
        )}
      </motion.header>

      <Alert tone="danger" show={!!error}>
        {error}
      </Alert>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...fade(1)}>
          <Card className="h-full">
            <CardHeader title={t.appointments} />
            <CardBody>
              {appointments.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-text-muted">{t.noAppointments}</p>
              ) : (
                <ul className="space-y-2">
                  {appointments.map((a) => (
                    <AppointmentRow key={a.id} a={a} t={t} locale={locale} />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div {...fade(2)}>
          <Card className="h-full">
            <CardHeader title={t.documents} />
            {documents.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-text-muted">{t.noDocuments}</p>
            ) : (
              <ul className="divide-y divide-line">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <FileText className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-text-primary">{d.title || d.fileName}</p>
                      <p className="truncate text-[12px] text-text-muted">
                        {[d.category, d.sizeBytes ? formatFileSize(d.sizeBytes, locale) : null].filter(Boolean).join(" · ")}
                      </p>
                      {d.description && <p className="mt-0.5 line-clamp-2 text-[12px] text-text-muted">{d.description}</p>}
                    </div>
                    {d.contentUrl !== null && <DownloadButton fetcher={() => portalApi.downloadDocument(d.id)} name={d.fileName ?? "document"} label={t.download} onError={setError} />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div {...fade(3)}>
        <Card>
          <CardHeader title={t.reports} />
          {reports.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-text-muted">{t.noReports}</p>
          ) : (
            <ul className="divide-y divide-line">
              {reports.map((r) => (
                <li key={r.id} className="flex items-start gap-3 px-5 py-4">
                  <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-text-primary">{r.title}</p>
                    {r.approvedAtUtc && <p className="text-[12px] tabular-nums text-text-muted">{formatDate(r.approvedAtUtc, locale)}</p>}
                    <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-primary">{r.publicSummary}</p>
                  </div>
                  <DownloadButton fetcher={() => portalApi.reportPdf(r.id)} name={`${r.title}.pdf`} label={t.pdf} onError={setError} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...fade(4)}>
          <Card className="h-full">
            <CardHeader title={t.timeline} />
            <CardBody>
              {timeline.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-text-muted">{t.noTimeline}</p>
              ) : (
                <ol className="space-y-4">
                  {timeline.map((e, i) => (
                    <li key={e.id} className="relative flex gap-3">
                      {i < timeline.length - 1 && <span className="absolute start-[5px] top-4 bottom-[-16px] w-px bg-line" />}
                      <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-champagne" />
                      <div className="min-w-0">
                        {e.title && <p className="text-[13.5px] font-medium text-text-primary">{e.title}</p>}
                        {e.details && <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-text-primary">{e.details}</p>}
                        <p className="mt-0.5 text-[12px] tabular-nums text-text-muted">
                          {formatDate(e.occurredAtUtc, locale)} · {formatTime(e.occurredAtUtc, locale)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div {...fade(5)}>
          <Card className="h-full">
            <CardHeader title={t.communications} />
            <CardBody>
              {communications.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-text-muted">{t.noCommunications}</p>
              ) : (
                <ul className="space-y-3">
                  {communications.map((m) => {
                    const Dir = m.direction === "Inbound" ? ArrowUpRight : ArrowDownLeft;
                    return (
                      <li key={m.id} className="rounded-lg border border-line px-3.5 py-3">
                        <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-text-primary">
                          <Dir className="h-3.5 w-3.5 text-text-muted" strokeWidth={2} />
                          {m.subject}
                        </p>
                        {m.body && <p className="mt-1 whitespace-pre-wrap text-[13px] text-text-primary">{m.body}</p>}
                        <p className="mt-1 text-[12px] tabular-nums text-text-muted">
                          {t.directions[m.direction]} · {formatDate(m.occurredAtUtc, locale)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {shownInvoices.length > 0 && (
        <motion.div {...fade(6)}>
          <Card>
            <CardHeader title={t.invoices} />
            <ul className="divide-y divide-line">
              {shownInvoices.map((inv) => (
                <InvoiceRow key={inv.id} inv={inv} fetchPdf={() => portalApi.invoicePdf(inv.id)} t={t} locale={locale} />
              ))}
            </ul>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
