"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, EmptyState } from "../../../components/ui/Card";
import { interpolate, type Locale } from "../../../lib/i18n";
import type { ClientsDict } from "../i18n";
import type { Client, ClientsAbilities } from "../types";
import { ClientCasesDrawer } from "./ClientCasesDrawer";
import { NewClientDialog } from "./NewClientDialog";

type StatusFilter = "all" | "active" | "inactive";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ClientsView({
  clients: initialClients,
  abilities,
  failed,
  t,
  locale,
}: {
  clients: Client[];
  abilities: ClientsAbilities;
  failed: boolean;
  t: ClientsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);

  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((client) => {
      if (status === "active" && !client.isActive) return false;
      if (status === "inactive" && client.isActive) return false;
      if (!term) return true;
      return `${client.fullName} ${client.email}`.toLowerCase().includes(term);
    });
  }, [clients, search, status]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t.all },
    { key: "active", label: t.active },
    { key: "inactive", label: t.inactive },
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
          {abilities.canCreate && (
            <Button
              type="button"
              onClick={() => {
                setCreatedName(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.add}
            </Button>
          )}
        </div>
      </header>

      <Alert tone="success" show={!!createdName}>
        {interpolate(t.created, { name: createdName ?? "" })}
      </Alert>
      <Alert tone="danger" show={failed}>
        {abilities.canRead ? t.loadError : t.noAccess}
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
                  status === filter.key ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {status === filter.key && (
                  <motion.span
                    layoutId="clients-status-filter"
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
            <table className="w-full min-w-[620px] border-collapse text-start">
              <thead>
                <tr className="border-b border-line text-[12.5px] text-text-muted">
                  <th className="px-5 py-3 text-start font-medium">{t.columns.client}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.email}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.status}</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut", delay: Math.min(index * 0.03, 0.18) }}
                    onClick={() => setSelected(client)}
                    className="cursor-pointer transition-colors hover:bg-background"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-champagne-light text-[12.5px] font-semibold text-text-primary">
                          {initials(client.fullName)}
                        </span>
                        <span className="text-[13.5px] font-medium text-text-primary">{client.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-text-muted" dir="ltr">
                      <span className="block text-start">{client.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={client.isActive ? "success" : "neutral"}>
                        {client.isActive ? t.active : t.inactive}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-text-muted">
                      <Chevron className="h-4 w-4" strokeWidth={1.75} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewClientDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(client) => {
          setClients((prev) => [...prev, client].sort((a, b) => a.fullName.localeCompare(b.fullName)));
          setCreatedName(client.fullName);
          setDialogOpen(false);
        }}
        t={t}
      />

      <ClientCasesDrawer client={selected} onClose={() => setSelected(null)} t={t} locale={locale} />
    </div>
  );
}
