"use client";

import { ClipboardCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { RequestRows, type RequestRowData } from "@/components/request/RequestRow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { Status } from "@/lib/status";

type Filter = "new" | "doing" | "parts" | "done";

const GROUPS: Record<Filter, Status[]> = {
  new: ["assigned"],
  doing: ["in_progress"],
  parts: ["waiting_parts"],
  done: ["completed", "closed"],
};

const EMPTY: Record<Filter, string> = {
  new: "ไม่มีงานใหม่ เมื่อเจ้าหน้าที่มอบหมายงาน จะแสดงที่นี่ทันที",
  doing: "ยังไม่มีงานที่กำลังทำ",
  parts: "ไม่มีงานที่รออะไหล่",
  done: "ยังไม่มีงานที่ซ่อมเสร็จ",
};

export function JobList({ jobs }: { jobs: RequestRowData[] }) {
  const [filter, setFilter] = useState<Filter>(() => (jobs.some((j) => j.status === "assigned") ? "new" : "doing"));

  const counts = useMemo(
    () => Object.fromEntries((Object.keys(GROUPS) as Filter[]).map((k) => [k, jobs.filter((j) => GROUPS[k].includes(j.status)).length])) as Record<Filter, number>,
    [jobs],
  );
  const visible = jobs.filter((j) => GROUPS[filter].includes(j.status));

  return (
    <div className="space-y-4 px-5 pt-5">
      <SegmentedControl
        label="กรองงาน"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "new", label: "งานใหม่", count: counts.new },
          { value: "doing", label: "กำลังทำ", count: counts.doing },
          { value: "parts", label: "รออะไหล่", count: counts.parts },
          { value: "done", label: "เสร็จแล้ว", count: counts.done },
        ]}
      />
      {visible.length ? (
        <RequestRows key={filter} items={visible} hrefBase="/tech/job" showUrgency timeField="created_at" />
      ) : (
        <div className="flex flex-col items-center rounded-[16px] bg-white px-6 py-12 text-center">
          <ClipboardCheck size={28} className="text-muted" aria-hidden />
          <p className="mt-2 text-[15px] text-muted">{EMPTY[filter]}</p>
        </div>
      )}
    </div>
  );
}
