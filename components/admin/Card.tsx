import { cn } from "@/lib/cn";

export function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[16px] bg-white p-4 md:p-5", className)}>
      <h2 className="text-[16px] font-bold">{title}</h2>
      {subtitle ? <p className="text-[13px] text-muted">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
