"use client";

import { Repeat2, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RequestRows, type RequestRowData } from "@/components/request/RequestRow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CANCELLED_STATUSES, DONE_STATUSES, type Status } from "@/lib/status";
import { floorLabel } from "@/lib/format";

type Item = RequestRowData & { category_id: number; room_id: number; campus_name: string };
type Filter = "all" | "active" | "done" | "cancelled";

function bucket(s: Status, merged: boolean): Exclude<Filter, "all"> {
  if (merged || CANCELLED_STATUSES.includes(s)) return "cancelled";
  if (DONE_STATUSES.includes(s)) return "done";
  return "active";
}

export function HistoryList({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c = { all: items.length, active: 0, done: 0, cancelled: 0 };
    items.forEach((i) => c[bucket(i.status, !!i.merged_into_code)]++);
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (filter !== "all" && bucket(i.status, !!i.merged_into_code) !== filter) return false;
      if (!term) return true;
      return [i.code, i.building_name, i.room_name, floorLabel(i.floor), i.campus_name, i.category_name].some((f) => f.toLowerCase().includes(term));
    });
  }, [items, filter, q]);

  return (
    <div className="space-y-4 px-5 pt-4">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาเลขคำร้องหรือสถานที่"
          aria-label="ค้นหาเลขคำร้องหรือสถานที่"
          className="min-h-12 w-full rounded-[12px] bg-white pl-10 pr-11 text-[16px] outline-none ring-1 ring-transparent placeholder:text-[#8a8a90] focus:ring-2 focus:ring-brand [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} className="absolute right-0 top-0 inline-flex h-12 w-12 items-center justify-center text-muted" aria-label="ล้างคำค้นหา">
            <X size={18} />
          </button>
        ) : null}
      </div>

      <SegmentedControl
        label="กรองตามสถานะ"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "ทั้งหมด", count: counts.all },
          { value: "active", label: "กำลังดำเนินการ", count: counts.active },
          { value: "done", label: "เสร็จสิ้น", count: counts.done },
          { value: "cancelled", label: "ยกเลิก", count: counts.cancelled },
        ]}
      />

      {filtered.length ? (
        <RequestRows
          key={filter + q}
          items={filtered}
          hrefBase="/request"
          trailing={(r) => {
            const item = r as Item;
            return item.status === "closed" && !item.is_following ? (
              <Link
                href={`/request/new?category=${item.category_id}&room=${item.room_id}`}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-[10px] bg-fill px-2.5 text-[13px] font-semibold text-ink"
                aria-label={`แจ้งซ่อมซ้ำ ${item.category_name} ที่ ${item.building_name} ${item.room_name}`}
              >
                <Repeat2 size={15} aria-hidden />
                แจ้งซ่อมซ้ำ
              </Link>
            ) : undefined;
          }}
        />
      ) : (
        <div className="rounded-[16px] bg-white px-6 py-12 text-center">
          <p className="font-semibold">{items.length ? "ไม่พบคำร้องที่ตรงกับเงื่อนไข" : "ยังไม่มีประวัติการแจ้งซ่อม"}</p>
          <p className="mt-1 text-sm text-muted">{items.length ? "ลองเปลี่ยนตัวกรองหรือคำค้นหา" : "คำร้องที่คุณแจ้งหรือกดติดตามจะแสดงที่นี่"}</p>
        </div>
      )}
    </div>
  );
}
