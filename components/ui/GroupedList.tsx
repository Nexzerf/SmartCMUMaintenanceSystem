"use client";

import { Check, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function GroupedList({ title, footer, children, className }: { title?: string; footer?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      {title ? <h3 className="mb-1.5 px-4 text-[13px] font-medium text-muted">{title}</h3> : null}
      <div className="overflow-hidden rounded-[16px] bg-white" role="list">
        {children}
      </div>
      {footer ? <p className="mt-1.5 px-4 text-[13px] text-muted">{footer}</p> : null}
    </section>
  );
}

type RowProps = {
  icon?: React.ReactNode;
  label: React.ReactNode;
  detail?: React.ReactNode;
  trailing?: React.ReactNode;
  selected?: boolean;
  chevron?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  role?: "radio" | "button";
};

export function GroupedRow({ icon, label, detail, trailing, selected, chevron, onClick, disabled, role }: RowProps) {
  const interactive = !!onClick;
  const content = (
    <>
      {icon}
      <div className="min-w-0 flex-1 py-3">
        <div className="text-[15px] leading-snug text-ink">{label}</div>
        {detail ? <div className="mt-0.5 text-[13px] leading-snug text-muted">{detail}</div> : null}
      </div>
      {trailing}
      {selected ? <Check className="shrink-0 text-brand" size={20} strokeWidth={2.5} aria-hidden /> : null}
      {chevron ? <ChevronRight className="shrink-0 text-[#a0a0a6]" size={18} aria-hidden /> : null}
    </>
  );
  const cls = cn(
    "group relative flex min-h-[52px] w-full items-center gap-3 px-4 text-left",
    "after:absolute after:bottom-0 after:right-0 after:h-px after:bg-line last:after:hidden",
    icon ? "after:left-[68px]" : "after:left-4",
    interactive && "transition-colors hover:bg-[#fafafb] active:bg-[#f2f2f4]",
    disabled && "opacity-50",
  );
  if (!interactive) return <div className={cls} role="listitem">{content}</div>;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.1 }}
      className={cls}
      role={role ?? "button"}
      aria-checked={role === "radio" ? !!selected : undefined}
    >
      {content}
    </motion.button>
  );
}
