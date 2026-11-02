"use client";

import { motion } from "framer-motion";

/** Small pill switch between a few filters (All / Active / Closed). */
export function SegmentedControl<K extends string>({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <div className="flex rounded-lg border border-line p-0.5">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`relative rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
            value === option.key ? "text-text-primary" : "text-text-muted hover:text-text-primary"
          }`}
        >
          {value === option.key && (
            <motion.span
              layoutId={`${id}-segment`}
              className="absolute inset-0 rounded-md bg-background"
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
          )}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
