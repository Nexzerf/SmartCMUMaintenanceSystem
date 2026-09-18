"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  label: string;
}) {
  const id = useId();
  // Four or more tabs do not fit a 360 px phone on one line: give each an equal share,
  // let a long label wrap, and put the count under it. From sm up they sit on one line.
  const dense = options.length >= 4;
  return (
    <div role="tablist" aria-label={label} className={cn("no-scrollbar flex gap-1 overflow-x-auto rounded-[12px] bg-fill p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative min-h-10 rounded-[9px] text-sm font-semibold transition-colors",
              dense ? "min-w-0 flex-1 basis-0 px-1 py-1 text-[13px] leading-tight sm:whitespace-nowrap sm:px-3 sm:text-sm" : "flex-1 whitespace-nowrap px-3",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[9px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            ) : null}
            <span className={cn("relative", dense && "flex flex-col items-center sm:inline sm:flex-none")}>
              {o.label}
              {o.count != null ? <span className={cn("text-xs font-medium text-muted", dense ? "sm:ml-1" : "ml-1")}>{o.count}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
