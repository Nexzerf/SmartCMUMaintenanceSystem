"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { TimelineModel } from "@/lib/timeline";
import type { Tone } from "@/lib/status";

const DOT: Record<Tone, string> = {
  gray: "bg-[#8e8e93]",
  blue: "bg-blue-ink",
  orange: "bg-orange-ink",
  green: "bg-green-ink",
  red: "bg-red-ink",
  purple: "bg-brand",
};
const RING: Record<Tone, string> = {
  gray: "ring-[#8e8e93]",
  blue: "ring-blue-ink",
  orange: "ring-orange-ink",
  green: "ring-green-ink",
  red: "ring-red-ink",
  purple: "ring-brand",
};
const TEXT: Record<Tone, string> = {
  gray: "text-gray-ink",
  blue: "text-blue-ink",
  orange: "text-orange-ink",
  green: "text-green-ink",
  red: "text-red-ink",
  purple: "text-brand",
};

/** Re-render relative times every 30s without refetching. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function Timeline({ model }: { model: TimelineModel }) {
  const now = useNow();
  const doneColor = "bg-green-ink";

  return (
    <ol className="relative" aria-label="ไทม์ไลน์สถานะ">
      {model.steps.map((step, i) => {
        const isLast = i === model.steps.length - 1 && !model.terminal;
        const done = step.state === "done";
        const current = step.state === "current";
        const lineFilled = done && (i < model.steps.length - 1 ? model.steps[i + 1].state !== "future" : !!model.terminal);
        return (
          <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span className="absolute left-[11px] top-7 h-[calc(100%-22px)] w-0.5 overflow-hidden rounded-full bg-fill-strong" aria-hidden>
                <motion.span
                  className={cn("block w-full rounded-full", doneColor)}
                  initial={{ height: 0 }}
                  animate={{ height: lineFilled ? "100%" : "0%" }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.12, ease: "easeOut" }}
                />
              </span>
            ) : null}

            <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
              {done ? (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.12 }}
                  className={cn("flex h-6 w-6 items-center justify-center rounded-full text-white", doneColor)}
                >
                  <Check size={14} strokeWidth={3} />
                </motion.span>
              ) : current ? (
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2", RING[model.currentTone])}>
                  <span className={cn("pulse-dot h-3 w-3 rounded-full", DOT[model.currentTone])} />
                </span>
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-fill-strong bg-white" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className={cn("text-[15px] leading-6", done ? "font-semibold text-ink" : current ? cn("font-bold", TEXT[model.currentTone]) : "text-muted")}>
                {step.label}
                <span className="sr-only">{done ? " (เสร็จแล้ว)" : current ? " (ขั้นปัจจุบัน)" : " (ยังไม่ถึง)"}</span>
              </p>
              {step.at ? (
                <p className="text-[13px] text-muted">
                  {formatDateTime(step.at)} · {relativeTime(step.at, now)}
                </p>
              ) : null}
              {step.actor && step.status === "assigned" ? <p className="mt-0.5 text-[13px] text-ink">ช่าง{step.actor}</p> : null}
              {step.note && step.status !== "pending" ? <p className="mt-0.5 text-[13px] text-muted">{step.note}</p> : null}

              {step.events.map((ev) => (
                <div key={ev.id} className={cn("mt-2 rounded-[12px] px-3 py-2", ev.tone === "orange" ? "bg-orange-tint" : ev.tone === "blue" ? "bg-blue-tint" : "bg-gray-tint")}>
                  <p className={cn("text-[13px] font-semibold", TEXT[ev.tone])}>{ev.label}</p>
                  {ev.note && ev.note !== ev.label ? <p className="text-[13px] text-ink">{ev.note}</p> : null}
                  <p className="text-xs text-muted">{relativeTime(ev.at, now)}</p>
                </div>
              ))}
            </div>
          </li>
        );
      })}

      {model.terminal ? (
        <li className="relative flex gap-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-ink text-white" aria-hidden>
            <X size={14} strokeWidth={3} />
          </span>
          <div>
            <p className="text-[15px] font-bold leading-6 text-red-ink">{model.terminal.label}</p>
            {model.terminal.at ? (
              <p className="text-[13px] text-muted">
                {formatDateTime(model.terminal.at)} · {relativeTime(model.terminal.at, now)}
              </p>
            ) : null}
            {model.terminal.note ? <p className="mt-1 text-[13px]">{model.terminal.note}</p> : null}
          </div>
        </li>
      ) : null}
    </ol>
  );
}
