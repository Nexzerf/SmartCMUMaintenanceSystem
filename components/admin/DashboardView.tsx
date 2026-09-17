"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, FileSpreadsheet, FileText, FlaskConical, Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { simulateAutoClose } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";
import type { DashboardData, RangeKey } from "@/lib/dashboard";
import { relativeTime } from "@/lib/format";
import type { serialize } from "@/lib/serialize";
import { STATUS_LABEL, type Status } from "@/lib/status";
import { RequestPanel } from "./RequestPanel";

type View = ReturnType<typeof serialize<Omit<DashboardData, "rows">>>;

// Validated with the dataviz palette checker (lightness band, CVD separation, contrast).
const SERIES_A = "#7B4BA8";
const SERIES_B = "#2F9E8F";
const INK = "#111111";
const MUTED = "#6B6B6B";
const GRID = "#ECECEF";

const STATUS_FILL: Record<string, string> = {
  pending: "#8E8E93",
  accepted: "#3B7DDD",
  assigned: "#3B7DDD",
  in_progress: "#3B7DDD",
  waiting_parts: "#D9822B",
  need_info: "#D9822B",
  completed: "#2E9E5B",
  closed: "#2E9E5B",
  cancelled: "#D64545",
  rejected: "#D64545",
};

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = value.toFixed(decimals);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => (el.textContent = v.toLocaleString("th-TH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })),
    });
    return () => controls.stop();
  }, [value, decimals, reduce]);
  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}

