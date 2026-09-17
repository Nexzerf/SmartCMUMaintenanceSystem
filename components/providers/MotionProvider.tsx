"use client";

import { MotionConfig } from "framer-motion";

/** Framer Motion respects prefers-reduced-motion: transforms are skipped, opacity fades remain. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: "easeOut" }}>
      {children}
    </MotionConfig>
  );
}
