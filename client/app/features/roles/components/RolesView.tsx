"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Lock, Plus, ShieldCheck } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, EmptyState } from "../../../components/ui/Card";
import { problemMessage } from "../../../lib/http";
import { interpolate } from "../../../lib/i18n";
import { rolesApi } from "../api";
import type { RolesDict } from "../i18n";
import type { Role, RolesAbilities, RolesSummary } from "../types";
import { NewRoleDialog } from "./NewRoleDialog";

export function RolesView({
  initial,
  abilities,
  failed,
  t,
}: {
  initial: RolesSummary;
  abilities: RolesAbilities;
  failed: boolean;
  t: RolesDict;
}) {
  const reduceMotion = useReducedMotion();
  const [roles, setRoles] = useState(initial.roles);
  const [selectedId, setSelectedId] = useState<string | null>(initial.roles[0]?.id ?? null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { catalog } = initial;
  const total = catalog.reduce((sum, group) => sum + group.permissions.length, 0);
  const selected = roles.find((role) => role.id === selectedId) ?? null;

  const replace = (updated: Role) =>
    setRoles((prev) => {
      const exists = prev.some((role) => role.id === updated.id);
      const next = exists
        ? prev.map((role) => (role.id === updated.id ? updated : role))
        : [...prev, updated];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });

  async function toggle(permission: string, granted: boolean) {
    if (!selected || pendingKey) return;
    setPendingKey(permission);
    setError(null);
    setNotice(null);
    try {
      replace(await rolesApi.setPermission(selected.id, { permission, granted }));
    } catch (caught) {
      setError(problemMessage(caught, t.actionError));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">{t.title}</h1>
          <p className="mt-1 text-[13.5px] text-text-muted">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-[13px] tabular-nums text-text-muted">
            {interpolate(t.rolesCount, { count: roles.length })}
          </p>
          {abilities.canCreate && (
            <Button
              type="button"
              onClick={() => {
                setNotice(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.newRole}
            </Button>
          )}
        </div>
      </header>

      <Alert tone="danger" show={failed}>
        {abilities.canRead ? t.loadError : t.noAccess}
      </Alert>
      <Alert tone="danger" show={!!error}>
        {error}
      </Alert>
      <Alert tone="success" show={!!notice}>
        {notice}
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Role list */}
        <Card className="self-start">
          {roles.length === 0 ? (
            <EmptyState>{t.noRoles}</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {roles.map((role) => {
                const active = role.id === selectedId;
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(role.id);
                        setError(null);
                      }}
                      aria-current={active}
                      className="relative flex w-full items-center gap-3 px-5 py-3.5 text-start transition-colors hover:bg-background"
                    >
                      {active && (
                        <motion.span
                          layoutId="roles-active"
                          className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-brand-charcoal"
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        />
                      )}
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          active ? "bg-brand-charcoal text-white" : "bg-background text-text-muted"
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-text-primary">
                          {role.name}
                        </span>
                        <span className="mt-0.5 block text-[12px] tabular-nums text-text-muted">
                          {interpolate(t.permissionsCount, { count: role.permissions.length })}
                        </span>
                      </span>
                      <Badge tone={role.isSystemRole ? "info" : "neutral"}>
                        {role.isSystemRole ? t.system : t.custom}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Selected role's permissions */}
        <Card>
          <AnimatePresence mode="wait" initial={false}>
            {!selected ? (
              <EmptyState key="none">{t.selectRole}</EmptyState>
            ) : (
              <motion.div
                key={selected.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <header className="border-b border-line px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[16px] font-semibold text-text-primary">{selected.name}</h2>
                    <Badge tone={selected.isSystemRole ? "info" : "neutral"}>
                      {selected.isSystemRole ? t.system : t.custom}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] text-text-muted">
                    {t.key}:{" "}
                    <span className="font-medium text-text-primary" dir="ltr">
                      {selected.key}
                    </span>{" "}
                    · {interpolate(t.grantedOf, { granted: selected.permissions.length, total })}
                  </p>
                  {!abilities.canGrant && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-text-muted">
                      <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                      {t.superAdminOnly}
                    </p>
                  )}
                </header>

                <div className="space-y-5 px-5 py-5">
                  {catalog.map((group) => (
                    <div key={group.category}>
                      <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-text-muted">
                        {group.category}
                      </p>
                      <ul className="divide-y divide-line rounded-lg border border-line">
                        {group.permissions.map((permission) => {
                          const granted = selected.permissions.includes(permission.key);
                          const pending = pendingKey === permission.key;
                          const locked = !abilities.canGrant || !!pendingKey;

                          return (
                            <li key={permission.key}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={granted}
                                disabled={locked}
                                onClick={() => toggle(permission.key, !granted)}
                                className="flex w-full items-start gap-3 px-3.5 py-3 text-start transition-colors enabled:hover:bg-background disabled:cursor-default"
                              >
                                <span
                                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
                                    granted
                                      ? "border-brand-charcoal bg-brand-charcoal text-white"
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
                                    granted && <Check className="h-3 w-3" strokeWidth={3} />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[13.5px] font-medium text-text-primary">
                                      {permission.displayName}
                                    </span>
                                    {permission.systemOnly && (
                                      <span title={t.systemOnlyHint}>
                                        <Badge tone="warning">{t.systemOnly}</Badge>
                                      </span>
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
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <NewRoleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(role) => {
          replace(role);
          setSelectedId(role.id);
          setNotice(interpolate(t.created, { name: role.name }));
          setDialogOpen(false);
        }}
        t={t}
      />
    </div>
  );
}
