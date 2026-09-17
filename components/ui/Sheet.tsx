"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** bottom: mobile bottom sheet (centered dialog on wide screens). right: side panel. */
  side?: "bottom" | "right";
  className?: string;
  wide?: boolean;
};

export function Sheet({ open, onClose, title, description, children, footer, side = "bottom", className, wide }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => panelRef.current?.focus(), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;

  const isRight = side === "right";
  const panelClass = isRight
    ? cn("fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-page shadow-[var(--shadow-float)] outline-none", wide ? "max-w-[640px]" : "max-w-[480px]")
    : cn(
        "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full flex-col rounded-t-[20px] bg-page shadow-[var(--shadow-sheet)] outline-none",
        wide ? "sm:max-w-[560px]" : "sm:max-w-[440px]",
        "sm:bottom-6 sm:rounded-[20px]",
      );

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div key="sheet-root">
          <motion.div
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className={cn(panelClass, className)}
            initial={isRight ? { x: "100%" } : { y: "100%" }}
            animate={isRight ? { x: 0 } : { y: 0 }}
            exit={isRight ? { x: "100%", opacity: 0.9 } : { y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.9 }}
          >
            {!isRight ? <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-fill-strong sm:hidden" aria-hidden /> : null}
            {title ? (
              <div className="flex shrink-0 items-start gap-3 px-5 pb-2 pt-4">
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="text-lg font-bold leading-snug">
                    {title}
                  </h2>
                  {description ? <div className="mt-1 text-sm text-muted">{description}</div> : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-fill"
                  aria-label="ปิด"
                >
                  <X size={20} />
                </button>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
            {footer ? <div className="shrink-0 bg-page px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
