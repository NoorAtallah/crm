"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Trailing slot, e.g. a show/hide password button. */
  trailing?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, trailing, id, className = "", ...props },
  ref
) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-text-primary"
      >
        {label}
      </label>

      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={[
            "h-11 w-full rounded-lg border bg-surface px-3.5 text-[15px] text-text-primary",
            "placeholder:text-text-muted/70 outline-none transition-colors",
            "focus:border-brand-charcoal focus:ring-2 focus:ring-brand-champagne/35",
            "disabled:bg-background disabled:text-text-muted",
            error ? "border-danger" : "border-line",
            trailing ? "pe-11" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 end-0 flex items-center pe-1.5">
            {trailing}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
});