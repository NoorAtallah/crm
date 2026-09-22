"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand-charcoal text-white hover:opacity-90",
  accent: "bg-brand-champagne text-brand-charcoal hover:opacity-90",
  secondary:
    "bg-surface text-text-primary border border-line hover:border-brand-charcoal",
  danger: "bg-danger text-white hover:opacity-90",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5",
        "text-[15px] font-medium transition-opacity",
        "disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {loading && (
        <motion.span
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
          className="flex"
        >
          <Loader2 className="h-4 w-4" strokeWidth={2} />
        </motion.span>
      )}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}