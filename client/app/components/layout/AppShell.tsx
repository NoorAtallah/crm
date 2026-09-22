"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Menu, Search, X } from "lucide-react";
import type { AuthUser } from "../../features/auth";
import { LangToggle } from "../../components/ui/LangToggle";
import type { Locale } from "../../lib/i18n";
import { Sidebar } from "./Sidebar";
import type { ShellDict } from "./navigation";

export function AppShell({
  t,
  user,
  locale,
  children,
}: {
  t: ShellDict;
  user: AuthUser;
  locale: Locale;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const offscreen = locale === "ar" ? "100%" : "-100%";

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Persistent sidebar, desktop only */}
      <div className="hidden w-[248px] shrink-0 lg:block">
        <div className="fixed inset-y-0 w-[248px]">
          <Sidebar t={t} user={user} />
        </div>
      </div>

      {/* Drawer, mobile only */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-brand-charcoal/40 lg:hidden"
            />
            <motion.div
              initial={reduceMotion ? false : { x: offscreen }}
              animate={{ x: 0 }}
              exit={{ x: offscreen }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 start-0 z-50 w-[248px] lg:hidden"
            >
              <Sidebar
                t={t}
                user={user}
                onNavigate={() => setDrawerOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-label={drawerOpen ? t.closeMenu : t.openMenu}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background lg:hidden"
          >
            {drawerOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>

          <label className="relative hidden min-w-0 flex-1 items-center sm:flex sm:max-w-sm">
            <Search
              className="pointer-events-none absolute start-3 h-4 w-4 text-text-muted"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder={t.search}
              className="h-9 w-full rounded-lg border border-line bg-background ps-9 pe-3 text-[14px] outline-none transition-colors placeholder:text-text-muted focus:border-brand-charcoal focus:bg-surface"
            />
          </label>

          <div className="ms-auto flex items-center gap-2">
            <LangToggle locale={locale} />
            <button
              type="button"
              aria-label={t.notifications}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-champagne" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}