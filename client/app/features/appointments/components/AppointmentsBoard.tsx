"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  CalendarCheck2,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  Gavel,
  MapPin,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  DescriptionList,
  Drawer,
  EmptyState,

  ExportButton,  Pagination,
  SearchInput,
  Spinner,
  type BadgeTone,
} from "../../../components/ui";
import { formatDate, formatTime, formatWeekday } from "../../../lib/format";
import { HttpError } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { appointmentsApi } from "../api";
import type { AppointmentsDict } from "../i18n";
import type {
  AppointmentKind,
  AppointmentMutation,
  AppointmentStatus,
  CaseAppointment,
  CaseOption,
  LawyerOption,
  PagedResult,
} from "../types";
import { AppointmentFormDialog, CancelDialog, CompleteDialog } from "./Dialogs";

const statusTone: Record<AppointmentStatus, BadgeTone> = {
  Scheduled: "info",
  Completed: "success",
  Cancelled: "neutral",
};

const isConflict = (e: unknown) => e instanceof HttpError && e.status === 409;

function startOfWeek(date: Date) {
  // Week starts Saturday — the working week in Jordan.
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Appointments list + details drawer + all actions.
 *  - calendar mode: week navigation and filters across every visible case.
 *  - case mode (`caseId` set): every appointment on one case, sharing the
 *    case page's version so conflicts are caught.
 */
export function AppointmentsBoard({
  caseId,
  caseIsActive = true,
  version,
  onVersion,
  onConflict,
  cases,
  lawyers,
  canManage,
  showLawyerFilter = false,
  t,
  locale,
}: {
  caseId?: string;
  caseIsActive?: boolean;
  /** Case page's current version. Without it, versions are fetched per action. */
  version?: string;
  onVersion?: (v: string) => void;
  /** Case page refreshes itself on 409. */
  onConflict?: () => Promise<void>;
  cases: CaseOption[];
  lawyers: LawyerOption[];
  /** Whether the viewer may write to appointments of this case. */
  canManage: (caseId: string) => boolean;
  showLawyerFilter?: boolean;
  t: AppointmentsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const calendar = !caseId;
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<AppointmentKind | "">("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [lawyerId, setLawyerId] = useState("");
  const [data, setData] = useState<PagedResult<CaseAppointment> | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [selected, setSelected] = useState<CaseAppointment | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<object | null>(null);
  const [editing, setEditing] = useState<CaseAppointment | null>(null);
  const [cancelling, setCancelling] = useState<CaseAppointment | null>(null);
  const [completing, setCompleting] = useState<CaseAppointment | null>(null);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  const caseById = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);
  const lawyerName = useMemo(() => new Map(lawyers.map((l) => [l.id, l.fullName])), [lawyers]);

  const load = useCallback(() => {
    setFailed(false);
    return appointmentsApi
      .search({
        caseId,
        lawyerId: lawyerId || undefined,
        kind: kind || undefined,
        status: status || undefined,
        fromUtc: calendar ? weekStart.toISOString() : undefined,
        toUtc: calendar ? weekEnd.toISOString() : undefined,
        search: search.trim(),
        page,
        pageSize: calendar ? 100 : 25,
      })
      .then(setData)
      .catch(() => setFailed(true));
  }, [caseId, calendar, lawyerId, kind, status, weekStart, weekEnd, search, page]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const groups = useMemo(() => {
    const map = new Map<string, CaseAppointment[]>();
    for (const item of data?.items ?? []) {
      const key = dayKey(item.startsAtUtc);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.values()];
  }, [data]);

  /* ── version plumbing ── */

  const versionFor = async (forCase: string, fromDrawer?: string | null) =>
    version ?? fromDrawer ?? (await appointmentsApi.caseVersion(forCase));

  /** Wraps a write: stores the new version, refreshes, handles 409. */
  const write = async (forCase: string, fn: (v: string) => Promise<AppointmentMutation>) => {
    try {
      const res = await fn(await versionFor(forCase, selectedVersion));
      onVersion?.(res.version);
      setNotice(null);
      if (selected?.id === res.appointment.id) {
        setSelected(res.appointment);
        setSelectedVersion(res.version);
      }
      await load();
      return true;
    } catch (e) {
      if (!isConflict(e)) throw e;
      setNotice(t.conflict);
      if (onConflict) await onConflict();
      if (selected) {
        const fresh = await appointmentsApi.get(selected.caseId, selected.id).catch(() => null);
        if (fresh) {
          setSelected(fresh.appointment);
          setSelectedVersion(fresh.version);
        }
      }
      await load();
      return false;
    }
  };

  const openDetails = (item: CaseAppointment) => {
    setSelected(item);
    setSelectedVersion(null);
    appointmentsApi
      .get(item.caseId, item.id)
      .then((res) => {
        setSelected(res.appointment);
        setSelectedVersion(res.version);
      })
      .catch(() => undefined);
  };

  const fmtRange = (a: CaseAppointment) =>
    `${formatTime(a.startsAtUtc, locale)} – ${formatTime(a.endsAtUtc, locale)}`;

  const canWrite = (a: CaseAppointment) => canManage(a.caseId) && a.status === "Scheduled";
  const anyWritable = caseId
    ? canManage(caseId) && caseIsActive
    : cases.length === 0 || cases.some((c) => c.isActive && canManage(c.id));

  const selectClass =
    "rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:outline-none";

  return (
    <div className="space-y-4">
      <Alert tone="warning" show={!!notice}>
        {notice}
      </Alert>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          {calendar && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={t.prevWeek}
                onClick={() => {
                  setPage(1);
                  setWeekStart((d) => new Date(d.getTime() - 7 * 864e5));
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-text-muted hover:border-brand-charcoal"
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setWeekStart(startOfWeek(new Date()));
                }}
                className="h-9 rounded-lg border border-line px-3 text-[13px] font-medium text-text-primary hover:border-brand-charcoal"
              >
                {t.today}
              </button>
              <button
                type="button"
                aria-label={t.nextWeek}
                onClick={() => {
                  setPage(1);
                  setWeekStart((d) => new Date(d.getTime() + 7 * 864e5));
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-text-muted hover:border-brand-charcoal"
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
              </button>
              <span className="ms-2 text-[13.5px] font-medium tabular-nums text-text-primary">
                {interpolate(t.weekOf, {
                  from: formatDate(weekStart.toISOString(), locale),
                  to: formatDate(new Date(weekEnd.getTime() - 864e5).toISOString(), locale),
                })}
              </span>
            </div>
          )}

          <SearchInput
            value={search}
            placeholder={t.search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select value={kind} onChange={(e) => (setPage(1), setKind(e.target.value as AppointmentKind | ""))} className={selectClass}>
            <option value="">{t.allKinds}</option>
            <option value="Hearing">{t.kinds.Hearing}</option>
            <option value="Meeting">{t.kinds.Meeting}</option>
          </select>
          <select
            value={status}
            onChange={(e) => (setPage(1), setStatus(e.target.value as AppointmentStatus | ""))}
            className={selectClass}
          >
            <option value="">{t.allStatuses}</option>
            {(["Scheduled", "Completed", "Cancelled"] as const).map((s) => (
              <option key={s} value={s}>
                {t.statuses[s]}
              </option>
            ))}
          </select>
          {showLawyerFilter && lawyers.length > 0 && (
            <select value={lawyerId} onChange={(e) => (setPage(1), setLawyerId(e.target.value))} className={selectClass}>
              <option value="">{t.allLawyers}</option>
              {lawyers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName}
                </option>
              ))}
            </select>
          )}
          <div className={anyWritable ? "" : "ms-auto"}>
            <ExportButton
              path="appointments"
              filters={{
                caseId,
                lawyerId: lawyerId || undefined,
                kind: kind || undefined,
                status: status || undefined,
                fromUtc: calendar ? weekStart.toISOString() : undefined,
                toUtc: calendar ? weekEnd.toISOString() : undefined,
                search: search.trim(),
              }}
              fileName="appointments"
              locale={locale}
              compact
            />
          </div>
          {anyWritable && (
            <Button
              className="ms-auto h-9 px-3 text-[13px]"
              onClick={() => {
                setEditing(null);
                setFormOpen({});
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.schedule}
            </Button>
          )}
        </div>

        <div className="px-5 pt-4">
          <Alert tone="danger" show={failed}>
            {t.loadError}
          </Alert>
          {caseId && !caseIsActive && (
            <Alert tone="info">{t.errors.closedCase}</Alert>
          )}
        </div>

        {!data && !failed && <Spinner block />}

        {data && data.items.length === 0 && <EmptyState>{t.empty}</EmptyState>}

        {data && data.items.length > 0 && (
          <div className="space-y-5 px-5 py-4">
            {groups.map((items) => (
              <section key={dayKey(items[0].startsAtUtc)}>
                <h3 className="mb-2 flex items-baseline gap-2 text-[13px] font-semibold text-text-primary">
                  {formatWeekday(items[0].startsAtUtc, locale)}
                  <span className="font-normal tabular-nums text-text-muted">{formatDate(items[0].startsAtUtc, locale)}</span>
                </h3>
                <ul className="space-y-2">
                  {items.map((a, index) => {
                    const c = caseById.get(a.caseId);
                    return (
                      <motion.li
                        key={a.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15) }}
                      >
                        <button
                          type="button"
                          onClick={() => openDetails(a)}
                          className={`flex w-full items-start gap-3 rounded-lg border border-line px-4 py-3 text-start transition-colors hover:border-brand-charcoal ${
                            a.status === "Cancelled" ? "opacity-60" : ""
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              a.kind === "Hearing" ? "bg-brand-champagne-light" : "bg-info-surface"
                            }`}
                          >
                            {a.kind === "Hearing" ? (
                              <Gavel className="h-4 w-4 text-warning" strokeWidth={1.75} />
                            ) : (
                              <Users className="h-4 w-4 text-info" strokeWidth={1.75} />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`text-[13.5px] font-medium text-text-primary ${a.status === "Cancelled" ? "line-through" : ""}`}>
                                {a.title}
                              </p>
                              <Badge tone={statusTone[a.status]}>{t.statuses[a.status]}</Badge>
                              {!a.visibleToClient && <EyeOff className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-text-muted">
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Clock className="h-3 w-3" strokeWidth={1.75} />
                                {fmtRange(a)}
                              </span>
                              {a.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                                  {a.location}
                                </span>
                              )}
                              {calendar && c && (
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Briefcase className="h-3 w-3" strokeWidth={1.75} />
                                  {c.caseNumber}
                                </span>
                              )}
                              {a.assignedLawyerEmployeeId && lawyerName.get(a.assignedLawyerEmployeeId) && (
                                <span>{lawyerName.get(a.assignedLawyerEmployeeId)}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={setPage}
            label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })}
          />
        )}
      </Card>

      {/* details */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        subtitle={
          selected && (
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={selected.kind === "Hearing" ? "accent" : "info"}>{t.kinds[selected.kind]}</Badge>
              <Badge tone={statusTone[selected.status]}>{t.statuses[selected.status]}</Badge>
            </span>
          )
        }
        closeLabel={t.close}
        dir={locale === "ar" ? "rtl" : "ltr"}
        footer={
          selected &&
          canWrite(selected) && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap justify-end gap-2"
              >
                <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => setCancelling(selected)}>
                  <CalendarX2 className="h-4 w-4" strokeWidth={1.75} />
                  {t.cancel}
                </Button>
                <Button
                  variant="secondary"
                  className="h-10 px-3 text-[13px]"
                  disabled={!(caseById.get(selected.caseId)?.isActive ?? caseIsActive)}
                  onClick={() => {
                    setEditing(selected);
                    setFormOpen({});
                  }}
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  {t.edit}
                </Button>
                <Button className="h-10 px-3 text-[13px]" onClick={() => setCompleting(selected)}>
                  <CalendarCheck2 className="h-4 w-4" strokeWidth={1.75} />
                  {t.complete}
                </Button>
              </motion.div>
            </AnimatePresence>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <DescriptionList
              columns={1}
              items={[
                {
                  label: t.fields.startsAt,
                  value: (
                    <span className="tabular-nums">
                      {formatWeekday(selected.startsAtUtc, locale)} {formatDate(selected.startsAtUtc, locale)} · {fmtRange(selected)}
                    </span>
                  ),
                },
                { label: t.fields.location, value: selected.location },
                {
                  label: t.fields.lawyer,
                  value: selected.assignedLawyerEmployeeId ? lawyerName.get(selected.assignedLawyerEmployeeId) : null,
                },
                ...(calendar
                  ? [
                      {
                        label: t.fields.case,
                        value: (
                          <Link href={`/cases/${selected.caseId}`} className="text-info underline-offset-2 hover:underline">
                            {caseById.get(selected.caseId)?.caseNumber ?? t.openCase}
                          </Link>
                        ),
                      },
                    ]
                  : []),
                { label: t.fields.visibleToClient, value: selected.visibleToClient ? "✓" : "—" },
                ...(selected.outcome ? [{ label: t.fields.outcome, value: selected.outcome }] : []),
                ...(selected.cancellationReason ? [{ label: t.fields.cancellationReason, value: selected.cancellationReason }] : []),
                ...(selected.previousAppointmentId ? [{ label: t.fields.previous, value: "↩" }] : []),
              ]}
            />
            {selected.internalNotes && (
              <div className="rounded-lg border border-dashed border-line bg-background px-4 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t.fields.internalNotes}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] text-text-primary">{selected.internalNotes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <AppointmentFormDialog
        open={formOpen}
        editing={editing}
        fixedCaseId={caseId}
        cases={cases.filter((c) => canManage(c.id))}
        lawyers={lawyers}
        defaultLawyerId={caseId ? caseById.get(caseId)?.assignedLawyerEmployeeId : undefined}
        onClose={() => setFormOpen(null)}
        onSubmit={(forCase, details, reason) =>
          editing
            ? write(forCase, (v) => appointmentsApi.update(forCase, editing.id, details, reason, v))
            : write(forCase, (v) => appointmentsApi.schedule(forCase, details, v))
        }
        t={t}
      />
      <CancelDialog
        target={cancelling}
        onClose={() => setCancelling(null)}
        onSubmit={(reason) => write(cancelling!.caseId, (v) => appointmentsApi.cancel(cancelling!.caseId, cancelling!.id, reason, v))}
        t={t}
      />
      <CompleteDialog
        target={completing}
        caseIsActive={completing ? (caseById.get(completing.caseId)?.isActive ?? caseIsActive) : true}
        lawyers={lawyers}
        onClose={() => setCompleting(null)}
        onSubmit={(outcome, followUp) =>
          write(completing!.caseId, (v) => appointmentsApi.complete(completing!.caseId, completing!.id, outcome, followUp, v))
        }
        t={t}
      />
    </div>
  );
}
