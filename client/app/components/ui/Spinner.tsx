"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";

/** Rotating loader. Pass `block` to centre it in a padded area. */
export function Spinner({ size = 20, block = false }: { size?: number; block?: boolean }) {
  const reduceMotion = useReducedMotion();
  const icon = (
    <motion.span
      animate={reduceMotion ? undefined : { rotate: 360 }}
      transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
      className="inline-flex text-text-muted"
    >
      <Loader2 style={{ width: size, height: size }} strokeWidth={1.75} />
    </motion.span>
  );
  return block ? <div className="flex justify-center py-10">{icon}</div> : icon;
}
