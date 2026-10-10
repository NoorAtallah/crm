"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Briefcase, Loader2, Mail, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { formatDate } from "../../../lib/format";
import { HttpError } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { clientsApi } from "../api";
import type { ClientsDict } from "../i18n";
import type { Client, ClientCase } from "../types";

type State =
  | { kind: "loading" }
  | { kind: "ready"; cases: ClientCase[] }
  | { kind: "error"; forbidden: boolean };

export function ClientCasesDrawer({
  client,
  onClose,
  t,
  locale,
}: {
  client: Client | null;
  onClose: () => void;
  t: ClientsDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  // Result tagged with the client it belongs to — a mismatch means "loading".
  const [result, setResult] = useState<{ id: string; state: State } | null>(null);
  const state: State = result && result.id === client?.id ? result.state : { kind: "loading" };
  // The drawer sits on the inline-end side, so it slides in from there.
  const offset = locale === "ar" ? "-100%" : "100%";

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    const id = client.id;
    clientsApi
      .cases(id)
      .then((cases) => !cancelled && setResult({ id, state: { kind: "ready", cases } }))
      .catch(
        (error) =>
          !cancelled &&
          setResult({
            id,
            state: { kind: "error", forbidden: error instanceof HttpError && error.status === 403 },
          })
      );
    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [client, onClose]);

  return (
    <AnimatePresence>
      {client && (
        <div className="fixed inset-0 z-50">
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
            aria-labelledby="client-drawer-title"
            initial={reduceMotion ? { opacity: 0 } : { x: offset }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: offset }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col border-s border-line bg-surface shadow-card"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 id="client-drawer-title" className="truncate text-[15px] font-semibold text-text-primary">
                  {client.fullName}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-muted" dir="ltr">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {client.email}
                </p>
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

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13.5px] font-semibold text-text-primary">{t.cases}</h3>
                {state.kind === "ready" && (
                  <span className="text-[12.5px] tabular-nums text-text-muted">
                    {interpolate(t.casesCount, { count: state.cases.length })}
                  </span>
                )}
              </div>

              {state.kind === "loading" && (
                <div className="flex justify-center py-10 text-text-muted">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
                    className="inline-flex"
                  >
                    <Loader2 className="h-5 w-5" strokeWidth={1.75} />
                  </motion.span>
                </div>
              )}

              <Alert tone="danger" show={state.kind === "error"}>
                {state.kind === "error" && state.forbidden ? t.casesNoAccess : t.casesError}
              </Alert>

              {state.kind === "ready" &&
                (state.cases.length === 0 ? (
                  <p className="py-8 text-center text-[13px] text-text-muted">{t.noCases}</p>
                ) : (
                  <ul className="space-y-2">
                    {state.cases.map((item, index) => (
                      <motion.li
                        key={item.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2) }}
                        className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                          <Briefcase className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium text-text-primary">{item.title}</p>
                          <p className="mt-0.5 text-[12px] tabular-nums text-text-muted">
                            {item.caseNumber} ·{" "}
                            {interpolate(t.openedOn, { date: formatDate(item.createdAtUtc, locale) })}
                          </p>
                        </div>
                        <Badge tone={item.isActive ? "success" : "neutral"}>
                          {item.isActive ? t.caseActive : t.caseClosed}
                        </Badge>
                      </motion.li>
                    ))}
                  </ul>
                ))}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
