"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { problemMessage } from "../../../lib/http";
import { directionOf, type Locale } from "../../../lib/i18n";
import { staffApi } from "../api";
import type { StaffDict } from "../i18n";
import {
  EMPLOYEE_TYPES,
  type Employee,
  type EmployeeType,
  type PermissionGroup,
  type Role,
  type StaffAbilities,
} from "../types";
import { SelectField } from "./SelectField";

export function EmployeeDrawer({
  employee,
  roles,
  catalog,
  abilities,
  onClose,
  onChanged,
  t,
  locale,
}: {
  employee: Employee | null;
  roles: Role[];
  catalog: PermissionGroup[];
  abilities: StaffAbilities;
  onClose: () => void;
  onChanged: (employee: Employee) => void;
  t: StaffDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const offset = directionOf[locale] === "rtl" ? -32 : 32;

  const [roleId, setRoleId] = useState("");
  const [type, setType] = useState<EmployeeType>("Lawyer");
  const [savingRole, setSavingRole] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Reset the form whenever a different person is opened.
  useEffect(() => {
    if (!employee) return;
    setRoleId(employee.roleId);
    setType(employee.type);
    setError(null);
    setNotice(null);
  }, [employee?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!employee) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [employee, onClose]);

  const rolePermissions = useMemo(
    () => new Set(roles.find((role) => role.id === employee?.roleId)?.permissions ?? []),
    [roles, employee?.roleId]
  );

  const nameOf = useMemo(() => {
    const map = new Map<string, string>();
    catalog.forEach((group) =>
      group.permissions.forEach((permission) => map.set(permission.key, permission.displayName))
    );
    return (key: string) => map.get(key) ?? key;
  }, [catalog]);

  const roleDirty = !!employee && (roleId !== employee.roleId || type !== employee.type);

  async function saveRole() {
    if (!employee || !roleDirty) return;
    setSavingRole(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await staffApi.assignRole(employee.id, { roleId, type });
      onChanged(updated);
      setNotice(t.roleSaved);
    } catch (caught) {
      setError(problemMessage(caught, t.actionError));
    } finally {
      setSavingRole(false);
    }
  }

  async function togglePermission(key: string, granted: boolean) {
    if (!employee || pendingKey) return;
    setPendingKey(key);
    setError(null);
    setNotice(null);
    try {
      const updated = await staffApi.setPermission(employee.id, { permission: key, granted });
      onChanged(updated);
    } catch (caught) {
      setError(problemMessage(caught, t.actionError));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <AnimatePresence>
      {employee && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/40"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-drawer-title"
            initial={reduceMotion ? false : { opacity: 0, x: offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: offset }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="relative flex h-full w-full max-w-lg flex-col border-s border-line bg-surface shadow-card"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <p className="text-[12px] text-text-muted">{t.details}</p>
                <h2
                  id="employee-drawer-title"
                  className="mt-0.5 truncate text-[17px] font-semibold text-text-primary"
                >
                  {employee.fullName}
                </h2>
                <p className="mt-0.5 truncate text-[13px] text-text-muted" dir="ltr">
                  {employee.email}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge tone="info">{t.types[employee.type]}</Badge>
                  <Badge>{employee.roleName}</Badge>
                  <Badge tone={employee.isActive ? "success" : "neutral"}>
                    {employee.isActive ? t.active : t.inactive}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.close}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <Alert tone="danger" show={!!error}>
                {error}
              </Alert>
              <Alert tone="success" show={!!notice}>
                {notice}
              </Alert>

              {/* Role & type — PUT /employees/{id}/role, Super Admin only */}
              <section>
                <h3 className="text-[14px] font-semibold text-text-primary">{t.roleAndType}</h3>
                <p className="mt-1 text-[12.5px] text-text-muted">
                  {abilities.isSuperAdmin ? t.roleAndTypeHint : t.superAdminOnlyRole}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SelectField
                    id="drawer-role"
                    label={t.role}
                    value={roleId}
                    onChange={(event) => setRoleId(event.target.value)}
                    options={
                      roles.length > 0
                        ? roles.map((role) => ({ value: role.id, label: role.name }))
                        : [{ value: employee.roleId, label: employee.roleName }]
                    }
                    disabled={!abilities.isSuperAdmin || savingRole}
                  />
                  <SelectField
                    id="drawer-type"
                    label={t.type}
                    value={type}
                    onChange={(event) => setType(event.target.value as EmployeeType)}
                    options={EMPLOYEE_TYPES.map((value) => ({ value, label: t.types[value] }))}
                    disabled={!abilities.isSuperAdmin || savingRole}
                  />
                </div>
                {abilities.isSuperAdmin && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      onClick={saveRole}
                      disabled={!roleDirty}
                      loading={savingRole}
                      loadingLabel={t.savingRole}
                    >
                      {t.saveRole}
                    </Button>
                  </div>
                )}
              </section>

              {/* Direct permissions — POST /employees/{id}/permissions */}
              <section>
                <h3 className="text-[14px] font-semibold text-text-primary">
                  {t.directPermissions}
                </h3>
                <p className="mt-1 text-[12.5px] text-text-muted">
                  {abilities.canGrant ? t.directPermissionsHint : t.cantGrant}
                </p>

                {catalog.length === 0 ? (
                  <p className="mt-3 text-[13px] text-text-muted">{t.noCatalog}</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {catalog.map((group) => (
                      <div key={group.category}>
                        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-text-muted">
                          {group.category}
                        </p>
                        <ul className="divide-y divide-line rounded-lg border border-line">
                          {group.permissions.map((permission) => {
                            const fromRole = rolePermissions.has(permission.key);
                            const direct = employee.directPermissions.includes(permission.key);
                            const checked = fromRole || direct;
                            const pending = pendingKey === permission.key;
                            const locked = fromRole || !abilities.canGrant || !!pendingKey;

                            return (
                              <li key={permission.key}>
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={checked}
                                  disabled={locked}
                                  onClick={() => togglePermission(permission.key, !direct)}
                                  className="flex w-full items-start gap-3 px-3.5 py-3 text-start transition-colors enabled:hover:bg-background disabled:cursor-default"
                                >
                                  <span
                                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
                                      checked
                                        ? fromRole
                                          ? "border-line bg-background text-text-muted"
                                          : "border-brand-charcoal bg-brand-charcoal text-white"
                                        : "border-line bg-surface"
                                    }`}
                                  >
                                    {pending ? (
                                      <motion.span
                                        animate={reduceMotion ? undefined : { rotate: 360 }}
                                        transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
                                        className="flex"
                                      >
                                        <Loader2 className="h-3 w-3" strokeWidth={2.5} />
                                      </motion.span>
                                    ) : (
                                      checked && <Check className="h-3 w-3" strokeWidth={3} />
                                    )}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[13.5px] font-medium text-text-primary">
                                        {permission.displayName}
                                      </span>
                                      {fromRole && (
                                        <span className="inline-flex items-center gap-1 text-[11.5px] text-text-muted">
                                          <Lock className="h-3 w-3" strokeWidth={2} />
                                          {t.fromRole}
                                        </span>
                                      )}
                                      {permission.systemOnly && (
                                        <Badge tone="warning">{t.systemOnly}</Badge>
                                      )}
                                    </span>
                                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-text-muted">
                                      {permission.description}
                                    </span>
                                    <span className="mt-0.5 block text-[11.5px] text-text-muted/80" dir="ltr">
                                      {permission.key}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Effective permissions — straight from the API */}
              <section>
                <h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-text-primary">
                  <ShieldCheck className="h-4 w-4 text-success" strokeWidth={1.75} />
                  {t.effective}
                </h3>
                <p className="mt-1 text-[12.5px] text-text-muted">{t.effectiveHint}</p>
                {employee.effectivePermissions.length === 0 ? (
                  <p className="mt-3 text-[13px] text-text-muted">{t.none}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[...employee.effectivePermissions].sort().map((key) => (
                      <Badge
                        key={key}
                        tone={employee.directPermissions.includes(key) ? "accent" : "neutral"}
                      >
                        {nameOf(key)}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
