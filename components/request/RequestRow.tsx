"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Pill, StatusPill, UrgencyTag } from "@/components/ui/StatusPill";
import { floorLabel, relativeTime } from "@/lib/format";
import type { Status, Urgency } from "@/lib/status";

export type RequestRowData = {
  code: string;
  status: Status;
  urgency: Urgency;
  category_name: string;
  category_icon: string;
  building_name: string;
  floor: number;
  room_name: string;
  created_at: string;
  updated_at: string;
  is_following?: boolean;
  merged_into_code?: string | null;
};

export function RequestRows({
  items,
  hrefBase,
  showUrgency,
  timeField = "updated_at",
  trailing,
}: {
  items: RequestRowData[];
  hrefBase: string;
  showUrgency?: boolean;
  timeField?: "created_at" | "updated_at";
  trailing?: (item: RequestRowData) => React.ReactNode;
}) {
  return (
    <ul className="overflow-hidden rounded-[16px] bg-white">
      {items.map((r, i) => {
        const extra = trailing?.(r);
        return (
          <motion.li
            key={r.code}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 6) * 0.04, duration: 0.25 }}
            className="relative flex items-center after:absolute after:bottom-0 after:left-[68px] after:right-0 after:h-px after:bg-line last:after:hidden"
          >
            <Link href={`${hrefBase}/${r.code}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#fafafb] active:bg-[#f2f2f4]">
              <CategoryIcon name={r.category_icon} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {showUrgency ? <UrgencyTag urgency={r.urgency} hideNormal /> : null}
                  <span className="truncate text-[15px] font-semibold">{r.category_name}</span>
                  {r.is_following ? <Pill tone="purple">ติดตาม</Pill> : null}
                </div>
                <p className="truncate text-[13px] text-muted">
                  {r.building_name} · {floorLabel(r.floor)} · {r.room_name}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusPill status={r.status} merged={!!r.merged_into_code} />
                  <span className="text-xs text-muted" suppressHydrationWarning>
                    {r.code} · {relativeTime(r[timeField])}
                  </span>
                </div>
              </div>
              {extra ? null : <ChevronRight size={18} className="shrink-0 text-[#a0a0a6]" aria-hidden />}
            </Link>
            {extra ? <div className="shrink-0 pr-4">{extra}</div> : null}
          </motion.li>
        );
      })}
    </ul>
  );
}

