"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, LogOut, Scale, UserRound } from "lucide-react";
import { LangToggle } from "../../../components/ui/LangToggle";
import type { Locale } from "../../../lib/i18n";
import { SESSION_COOKIE } from "../../../lib/session-cookie";
import { NotificationBell } from "../../notifications";
import type { PortalDict } from "../i18n";

/** Lighter chrome for clients: top bar only, no staff navigation. */
export function PortalShell({ name, t, locale, children }: { name: string; t: PortalDict; locale: Locale; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = [
    { href: "/portal", label: t.nav.home, icon: Home },
    { href: "/portal/profile", label: t.nav.profile, icon: UserRound },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/portal" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-charcoal">
              <Scale className="h-4 w-4 text-brand-champagne" strokeWidth={1.75} />
            </span>
            <span className="hidden text-[15px] font-semibold text-text-primary sm:block">{t.brand}</span>
          </Link>
          <nav className="ms-2 flex gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === "/portal" ? pathname === "/portal" || pathname.startsWith("/portal/cases") : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${active ? "text-text-primary" : "text-text-muted hover:text-text-primary"}`}>
                  {active && <motion.span layoutId="portal-nav" className="absolute inset-0 rounded-lg bg-background" transition={{ duration: 0.2 }} />}
                  <Icon className="relative h-4 w-4" strokeWidth={1.75} />
                  <span className="relative hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <span className="hidden text-[13px] text-text-muted md:inline">{name}</span>
            <LangToggle locale={locale} />
            <NotificationBell locale={locale} />
            <button
              type="button"
              aria-label={t.signOut}
              title={t.signOut}
              onClick={() => {
                document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
                router.push("/login");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background hover:text-danger"
            >
              <LogOut className="h-[18px] w-[18px] rtl:rotate-180" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
