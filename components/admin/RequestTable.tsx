"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Select } from "@/components/ui/Field";
import { StatusPill, UrgencyTag } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";
import { floorLabel, formatDateTime, relativeTime } from "@/lib/format";
import { facultiesOf, facultyName } from "@/lib/faculties";
import { ADMIN_LIST_LIMIT } from "@/lib/limits";
import type { AdminRequestRow, Catalog } from "@/lib/requests/queries";
import type { serialize } from "@/lib/serialize";
import { STATUS_LABEL, URGENCY_LABEL, URGENCY_RANK, type Status, type Urgency } from "@/lib/status";
import { RequestPanel } from "./RequestPanel";

type Row = ReturnType<typeof serialize<AdminRequestRow>>;
type Filters = { status?: string; category?: string; campus?: string; building?: string; urgency?: string; from?: string; to?: string; q?: string };
type SortKey = "code" | "category" | "location" | "reporter" | "urgency" | "status" | "technician" | "created";

const STATUS_ORDER: Status[] = ["pending", "need_info", "accepted", "assigned", "in_progress", "waiting_parts", "completed", "closed", "cancelled", "rejected"];

export function RequestTable({ rows, catalog, filters, openCode }: { rows: Row[]; catalog: Catalog; filters: Filters; openCode?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, start] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "created", dir: -1 });
  const [open, setOpen] = useState<string | null>(openCode ?? null);
  const [showFilters, setShowFilters] = useState(false);

  const apply = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    if ("campus" in patch) next.building = undefined;
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && sp.set(k, v));
    start(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
  };

  // Debounced code search.
  useEffect(() => {
    if ((filters.q ?? "") === q) return;
    const t = setTimeout(() => apply({ q: q.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const openPanel = (code: string | null) => {
    setOpen(code);
    const url = new URL(window.location.href);
    if (code) url.searchParams.set("open", code);
    else url.searchParams.delete("open");
    window.history.replaceState(null, "", url);
  };

  const sorted = useMemo(() => {
    const val = (r: Row): string | number => {
      switch (sort.key) {
        case "code": return r.code;
        case "category": return r.category_name;
        case "location": return `${r.building_name} ${r.floor} ${r.room_name}`;
        case "reporter": return r.reporter_name;
        case "urgency": return URGENCY_RANK[r.urgency];
        case "status": return STATUS_ORDER.indexOf(r.status);
        case "technician": return r.technician_name ?? "ฮ";
        case "created": return new Date(r.created_at).getTime();
      }
    };
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "th")) * sort.dir;
    });
  }, [rows, sort]);

  const activeFilterCount = ["status", "category", "campus", "building", "urgency", "from", "to"].filter((k) => filters[k as keyof Filters]).length;
  const buildings = catalog.buildings.filter((b) => !filters.campus || b.campus_id === Number(filters.campus));

  const Th = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => {
    const active = sort.key === k;
    const Icon = active ? (sort.dir === 1 ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th scope="col" className={cn("whitespace-nowrap px-3 py-2 text-left text-[13px] font-semibold text-muted", className)} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
        <button type="button" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? ((s.dir * -1) as 1 | -1) : 1 }))} className="inline-flex min-h-9 items-center gap-1 hover:text-ink">
          {children}
          <Icon size={13} className={active ? "text-brand" : "opacity-40"} aria-hidden />
        </button>
      </th>
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">คำร้องทั้งหมด</h1>
          <p className="text-[15px] text-muted">
            {rows.length} รายการ{rows.length >= ADMIN_LIST_LIMIT ? ` (แสดง ${ADMIN_LIST_LIMIT} รายการล่าสุด)` : ""} · แตะแถวเพื่อจัดการ
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาเลขคำร้อง เช่น MR-2609"
              aria-label="ค้นหาเลขคำร้อง"
              className="min-h-11 w-full rounded-[12px] bg-white pl-9 pr-3 text-[15px] outline-none ring-1 ring-transparent focus:ring-2 focus:ring-brand"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={cn("inline-flex min-h-11 items-center gap-2 rounded-[12px] px-3.5 text-[15px] font-semibold xl:hidden", activeFilterCount ? "bg-brand-soft text-brand" : "bg-white text-ink")}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={17} aria-hidden />
            ตัวกรอง{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
      </div>

      <div className={cn("mt-4 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid 2xl:grid-cols-8", showFilters ? "grid" : "hidden")}>
        <Select aria-label="สถานะ" value={filters.status ?? ""} onChange={(e) => apply({ status: e.target.value || undefined })}>
          <option value="">ทุกสถานะ</option>
          <option value="open">ยังไม่ปิดงาน</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select aria-label="ประเภท" value={filters.category ?? ""} onChange={(e) => apply({ category: e.target.value || undefined })}>
          <option value="">ทุกประเภท</option>
          {catalog.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_th}
            </option>
          ))}
        </Select>
        <Select aria-label="วิทยาเขต" value={filters.campus ?? ""} onChange={(e) => apply({ campus: e.target.value || undefined })}>
          <option value="">ทุกวิทยาเขต</option>
          {catalog.campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_th}
            </option>
          ))}
        </Select>
        <Select aria-label="อาคาร" value={filters.building ?? ""} onChange={(e) => apply({ building: e.target.value || undefined })}>
          <option value="">ทุกอาคาร</option>
          {facultiesOf(buildings).map((f) => (
            <optgroup key={f.name} label={f.name}>
              {buildings
                .filter((b) => facultyName(b) === f.name)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name_th}
                  </option>
                ))}
            </optgroup>
          ))}
        </Select>
        <Select aria-label="ความเร่งด่วน" value={filters.urgency ?? ""} onChange={(e) => apply({ urgency: e.target.value || undefined })}>
          <option value="">ทุกความเร่งด่วน</option>
          {(["urgent", "normal", "low"] as Urgency[]).map((u) => (
            <option key={u} value={u}>
              {URGENCY_LABEL[u]}
            </option>
          ))}
        </Select>
        <label className="flex min-h-11 items-center gap-2 rounded-[12px] bg-white px-3 text-sm text-muted focus-within:ring-2 focus-within:ring-brand">
          ตั้งแต่
          <input type="date" value={filters.from ?? ""} max={filters.to} onChange={(e) => apply({ from: e.target.value || undefined })} className="min-w-0 flex-1 bg-transparent text-ink outline-none" />
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-[12px] bg-white px-3 text-sm text-muted focus-within:ring-2 focus-within:ring-brand">
          ถึง
          <input type="date" value={filters.to ?? ""} min={filters.from} onChange={(e) => apply({ to: e.target.value || undefined })} className="min-w-0 flex-1 bg-transparent text-ink outline-none" />
        </label>
        {activeFilterCount || filters.q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              start(() => router.replace(pathname, { scroll: false }));
            }}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[12px] bg-fill px-3 text-sm font-semibold"
          >
            <X size={15} aria-hidden /> ล้างตัวกรอง
          </button>
        ) : null}
      </div>

      <div className={cn("mt-4 overflow-hidden rounded-[16px] bg-white transition-opacity", loading && "opacity-60")} aria-busy={loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="border-b border-line">
              <tr>
                <Th k="code" className="pl-4">เลขที่</Th>
                <Th k="category">ประเภท</Th>
                <Th k="location">สถานที่</Th>
                <Th k="reporter">ผู้แจ้ง</Th>
                <Th k="urgency">ความเร่งด่วน</Th>
                <Th k="status">สถานะ</Th>
                <Th k="technician">ช่าง</Th>
                <Th k="created" className="pr-4">แจ้งเมื่อ</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openPanel(r.code)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openPanel(r.code))}
                  tabIndex={0}
                  className={cn("cursor-pointer border-b border-line text-[14px] last:border-0 hover:bg-[#fafafb] focus-visible:bg-brand-soft", open === r.code && "bg-brand-soft")}
                  aria-label={`เปิดคำร้อง ${r.code}`}
                >
                  <td className="whitespace-nowrap py-3 pl-4 pr-3 font-semibold tabular-nums">{r.code}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <CategoryIcon name={r.category_icon} size="sm" />
                      {r.category_name}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="block whitespace-nowrap">{r.building_name}</span>
                    <span className="block whitespace-nowrap text-[13px] text-muted">
                      {floorLabel(r.floor)} · {r.room_name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{r.reporter_name}</td>
                  <td className="px-3 py-3">
                    <UrgencyTag urgency={r.urgency} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={r.status} merged={!!r.merged_into_code} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{r.technician_name ?? <span className="text-muted">–</span>}</td>
                  <td className="whitespace-nowrap py-3 pl-3 pr-4" title={formatDateTime(r.created_at)}>
                    <span suppressHydrationWarning>{relativeTime(r.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 ? <p className="px-6 py-14 text-center text-muted">ไม่พบคำร้องที่ตรงกับตัวกรอง ลองล้างตัวกรองหรือเปลี่ยนช่วงวันที่</p> : null}
      </div>

      <RequestPanel code={open} onClose={() => openPanel(null)} />
    </>
  );
}
