"use client";

import { useState } from "react";
import { CalendarDays, Download, FileText, Gavel, MapPin, Users } from "lucide-react";
import { Badge, IconButton, type BadgeTone } from "../../../components/ui";
import { formatDate, formatMoney, formatTime, formatWeekday } from "../../../lib/format";
import { problemMessage } from "../../../lib/http";
import type { Locale } from "../../../lib/i18n";
import { saveBlob } from "../../documents/saveBlob";
import type { PortalDict } from "../i18n";
import type { PortalAppointment, PortalInvoice } from "../types";

/** Download button that fetches with the session token. */
export function DownloadButton({ fetcher, name, label, onError }: { fetcher: () => Promise<Blob>; name: string; label: string; onError?: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <IconButton
      icon={Download}
      label={label}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          saveBlob(await fetcher(), name);
        } catch (e) {
          onError?.(problemMessage(e, label));
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

const apptTone: Record<PortalAppointment["status"], BadgeTone> = { Scheduled: "info", Completed: "success", Cancelled: "neutral" };

export function AppointmentRow({ a, caseLabel, t, locale }: { a: PortalAppointment; caseLabel?: string; t: PortalDict; locale: Locale }) {
  const Icon = a.kind === "Hearing" ? Gavel : Users;
  return (
    <li className={`flex items-start gap-3 rounded-lg border border-line px-4 py-3 ${a.status === "Cancelled" ? "opacity-60" : ""}`}>
      <span className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-background py-1.5">
        <span className="text-[11px] text-text-muted">{formatWeekday(a.startsAtUtc, locale).slice(0, 3)}</span>
        <span className="text-[17px] font-semibold tabular-nums text-text-primary">{new Date(a.startsAtUtc).getDate()}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />
          <p className="text-[13.5px] font-medium text-text-primary">{a.title}</p>
          <Badge tone={apptTone[a.status]}>{t.statuses[a.status]}</Badge>
        </div>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-text-muted">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <CalendarDays className="h-3 w-3" strokeWidth={1.75} />
            {formatDate(a.startsAtUtc, locale)} · {formatTime(a.startsAtUtc, locale)}
          </span>
          {a.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" strokeWidth={1.75} />
              {a.location}
            </span>
          )}
          {caseLabel && <span className="tabular-nums">{caseLabel}</span>}
        </p>
        {a.outcome && <p className="mt-1.5 text-[12.5px] text-text-primary">{t.outcome}: {a.outcome}</p>}
        {a.cancellationReason && <p className="mt-1.5 text-[12.5px] text-text-muted">{t.cancelled}: {a.cancellationReason}</p>}
      </div>
    </li>
  );
}

export function InvoiceRow({ inv, fetchPdf, t, locale }: { inv: PortalInvoice; fetchPdf: () => Promise<Blob>; t: PortalDict; locale: Locale }) {
  const tone: BadgeTone = inv.status === "Void" ? "neutral" : inv.balance <= 0 ? "success" : inv.isOverdue ? "danger" : "info";
  const label = inv.status === "Void" ? t.void : inv.balance <= 0 ? t.paid : inv.isOverdue ? t.overdue : `${t.dueOn} ${formatDate(inv.dueOn, locale)}`;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <FileText className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium tabular-nums text-text-primary" dir="ltr">
          {inv.number}
        </p>
        <p className="text-[12px] tabular-nums text-text-muted">
          {t.total} {formatMoney(inv.total, inv.currency, locale)} · {t.balance} {formatMoney(inv.balance, inv.currency, locale)}
        </p>
      </div>
      <Badge tone={tone}>{label}</Badge>
      <DownloadButton fetcher={fetchPdf} name={`${inv.number}.pdf`} label={t.pdf} />
    </li>
  );
}
