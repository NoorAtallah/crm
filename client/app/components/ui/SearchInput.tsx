"use client";

import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

/** Compact search box for toolbars. */
export function SearchInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`relative min-w-[220px] flex-1 ${className}`}>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        strokeWidth={1.75}
      />
      <input
        type="search"
        autoComplete="off"
        name="q-search"
        className="w-full rounded-lg border border-line bg-surface py-2 pe-3 ps-9 text-[13.5px] text-text-primary placeholder:text-text-muted focus:border-text-muted focus:outline-none"
        {...props}
      />
    </label>
  );
}
