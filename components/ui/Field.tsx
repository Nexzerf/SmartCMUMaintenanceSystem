import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export function Label({ htmlFor, children, optional }: { htmlFor?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
      {children}
      {optional ? <span className="ml-1 font-normal text-muted">(ไม่บังคับ)</span> : null}
    </label>
  );
}

export function FieldError({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] text-red-ink">
      {children}
    </p>
  );
}

const control =
  "w-full rounded-[12px] bg-white px-3.5 text-[16px] text-ink placeholder:text-[#8a8a90] outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-ink disabled:bg-fill";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "min-h-12", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "min-h-11 appearance-none pr-9 text-[15px]", className)} {...props} />
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
});
