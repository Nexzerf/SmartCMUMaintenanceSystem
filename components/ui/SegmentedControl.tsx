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
              "relative min-h-10 flex-1 whitespace-nowrap rounded-[9px] px-3 text-sm font-semibold transition-colors",
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
            <span className="relative">
              {o.label}
              {o.count != null ? <span className="ml-1 text-xs font-medium text-muted">{o.count}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
