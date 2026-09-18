"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { StatusPill } from "@/components/ui/StatusPill";
import { floorLabel, relativeTime } from "@/lib/format";
import { MAIN_FLOW, STATUS_TONE, statusProgress, type Status } from "@/lib/status";

const BAR: Record<string, string> = {
  gray: "bg-[#8e8e93]",
  blue: "bg-blue-ink",
  orange: "bg-orange-ink",
  green: "bg-green-ink",
  red: "bg-red-ink",
  purple: "bg-brand",
};

export function ActiveRequestCard({
  request,
}: {
  request: { code: string; status: Status; category_name: string; category_icon: string; building_name: string; floor: number; room_name: string; updated_at: string };
}) {
  const progress = statusProgress(request.status);
  const step = Math.round(progress * MAIN_FLOW.length);
  return (
    <Link href={`/request/${request.code}`} className="block rounded-[20px] bg-white p-4 transition-colors hover:bg-[#fcfcfd]">
      <div className="flex items-center gap-3">
        <CategoryIcon name={request.category_icon} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold">{request.category_name}</p>
          <p className="truncate text-[13px] text-muted">
            {request.building_name} · {floorLabel(request.floor)} · {request.room_name}
          </p>
        </div>
        <ChevronRight size={18} className="text-[#a0a0a6]" aria-hidden />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <StatusPill status={request.status} />
        <span className="text-xs text-muted">
          อัปเดต {relativeTime(request.updated_at)}
        </span>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-fill"
        role="progressbar"
        aria-label="ความคืบหน้า"
        aria-valuemin={0}
        aria-valuemax={MAIN_FLOW.length}
        aria-valuenow={step}
      >
        <motion.div
          className={`h-full rounded-full ${BAR[STATUS_TONE[request.status]]}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        ขั้นที่ {step} จาก {MAIN_FLOW.length} · {request.code}
      </p>
    </Link>
  );
}
