"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "soft";
type Size = "md" | "lg" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-fill-strong disabled:text-muted",
  secondary: "bg-fill text-ink hover:bg-fill-strong disabled:text-muted",
  danger: "bg-red-tint text-red-ink hover:bg-[#f9dcdc] disabled:text-muted",
  ghost: "bg-transparent text-brand hover:bg-brand-soft",
  soft: "bg-brand-soft text-brand hover:bg-[#e5d9ef]",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-11 px-3.5 text-sm rounded-[10px]",
  md: "min-h-12 px-5 text-[15px] rounded-[12px]",
  lg: "min-h-14 px-6 text-base rounded-[14px]",
};

export type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-60")}>{children as React.ReactNode}</span>
    </motion.button>
  );
});

const MotionLink = motion.create(Link);

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  block,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <MotionLink
      href={href}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 font-semibold transition-colors",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
    >
      {children}
    </MotionLink>
  );
}
