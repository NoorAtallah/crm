"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { LogOut, Scale } from "lucide-react";
import { SESSION_COOKIE } from "../../lib/session-cookie";
import type { AuthUser } from "../../features/auth";
import { NAV_ITEMS, type NavKey, type ShellDict } from "./navigation";

export function Sidebar({
  t,
  user,
  onNavigate,
}: {
  t: ShellDict;
  user: AuthUser;
  /** Called after a link is tapped, so the mobile drawer can close itself. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="flex h-full flex-col bg-brand-charcoal text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-champagne">
          <Scale className="h-4 w-4 text-brand-charcoal" strokeWidth={2} />
        </span>
        <span className="text-[14px] font-medium tracking-tight">
          {t.nav.dashboard === "Dashboard" ? "Legal CRM" : "نظام إدارة المكتب"}
        </span>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.key} className="relative">
              {active && (
                <motion.span
                  layoutId="nav-active"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 500, damping: 40 }
                  }
                  className="absolute inset-y-0 start-0 w-[3px] rounded-full bg-brand-champagne"
                />
              )}
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                  active
                    ? "bg-white/[0.06] font-medium text-white"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white",
                ].join(" ")}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    active ? "text-brand-champagne" : ""
                  }`}
                  strokeWidth={1.75}
                />
                {t.nav[item.key as NavKey]}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-1 border-t border-white/10 px-3 py-3">
        <Link href="/profile" onClick={onNavigate} className="min-w-0 flex-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5">
          <p className="truncate text-[13px] font-medium">{user.fullName}</p>
          <p className="mt-0.5 truncate text-[12px] text-white/45">{t.roles[user.role]}</p>
        </Link>
        <button
          type="button"
          aria-label={t.signOut}
          title={t.signOut}
          onClick={() => {
            // No logout endpoint: dropping the token ends the session here.
            document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
            router.replace("/login");
            router.refresh();
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px] rtl:rotate-180" strokeWidth={1.75} />
        </button>
      </div>
    </nav>
  );
}