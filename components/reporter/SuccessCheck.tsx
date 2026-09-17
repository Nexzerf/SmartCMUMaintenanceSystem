"use client";

import { motion } from "framer-motion";

/** Circle draws, then the checkmark strokes in (~600 ms total). */
export function SuccessCheck({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="สำเร็จ">
      <motion.circle
        cx="48"
        cy="48"
        r="44"
        fill="none"
        stroke="#17693A"
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        transform="rotate(-90 48 48)"
      />
      <motion.circle cx="48" cy="48" r="38" fill="#E5F6EA" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }} />
      <motion.path
        d="M30 49 L43 62 L67 36"
        fill="none"
        stroke="#17693A"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.35, duration: 0.25, ease: "easeOut" }}
      />
    </svg>
  );
}
