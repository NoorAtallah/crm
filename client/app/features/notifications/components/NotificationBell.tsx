"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, CalendarDays, CheckCheck, ListChecks } from "lucide-react";
import { Spinner } from "../../../components/ui";
import { formatDate, formatTime } from "../../../lib/format";
import type { Locale } from "../../../lib/i18n";
import { notificationsApi } from "../api";
import { notificationsDictionaries } from "../i18n";
import type { AppNotification } from "../types";

const POLL_MS = 60_000;

/** Top-bar bell: unread count, dropdown inbox, click to open the related screen. */
export function NotificationBell({ locale }: { locale: Locale }) {
  const t = notificationsDictionaries[locale];
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [failed, setFailed] = useState(false);

  const refreshCount = useCallback(() => {
    notificationsApi
      .list({ unreadOnly: true, pageSize: 1 })
      .then((r) => setUnread(r.totalCount))
      .catch(() => undefined);
  }, []);

  const loadList = useCallback(() => {
    setFailed(false);
    notificationsApi
      .list({ unreadOnly, pageSize: 20 })
      .then((r) => setItems(r.items))
      .catch(() => setFailed(true));
  }, [unreadOnly]);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(id);
  }, [refreshCount]);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = async (n: AppNotification) => {
    if (n.readAtUtc) return;
    await notificationsApi.markRead(n.id).catch(() => undefined);
    setItems((all) => all?.map((x) => (x.id === n.id ? { ...x, readAtUtc: new Date().toISOString() } : x)) ?? null);
    setUnread((c) => Math.max(0, c - 1));
  };

  const go = async (n: AppNotification) => {
    await markRead(n);
    setOpen(false);
    router.push((n.kind ?? "").startsWith("appointment") ? "/calendar" : "/tasks");
  };

  const markAll = async () => {
    const pending = (items ?? []).filter((n) => !n.readAtUtc);
    await Promise.all(pending.map((n) => notificationsApi.markRead(n.id).catch(() => undefined)));
    refreshCount();
    loadList();
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={t.title}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={reduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold tabular-nums text-white"
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute end-0 top-11 z-50 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-line bg-surface shadow-card"
          >
            <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 className="text-[14px] font-semibold text-text-primary">{t.title}</h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[12px] text-text-muted">
                  <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="h-3.5 w-3.5 accent-brand-charcoal" />
                  {t.unreadOnly}
                </label>
                <button type="button" onClick={markAll} title={t.markAll} aria-label={t.markAll} className="text-text-muted hover:text-text-primary">
                  <CheckCheck className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </header>
            <div className="max-h-[420px] overflow-y-auto">
              {failed && <p className="px-4 py-6 text-center text-[13px] text-danger">{t.loadError}</p>}
              {!failed && items === null && <Spinner block />}
              {items && items.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-text-muted">{t.empty}</p>}
              {items && items.length > 0 && (
                <ul className="divide-y divide-line">
                  {items.map((n) => {
                    const Icon = (n.kind ?? "").startsWith("appointment") ? CalendarDays : ListChecks;
                    return (
                      <li key={n.id}>
                        <button type="button" onClick={() => go(n)} className="flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-background">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                            <Icon className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[13px] ${n.readAtUtc ? "text-text-muted" : "font-medium text-text-primary"}`}>
                              {(n.kind && t.kinds[n.kind]) || t.other}
                            </p>
                            <p className="mt-0.5 text-[11.5px] tabular-nums text-text-muted">
                              {formatDate(n.availableAtUtc, locale)} {formatTime(n.availableAtUtc, locale)}
                            </p>
                          </div>
                          {!n.readAtUtc && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-champagne" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
