"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Briefcase,
  FileText,
  Gavel,
  Search,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge, type BadgeTone } from "../../../components/ui/Badge";
import { Card, EmptyState } from "../../../components/ui/Card";
import { formatDate, formatTime, formatWeekday } from "../../../lib/format";
import { interpolate, type Locale } from "../../../lib/i18n";
import type { AuditDict } from "../i18n";
import type { AuditEntry } from "../types";

const resourceIcon: Record<string, LucideIcon> = {
  Role: ShieldCheck,
  Employee: UserCog,
  LegalCase: Briefcase,
  LegalDocument: FileText,
  LegalDecisionReport: Gavel,
};

/** Tone from the verb at the end: revoked reads red, granted/approved green. */
function toneOf(action: string): BadgeTone {
  if (action.endsWith("revoked")) return "danger";
  if (action.endsWith("granted") || action.endsWith("approved")) return "success";
  if (action.endsWith("created") || action.endsWith("uploaded")) return "info";
  return "neutral";
}

function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function AuditView({
  entries,
  canRead,
  failed,
  t,
  locale,
}: {
  entries: AuditEntry[];
  canRead: boolean;
  failed: boolean;
  t: AuditDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [resource, setResource] = useState("all");

  const resourceTypes = useMemo(
    () => [...new Set(entries.map((entry) => entry.resourceType))].sort(),
    [entries]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (resource !== "all" && entry.resourceType !== resource) return false;
      if (!term) return true;
      return `${entry.actorName} ${entry.details} ${entry.action}`.toLowerCase().includes(term);
    });
  }, [entries, search, resource]);

  /** Consecutive entries grouped by calendar day — the API is already newest first. */
  const days = useMemo(() => {
    const groups: { key: string; iso: string; items: AuditEntry[] }[] = [];
    visible.forEach((entry) => {
      const key = dayKey(entry.createdAtUtc);
      const last = groups[groups.length - 1];
      if (last?.key === key) last.items.push(entry);
      else groups.push({ key, iso: entry.createdAtUtc, items: [entry] });
    });
    return groups;
  }, [visible]);

  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 864e5).toISOString());
  const dayLabel = (key: string, iso: string) =>
    key === today
      ? t.today
      : key === yesterday
        ? t.yesterday
        : `${formatWeekday(iso, locale)} · ${formatDate(iso, locale)}`;

  let index = 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">{t.title}</h1>
          <p className="mt-1 text-[13.5px] text-text-muted">{t.subtitle}</p>
        </div>
        <p className="text-[13px] tabular-nums text-text-muted">
          {interpolate(t.countLabel, { count: visible.length })}
        </p>
      </header>

      <Alert tone="danger" show={failed}>
        {canRead ? t.loadError : t.noAccess}
      </Alert>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <label className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.search}
              className="w-full rounded-lg border border-line bg-surface py-2 pe-3 ps-9 text-[13.5px] text-text-primary placeholder:text-text-muted focus:border-text-muted focus:outline-none"
            />
          </label>
          <select
            value={resource}
            onChange={(event) => setResource(event.target.value)}
            aria-label={t.allResources}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:border-text-muted focus:outline-none"
          >
            <option value="all">{t.allResources}</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {t.resources[type] ?? type}
              </option>
            ))}
          </select>
        </div>

        {days.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          days.map((day) => (
            <section key={day.key}>
              <h2 className="sticky top-0 z-[1] border-b border-line bg-background px-5 py-2 text-[12px] font-medium text-text-muted">
                {dayLabel(day.key, day.iso)}
              </h2>
              <ul className="divide-y divide-line">
                {day.items.map((entry) => {
                  const Icon = resourceIcon[entry.resourceType] ?? Activity;
                  const delay = Math.min(index++ * 0.025, 0.2);
                  return (
                    <motion.li
                      key={entry.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut", delay }}
                      className="flex items-start gap-3 px-5 py-3.5"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                        <Icon className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={toneOf(entry.action)}>
                            {t.actions[entry.action] ?? entry.action}
                          </Badge>
                          <span className="text-[12.5px] text-text-muted">
                            {interpolate(t.by, { name: entry.actorName })}
                          </span>
                        </div>
                        <p className="mt-1 text-[13.5px] leading-relaxed text-text-primary" dir="auto">
                          {entry.details}
                        </p>
                      </div>
                      <time
                        dateTime={entry.createdAtUtc}
                        className="shrink-0 text-[12.5px] tabular-nums text-text-muted"
                      >
                        {formatTime(entry.createdAtUtc, locale)}
                      </time>
                    </motion.li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </Card>
    </div>
  );
}
