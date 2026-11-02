"use client";

import type { SelectHTMLAttributes } from "react";

/** Native select styled like `Field`, so forms read as one system. */
export function SelectField({
  id,
  label,
  error,
  hint,
  options,
  placeholder,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-text-primary">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={!!error}
        className={[
          "h-11 w-full rounded-lg border bg-surface px-3 text-[15px] text-text-primary outline-none transition-colors",
          "focus:border-brand-charcoal focus:ring-2 focus:ring-brand-champagne/35",
          "disabled:bg-background disabled:text-text-muted",
          error ? "border-danger" : "border-line",
        ].join(" ")}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 text-[12.5px] text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-[12.5px] text-text-muted">{hint}</p>
      )}
    </div>
  );
}
