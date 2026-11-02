"use client";

import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

/** Square icon-only button. `label` is required for screen readers. */
export function IconButton({
  icon: Icon,
  label,
  tone = "neutral",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; tone?: "neutral" | "danger" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors disabled:opacity-40 ${
        tone === "danger" ? "hover:bg-danger-surface hover:text-danger" : "hover:bg-background hover:text-text-primary"
      } ${className}`}
      {...props}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
