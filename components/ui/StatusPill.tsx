import { cn } from "@/lib/cn";
import { STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, type Status, type Tone, type Urgency } from "@/lib/status";

export const TONE_CLASS: Record<Tone, string> = {
  gray: "bg-gray-tint text-gray-ink",
  blue: "bg-blue-tint text-blue-ink",
  orange: "bg-orange-tint text-orange-ink",
  green: "bg-green-tint text-green-ink",
  red: "bg-red-tint text-red-ink",
  purple: "bg-brand-soft text-brand",
};

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5", TONE_CLASS[tone], className)}>
      {children}
    </span>
  );
}

export function StatusPill({ status, merged, className }: { status: Status; merged?: boolean; className?: string }) {
  if (merged) return <Pill tone="gray" className={className}>รวมกับคำร้องอื่น</Pill>;
  return (
    <Pill tone={STATUS_TONE[status]} className={className}>
      {STATUS_LABEL[status]}
    </Pill>
  );
}

export function UrgencyTag({ urgency, hideNormal }: { urgency: Urgency; hideNormal?: boolean }) {
  if (hideNormal && urgency === "normal") return null;
  const tone: Tone = urgency === "urgent" ? "red" : urgency === "low" ? "gray" : "purple";
  return <Pill tone={tone}>{URGENCY_LABEL[urgency]}</Pill>;
}
