import "server-only";
import { runQueries, sql } from "@/lib/db";
import type { Status, Urgency } from "@/lib/status";

export type RangeKey = "7d" | "30d" | "month" | "custom";
export type DashboardRange = { key: RangeKey; from: string; to: string; label: string };

const TZ_OFFSET = "+07:00";

function bangkokDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d); // YYYY-MM-DD
}
function addDays(ymd: string, days: number) {
  const d = new Date(`${ymd}T00:00:00${TZ_OFFSET}`);
  d.setUTCDate(d.getUTCDate() + days);
  return bangkokDate(d);
}

/** Resolve a range to inclusive Bangkok calendar dates. */
export function resolveRange(params: { range?: string; from?: string; to?: string }): DashboardRange {
  const today = bangkokDate();
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (params.range === "custom" && params.from && params.to && re.test(params.from) && re.test(params.to) && params.from <= params.to) {
    return { key: "custom", from: params.from, to: params.to, label: `${params.from} ถึง ${params.to}` };
  }
  if (params.range === "month") return { key: "month", from: `${today.slice(0, 8)}01`, to: today, label: "เดือนนี้" };
  if (params.range === "7d") return { key: "7d", from: addDays(today, -6), to: today, label: "7 วันล่าสุด" };
  return { key: "30d", from: addDays(today, -29), to: today, label: "30 วันล่าสุด" };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

export async function getDashboard(range: DashboardRange, opts: { includeRows?: boolean } = {}) {
  const start = new Date(`${range.from}T00:00:00${TZ_OFFSET}`);
  const end = new Date(new Date(`${range.to}T00:00:00${TZ_OFFSET}`).getTime() + 86_400_000);
  // Fresh fragments per query: postgres.js fragments carry parameter state, and sharing one
  // across queries that run in parallel makes each of them much slower.
  const inRange = () => sql`r.created_at >= ${start} and r.created_at < ${end} and r.merged_into_id is null`;
  const openList = () => sql`('pending','accepted','assigned','in_progress','waiting_parts','need_info','completed')`;

  const t0 = Date.now();
  const [[kpi], [closeTime], [rating], daily, byStatus, buildings, categories, technicians, oldestUrgent, rows] = await runQueries([
    () => sql<{ total: number; open: number; urgent_open: number }[]>`
      select count(*)::int as total,
        count(*) filter (where r.status in ${openList()})::int as open,
        count(*) filter (where r.status in ${openList()} and r.urgency = 'urgent')::int as urgent_open
      from requests r where ${inRange()}`,
    () => sql<{ hours: number | null; n: number }[]>`
      select round((avg(extract(epoch from (r.closed_at - r.created_at))) / 3600)::numeric, 1)::float as hours, count(*)::int as n
      from requests r where r.status = 'closed' and r.closed_at >= ${start} and r.closed_at < ${end}`,
    () => sql<{ score: number | null; n: number }[]>`
      select round(avg(score)::numeric, 2)::float as score, count(*)::int as n from ratings where created_at >= ${start} and created_at < ${end}`,
    () => sql<{ day: string; count: number }[]>`
      select to_char(r.created_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD') as day, count(*)::int as count
      from requests r where ${inRange()} group by 1 order by 1`,
    () => sql<{ status: Status; count: number }[]>`
      select r.status, count(*)::int as count from requests r where ${inRange()} group by r.status`,
    () => sql<{ name: string; count: number }[]>`
      select b.name_th as name, count(*)::int as count
      from requests r join rooms rm on rm.id = r.room_id join buildings b on b.id = rm.building_id
      where ${inRange()} group by b.id, b.name_th order by count desc, b.name_th limit 5`,
    () => sql<{ name: string; icon: string; count: number }[]>`
      select c.name_th as name, c.icon, count(r.id)::int as count
      from categories c left join requests r on r.category_id = c.id and ${inRange()}
      group by c.id order by count desc, c.sort_order`,
    () => sql<{ name: string; open: number; completed: number }[]>`
      select u.full_name as name,
        (select count(*)::int from requests r where r.assigned_technician_id = u.id and r.status in ('assigned','in_progress','waiting_parts')) as open,
        (select count(distinct n.request_id)::int from repair_notes n where n.technician_id = u.id and n.created_at >= ${start} and n.created_at < ${end}) as completed
      from users u where u.role = 'technician' and u.is_active order by u.full_name`,
    () => sql<{ code: string; category_name: string; category_icon: string; building_name: string; room_name: string; floor: number; status: Status; urgency: Urgency; created_at: Date }[]>`
      select r.code, c.name_th as category_name, c.icon as category_icon, b.name_th as building_name, rm.name_th as room_name, rm.floor,
        r.status, r.urgency, r.created_at
      from requests r join categories c on c.id = r.category_id join rooms rm on rm.id = r.room_id join buildings b on b.id = rm.building_id
      where r.urgency = 'urgent' and r.status in ('pending','accepted','assigned','in_progress','waiting_parts','need_info')
      order by r.created_at asc limit 5`,
    async () =>
      opts.includeRows
        ? await sql<{ code: string; created_at: Date; status: Status; urgency: Urgency; category: string; campus: string; building: string; floor: number; room: string; reporter: string; technician: string | null; closed_at: Date | null; score: number | null }[]>`
      select r.code, r.created_at, r.status, r.urgency, c.name_th as category, cp.name_th as campus, b.name_th as building, rm.floor,
        rm.name_th as room, rep.full_name as reporter, t.full_name as technician, r.closed_at, rt.score
      from requests r join categories c on c.id = r.category_id join rooms rm on rm.id = r.room_id
      join buildings b on b.id = rm.building_id join campuses cp on cp.id = b.campus_id
      join users rep on rep.id = r.reporter_id left join users t on t.id = r.assigned_technician_id
      left join ratings rt on rt.request_id = r.id
      where ${inRange()} order by r.created_at`
      : [],
  ]);

  console.log(`[perf] dashboard.queries ${Date.now() - t0}ms`);

  // Fill missing days with zero so the line is continuous.
  const counts = new Map(daily.map((d) => [d.day, d.count]));
  const series: { day: string; count: number }[] = [];
  for (let d = range.from; d <= range.to; d = addDays(d, 1)) series.push({ day: d, count: counts.get(d) ?? 0 });

  return {
    range,
    kpi: {
      total: kpi.total,
      open: kpi.open,
      urgentOpen: kpi.urgent_open,
      avgCloseHours: closeTime.hours,
      closedCount: closeTime.n,
      avgRating: rating.score,
      ratingCount: rating.n,
    },
    series,
    byStatus,
    buildings,
    categories,
    technicians,
    oldestUrgent,
    rows,
  };
}
