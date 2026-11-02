"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Multi-line input styled like `Field`. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, id, rows = 4, className = "", ...props },
  ref
) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-text-primary">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={!!error}
        className={[
          "w-full resize-y rounded-lg border bg-surface px-3.5 py-2.5 text-[14.5px] leading-relaxed text-text-primary",
          "placeholder:text-text-muted/70 outline-none transition-colors",
          "focus:border-brand-charcoal focus:ring-2 focus:ring-brand-champagne/35",
          "disabled:bg-background disabled:text-text-muted",
          error ? "border-danger" : "border-line",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-[12.5px] text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-[12.5px] text-text-muted">{hint}</p>
      )}
    </div>
  );
});
