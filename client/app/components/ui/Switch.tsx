"use client";

import { motion } from "framer-motion";

/** On/off toggle with a label and optional hint. */
export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span>
        <span className="block text-[13px] font-medium text-text-primary">{label}</span>
        {hint && <span className="mt-0.5 block text-[12.5px] text-text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          checked ? "justify-end bg-brand-charcoal" : "justify-start bg-line"
        }`}
      >
        <motion.span layout transition={{ duration: 0.18, ease: "easeOut" }} className="h-5 w-5 rounded-full bg-white shadow-card" />
      </button>
    </label>
  );
}
