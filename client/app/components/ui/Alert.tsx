"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "danger" | "warning" | "success" | "info";

const tones: Record<Tone, { surface: string; text: string; Icon: typeof Info }> =
  {
    danger: { surface: "bg-danger-surface", text: "text-danger", Icon: AlertCircle },
    warning: {
      surface: "bg-warning-surface",
      text: "text-warning",
      Icon: TriangleAlert,
    },
    success: {
      surface: "bg-success-surface",
      text: "text-success",
      Icon: CheckCircle2,
    },
    info: { surface: "bg-info-surface", text: "text-info", Icon: Info },
  };

export function Alert({
  tone = "info",
  show = true,
  children,
}: {
  tone?: Tone;
  show?: boolean;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const { surface, text, Icon } = tones[tone];

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3 ${surface}`}>
            <Icon className={`mt-px h-4 w-4 shrink-0 ${text}`} strokeWidth={2} />
            <div className={`text-[13px] leading-relaxed ${text}`}>{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}