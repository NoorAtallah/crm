"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** Matches the API's PagedResult: page is 1-based. Arrows flip with direction. */
export function Pagination({
  page,
  totalPages,
  onChange,
  label,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** e.g. "Page 2 of 5", already interpolated. */
  label: string;
  disabled?: boolean;
}) {
  if (totalPages <= 1) return null;
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-line text-text-muted transition-colors hover:border-brand-charcoal hover:text-text-primary disabled:opacity-40 disabled:hover:border-line";
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
      <p className="text-[12.5px] tabular-nums text-text-muted">{label}</p>
      <div className="flex gap-1.5">
        <button type="button" className={btn} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
        </button>
        <button type="button" className={btn} disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
