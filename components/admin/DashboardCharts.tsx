"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "./Card";

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

export type ChartsProps = {
  series: { day: string; count: number }[];
  statusData: { status: string; label: string; count: number }[];
  buildings: { name: string; count: number }[];
  categories: { name: string; count: number }[];
  technicians: { name: string; open: number; completed: number }[];
  anim: boolean;
};

/** Charts live in their own chunk: the KPI row renders before this (and Recharts) arrives. */
export default function DashboardCharts({ series, statusData, buildings, categories, technicians, anim }: ChartsProps) {
  return (
    <>
      <Card title="จำนวนคำร้องรายวัน" subtitle="นับตามวันที่แจ้ง" className="xl:col-span-2">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="day" tickFormatter={shortDay} tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...tooltipStyle} cursor={{ stroke: "#C9C9CF", strokeWidth: 1 }} labelFormatter={(d) => shortDay(String(d))} formatter={(v) => [`${v} คำร้อง`, "จำนวน"]} />
              <Line
                type="linear"
                dataKey="count"
                stroke={SERIES_A}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive={anim}
                animationDuration={800}
                animationEasing="ease-out"
              />
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
            <BarChart data={buildings} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={8}>
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
            <BarChart data={categories} margin={{ top: 16, right: 4, bottom: 0, left: -24 }} barCategoryGap="24%">
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
            <BarChart data={technicians} margin={{ top: 16, right: 4, bottom: 0, left: -24 }} barGap={2} barCategoryGap="28%">
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
    </>
  );
}
