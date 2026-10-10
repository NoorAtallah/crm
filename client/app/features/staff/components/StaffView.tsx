"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, UserPlus } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge, type BadgeTone } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, EmptyState } from "../../../components/ui/Card";
import { interpolate, type Locale } from "../../../lib/i18n";
import type { StaffDict } from "../i18n";
import {
  EMPLOYEE_TYPES,
  type Employee,
  type EmployeeType,
  type StaffAbilities,
  type StaffSummary,
} from "../types";
import { EmployeeDrawer } from "./EmployeeDrawer";
import { NewEmployeeDialog } from "./NewEmployeeDialog";

const typeTone: Record<EmployeeType, BadgeTone> = {
  SuperAdmin: "accent",
  OfficeManager: "info",
  Lawyer: "success",
  Secretary: "neutral",
  Client: "warning",
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function StaffView({
  initial,
  abilities,
  failed,
  t,
  locale,
}: {
  initial: StaffSummary;
  abilities: StaffAbilities;
  failed: boolean;
  t: StaffDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [employees, setEmployees] = useState(initial.employees);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EmployeeType | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  const open = employees.find((employee) => employee.id === openId) ?? null;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (typeFilter !== "all" && employee.type !== typeFilter) return false;
      if (!term) return true;
      return `${employee.fullName} ${employee.email}`.toLowerCase().includes(term);
    });
  }, [employees, search, typeFilter]);

  /** Replace one person in place after any server change. */
  const upsert = (updated: Employee) =>
    setEmployees((prev) => {
      const exists = prev.some((item) => item.id === updated.id);
      const next = exists
        ? prev.map((item) => (item.id === updated.id ? updated : item))
        : [...prev, updated];
      return next.sort((a, b) => a.fullName.localeCompare(b.fullName));
    });

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
          {abilities.canManage && (
            <Button
              type="button"
              onClick={() => {
                setCreatedName(null);
                setDialogOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} />
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
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as EmployeeType | "all")}
            aria-label={t.columns.type}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:border-text-muted focus:outline-none"
          >
            <option value="all">{t.allTypes}</option>
            {EMPLOYEE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.types[type]}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-start">
              <thead>
                <tr className="border-b border-line text-[12.5px] text-text-muted">
                  <th className="px-5 py-3 text-start font-medium">{t.columns.person}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.type}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.role}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.permissions}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.columns.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((employee, index) => (
                  <motion.tr
                    key={employee.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      ease: "easeOut",
                      delay: Math.min(index * 0.03, 0.18),
                    }}
                    onClick={() => setOpenId(employee.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpenId(employee.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer transition-colors hover:bg-background focus:bg-background focus:outline-none"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-[12.5px] font-semibold text-text-primary">
                          {initialsOf(employee.fullName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-text-primary">
                            {employee.fullName}
                          </p>
                          <p className="mt-0.5 truncate text-[12.5px] text-text-muted" dir="ltr">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={typeTone[employee.type]}>{t.types[employee.type]}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-text-primary">
                      {employee.roleName}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] tabular-nums text-text-muted">
                      {interpolate(t.permissionsCount, {
                        count: employee.effectivePermissions.length,
                      })}
                      {employee.directPermissions.length > 0 && (
                        <span className="ms-1.5 text-warning">
                          {interpolate(t.extraCount, {
                            count: employee.directPermissions.length,
                          })}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={employee.isActive ? "success" : "neutral"}>
                        {employee.isActive ? t.active : t.inactive}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewEmployeeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(employee) => {
          upsert(employee);
          setCreatedName(employee.fullName);
          setDialogOpen(false);
        }}
        roles={initial.roles}
        isSuperAdmin={abilities.isSuperAdmin}
        t={t}
      />

      <EmployeeDrawer
        employee={open}
        roles={initial.roles}
        catalog={initial.catalog}
        abilities={abilities}
        onClose={() => setOpenId(null)}
        onChanged={upsert}
        t={t}
        locale={locale}
      />
    </div>
  );
}
