"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

/** Underlined tab bar. `id` keeps the moving indicator scoped to this bar. */
export function Tabs<K extends string>({
  id,
  tabs,
  active,
  onChange,
}: {
  id: string;
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line">
      {tabs.map(({ key, label, icon: Icon, count }) => {
        const selected = key === active;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(key)}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-[13.5px] font-medium transition-colors ${
              selected ? "text-text-primary" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" strokeWidth={1.75} />}
            {label}
            {count !== undefined && (
              <span className="rounded-md bg-background px-1.5 text-[11.5px] tabular-nums text-text-muted">{count}</span>
            )}
            {selected && (
              <motion.span
                layoutId={`${id}-tab-indicator`}
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-charcoal"
                transition={{ duration: 0.22, ease: "easeOut" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
