"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, Plus, Search } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, EmptyState } from "../../../components/ui/Card";
import { formatDate } from "../../../lib/format";
import { interpolate, type Locale } from "../../../lib/i18n";
import type { CasesDict } from "../i18n";
import type { CaseRow, PersonOption } from "../types";
import { NewCaseDialog } from "./NewCaseDialog";

type StatusFilter = "all" | "active" | "closed";

export function CasesView({
  cases: initialCases,
  people,
  canCreate,
  failed,
  t,
  locale,
}: {
  cases: CaseRow[];
  people: PersonOption[];
  /** `cases.manage.all` — managers only. */
  canCreate: boolean;
  failed: boolean;
  t: CasesDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [cases, setCases] = useState(initialCases);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cases.filter((item) => {
      if (status === "active" && !item.isActive) return false;
      if (status === "closed" && item.isActive) return false;
      if (!term) return true;
      return [item.caseNumber, item.title, item.clientName, item.lawyerName]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [cases, search, status]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t.all },
    { key: "active", label: t.active },
    { key: "closed", label: t.closed },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">{t.title}</h1>
          <p className="mt-1 text-[13.5px] text-text-muted">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-[13px] tabular-nums text-text-muted">
            {interpolate(t.countLabel, { count: visible.length })}
          </p>
          {canCreate && (
            <Button
              type="button"
              onClick={() => {
                setCreatedNumber(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.newCase}
            </Button>
          )}
        </div>
      </header>

      <Alert tone="success" show={!!createdNumber}>
        {interpolate(t.created, { number: createdNumber ?? "" })}
      </Alert>

      <Alert tone="danger" show={failed}>
        {t.loadError}
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

          <div className="flex rounded-lg border border-line p-0.5">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatus(filter.key)}
                className={`relative rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  status === filter.key
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {status === filter.key && (
                  <motion.span
                    layoutId="cases-status-filter"
                    className="absolute inset-0 rounded-md bg-background"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
                <span className="relative">{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-start">
              <thead>
                <tr className="border-b border-line text-[12.5px] text-text-muted">
                  <th className="px-5 py-3 text-start font-medium">{t.columns.number}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.title}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.lawyer}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.client}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.status}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.createdAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      ease: "easeOut",
                      delay: Math.min(index * 0.03, 0.18),
                    }}
                    className="transition-colors hover:bg-background"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                          <Briefcase className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                        </span>
                        <span className="text-[13.5px] font-medium tabular-nums text-text-primary">
                          {item.caseNumber}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[260px] truncate px-5 py-3.5 text-[13px] text-text-primary">
                      {item.title}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-text-primary">{item.lawyerName}</td>
                    <td className="px-5 py-3.5 text-[13px] text-text-primary">{item.clientName}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={item.isActive ? "success" : "neutral"}>
                        {item.isActive ? t.active : t.closed}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] tabular-nums text-text-muted">
                      {formatDate(item.createdAtUtc, locale)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewCaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(row) => {
          setCases((prev) => [...prev, row].sort((a, b) => a.caseNumber.localeCompare(b.caseNumber)));
          setCreatedNumber(row.caseNumber);
          setDialogOpen(false);
        }}
        people={people}
        t={t}
      />
    </div>
  );
}
