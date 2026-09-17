import {
  AirVent,
  Armchair,
  Building2,
  Droplets,
  Ellipsis,
  Hammer,
  Lamp,
  Lightbulb,
  Monitor,
  Plug,
  ShieldAlert,
  Trees,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/** Icons Admin can pick for categories. Kept explicit so the client bundle stays small. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Zap,
  Droplets,
  AirVent,
  Monitor,
  Armchair,
  Building2,
  Ellipsis,
  Wrench,
  Hammer,
  Lightbulb,
  Plug,
  Wifi,
  Lamp,
  Trees,
  ShieldAlert,
};

const TINTS: Record<string, string> = {
  Zap: "bg-[#fff4d6] text-[#8a5a00]",
  Droplets: "bg-[#e3f1fb] text-[#0b5e8e]",
  AirVent: "bg-[#e4f4f3] text-[#0f6b66]",
  Monitor: "bg-[#ecebfb] text-[#4338a8]",
  Armchair: "bg-[#f7ece3] text-[#8a4b1c]",
  Building2: "bg-[#eeeef0] text-[#4a4a50]",
};

export function CategoryIcon({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Wrench;
  const box = size === "sm" ? "h-8 w-8 rounded-[9px]" : size === "lg" ? "h-12 w-12 rounded-[14px]" : "h-10 w-10 rounded-[11px]";
  const icon = size === "sm" ? 16 : size === "lg" ? 24 : 20;
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", box, TINTS[name] ?? "bg-brand-soft text-brand", className)} aria-hidden>
      <Icon size={icon} strokeWidth={2} />
    </span>
  );
}