function Kpi({ icon: Icon, label, value, decimals, suffix, hint, tone }: { icon: typeof Clock; label: string; value: number | null; decimals?: number; suffix?: string; hint?: string; tone?: "red" }) {
  return (
    <div className="rounded-[16px] bg-white p-4">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <Icon size={15} className={tone === "red" ? "text-red-ink" : "text-muted"} aria-hidden />
        {label}
      </p>
      <p className="mt-1.5 text-[30px] font-bold leading-none tracking-tight tabular-nums">
        {value === null ? "–" : <CountUp value={value} decimals={decimals} />}
        {suffix && value !== null ? <span className="ml-1 text-[15px] font-semibold text-muted">{suffix}</span> : null}
      </p>
      {hint ? <p className="mt-1.5 text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}

function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[16px] bg-white p-4 md:p-5", className)}>
      <h2 className="text-[16px] font-bold">{title}</h2>
      {subtitle ? <p className="text-[13px] text-muted">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: "none", boxShadow: "0 8px 30px rgba(17,17,17,0.12)", fontFamily: "inherit", fontSize: 13 },
  labelStyle: { color: INK, fontWeight: 600 },
  itemStyle: { color: INK },
  cursor: { fill: "rgba(91,44,131,0.06)" },
};
const axisTick = { fill: MUTED, fontSize: 12 };

function shortDay(ymd: string) {
  const [, m, d] = ymd.split("-");
  return `${Number(d)}/${Number(m)}`;
}

export function DashboardView({ data }: { data: View }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, start] = useTransition();
  const [simulating, startSim] = useTransition();
  const [simMsg, setSimMsg] = useState<string | null>(null);
  const [from, setFrom] = useState(data.range.from);
  const [to, setTo] = useState(data.range.to);
  const [open, setOpen] = useState<string | null>(null);
  const [custom, setCustom] = useState(data.range.key === "custom");
  const reduce = useReducedMotion();
  const anim = !reduce;

  useEffect(() => {
    setFrom(data.range.from);
    setTo(data.range.to);
  }, [data.range.from, data.range.to]);

  const go = (range: RangeKey, f?: string, t?: string) => {
    const sp = new URLSearchParams({ range });
    if (range === "custom" && f && t) {
      sp.set("from", f);
      sp.set("to", t);
    }
    start(() => router.replace(`${pathname}?${sp}`, { scroll: false }));
  };

  const exportQuery = new URLSearchParams({ range: data.range.key, from: data.range.from, to: data.range.to }).toString();
  const statusData = data.byStatus
    .map((s) => ({ ...s, label: STATUS_LABEL[s.status as Status] }))
    .sort((a, b) => b.count - a.count);
  const k = data.kpi;

  return (
    <div className={cn("transition-opacity", loading && "opacity-60")} aria-busy={loading}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">แดชบอร์ด</h1>
          <p className="text-[15px] text-muted">ภาพรวมงานซ่อม · {data.range.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/export/xlsx?${exportQuery}`} className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-white px-3.5 text-[15px] font-semibold hover:bg-fill">
            <FileSpreadsheet size={18} className="text-green-ink" aria-hidden /> Excel
          </a>
          <a href={`/api/admin/export/pdf?${exportQuery}`} className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-white px-3.5 text-[15px] font-semibold hover:bg-fill">
            <FileText size={18} className="text-red-ink" aria-hidden /> PDF
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SegmentedControl
          label="ช่วงเวลา"
          className="w-full sm:w-auto"
          value={custom ? "custom" : data.range.key}
          onChange={(v: RangeKey) => {
            if (v === "custom") return setCustom(true);
            setCustom(false);
            go(v);
          }}
          options={[
            { value: "7d", label: "7 วัน" },
            { value: "30d", label: "30 วัน" },
            { value: "month", label: "เดือนนี้" },
            { value: "custom", label: "กำหนดเอง" },
          ]}
        />
        {custom ? (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (from && to && from <= to) go("custom", from, to);
            }}
          >
            <input type="date" aria-label="ตั้งแต่วันที่" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="min-h-11 rounded-[12px] bg-white px-3 text-[15px] outline-none focus:ring-2 focus:ring-brand" />
            <span className="text-muted">ถึง</span>
            <input type="date" aria-label="ถึงวันที่" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="min-h-11 rounded-[12px] bg-white px-3 text-[15px] outline-none focus:ring-2 focus:ring-brand" />
            <Button type="submit" size="sm" disabled={!from || !to || from > to}>
              ดูข้อมูล
            </Button>
          </form>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <Kpi icon={ClipboardList} label="คำร้องทั้งหมด" value={k.total} hint="แจ้งเข้ามาในช่วงนี้" />
        <Kpi icon={Clock} label="ยังไม่ปิดงาน" value={k.open} hint={k.total ? `${Math.round((k.open / k.total) * 100)}% ของทั้งหมด` : undefined} />
        <Kpi icon={AlertTriangle} label="ด่วนมากที่ยังเปิด" value={k.urgentOpen} tone="red" hint="ควรจัดการก่อน" />
        <Kpi icon={CheckCircle2} label="เวลาปิดงานเฉลี่ย" value={k.avgCloseHours} decimals={1} suffix="ชม." hint={`จาก ${k.closedCount} งานที่ปิด`} />
        <Kpi icon={Star} label="ความพึงพอใจเฉลี่ย" value={k.avgRating} decimals={2} suffix="/ 5" hint={`จาก ${k.ratingCount} คะแนน`} />
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-3">
        <Card title="จำนวนคำร้องรายวัน" subtitle="นับตามวันที่แจ้ง" className="xl:col-span-2">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tickFormatter={shortDay} tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <Tooltip {...tooltipStyle} cursor={{ stroke: "#C9C9CF", strokeWidth: 1 }} labelFormatter={(d) => shortDay(String(d))} formatter={(v) => [`${v} คำร้อง`, "จำนวน"]} />
                <Line type="linear" dataKey="count" stroke={SERIES_A} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={anim} animationDuration={800} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="แยกตามสถานะ" subtitle="คำร้องในช่วงนี้">
          <div style={{ height: Math.max(160, statusData.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={6}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ ...axisTick, fill: INK }} axisLine={false} tickLine={false} width={122} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v} คำร้อง`, "จำนวน"]} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={anim} animationDuration={800} label={{ position: "right", fill: MUTED, fontSize: 12 }}>
                  {statusData.map((s) => (
                    <Cell key={s.status} fill={STATUS_FILL[s.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="5 อาคารที่แจ้งซ่อมมากที่สุด">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.buildings} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={8}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ ...axisTick, fill: INK }} axisLine={false} tickLine={false} width={150} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v} คำร้อง`, "จำนวน"]} />
                <Bar dataKey="count" fill={SERIES_A} radius={[0, 4, 4, 0]} isAnimationActive={anim} animationDuration={800} label={{ position: "right", fill: MUTED, fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="แยกตามประเภท">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categories} margin={{ top: 16, right: 4, bottom: 0, left: -24 }} barCategoryGap="24%">
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} height={44} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v} คำร้อง`, "จำนวน"]} />
                <Bar dataKey="count" fill={SERIES_A} radius={[4, 4, 0, 0]} isAnimationActive={anim} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="ภาระงานช่าง" subtitle="งานค้างตอนนี้ และงานที่ซ่อมเสร็จในช่วงนี้">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.technicians} margin={{ top: 16, right: 4, bottom: 0, left: -24 }} barGap={2} barCategoryGap="28%">
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} tickFormatter={(n: string) => n.split(" ")[0]} />
                <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, color: INK }} />
                <Bar dataKey="open" name="งานค้าง" fill={SERIES_A} radius={[4, 4, 0, 0]} isAnimationActive={anim} animationDuration={800} />
                <Bar dataKey="completed" name="ซ่อมเสร็จ" fill={SERIES_B} radius={[4, 4, 0, 0]} isAnimationActive={anim} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-3">
        <Card title="งานด่วนมากที่ค้างนานที่สุด" subtitle="แตะเพื่อจัดการ" className="xl:col-span-2">
          {data.oldestUrgent.length ? (
            <ul className="-mx-2">
              {data.oldestUrgent.map((r, i) => (
                <motion.li key={r.code} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <button type="button" onClick={() => setOpen(r.code)} className="flex min-h-14 w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left hover:bg-page">
                    <CategoryIcon name={r.category_icon} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">
                        <span className="tabular-nums">{r.code}</span> · {r.category_name}
                      </p>
                      <p className="truncate text-[13px] text-muted">
                        {r.building_name} · ชั้น {r.floor} · {r.room_name}
                      </p>
                    </div>
                    <StatusPill status={r.status} />
                    <span className="hidden w-24 shrink-0 text-right text-[13px] font-semibold text-red-ink sm:block" suppressHydrationWarning>
                      {relativeTime(r.created_at)}
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">ไม่มีงานด่วนค้าง เยี่ยมมาก</p>
          )}
          <Link href="/admin/requests?status=open&urgency=urgent" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
            ดูงานด่วนทั้งหมด
          </Link>
        </Card>

        <Card title="เครื่องมือสำหรับการสาธิต" subtitle="ใช้ระหว่างนำเสนอเท่านั้น">
          <p className="text-sm text-muted">ทำให้คำร้องที่ “ซ่อมเสร็จ รอยืนยัน” เลยกำหนด 3 วัน เพื่อให้ระบบปิดงานอัตโนมัติ</p>
          <Button
            variant="soft"
            block
            className="mt-3"
            loading={simulating}
            onClick={() =>
              startSim(async () => {
                const res = await simulateAutoClose();
                setSimMsg(res.ok ? (res.closed ? `ปิดงานอัตโนมัติแล้ว ${res.closed} รายการ` : "ไม่มีคำร้องที่รอยืนยัน") : res.error);
                router.refresh();
              })
            }
          >
            <FlaskConical size={17} aria-hidden />
            จำลองเวลาผ่านไป 3 วัน
          </Button>
          {simMsg ? (
            <p role="status" className="mt-2 text-sm font-medium text-green-ink">
              {simMsg}
            </p>
          ) : null}
        </Card>
      </div>

      <RequestPanel code={open} onClose={() => setOpen(null)} />
    </div>
  );
}
