import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "กลับ",
  right,
  large,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode;
  large?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("px-5 pt-4", className)}>
      {backHref ? (
        <Link href={backHref} className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-0.5 pr-3 text-[15px] font-semibold text-brand">
          <ChevronLeft size={22} aria-hidden />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className={cn("font-bold leading-tight tracking-tight", large ? "text-[28px]" : "text-[22px]")}>{title}</h1>
          {subtitle ? <p className="mt-0.5 text-[15px] text-muted">{subtitle}</p> : null}
        </div>
        {right}
      </div>
    </header>
  );
}
