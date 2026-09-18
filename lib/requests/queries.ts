import "server-only";
import { unstable_cache } from "next/cache";
import { facultyOf } from "@/db/locations";
import { runQueries, sql } from "@/lib/db";
import { CATALOG_TAG } from "@/lib/cache-tags";
import { ADMIN_LIST_LIMIT } from "@/lib/limits";
import type { CurrentUser } from "@/lib/auth/guard";
import type { Status, Urgency } from "@/lib/status";

export type RequestListItem = {
  id: string;
  code: string;
  status: Status;
  urgency: Urgency;
  description: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  campus_name: string;
  building_id: number;
  building_name: string;
  floor: number;
  room_id: number;
  room_name: string;
  landmark: string | null;
  reporter_id: string;
  reporter_name: string;
  technician_id: string | null;
  technician_name: string | null;
  merged_into_code: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  closed_at: Date | null;
  is_following: boolean;
  thumb: string | null;
};

const LIST_COLUMNS = (viewerId: string | null) => sql`
  r.id, r.code, r.status, r.urgency, r.description, r.landmark, r.created_at, r.updated_at, r.completed_at, r.closed_at,
  c.id as category_id, c.name_th as category_name, c.icon as category_icon,
  cp.name_th as campus_name, b.id as building_id, b.name_th as building_name, rm.floor, rm.id as room_id, rm.name_th as room_name,
  r.reporter_id, rep.full_name as reporter_name,
  r.assigned_technician_id as technician_id, tech.full_name as technician_name,
  merged.code as merged_into_code,
  ${viewerId ? sql`exists(select 1 from request_followers f where f.request_id = r.id and f.user_id = ${viewerId})` : sql`false`} as is_following,
  (select url from request_images i where i.request_id = r.id and i.kind = 'before' order by i.created_at limit 1) as thumb
`;

// A function, not a shared value: one fragment object reused by queries that run at the same
// time corrupts postgres.js parameter state and can leave a connection waiting forever.
const LIST_JOINS = () => sql`
  from requests r
  join categories c on c.id = r.category_id
  join rooms rm on rm.id = r.room_id
  join buildings b on b.id = rm.building_id
  join campuses cp on cp.id = b.campus_id
  join users rep on rep.id = r.reporter_id
  left join users tech on tech.id = r.assigned_technician_id
  left join requests merged on merged.id = r.merged_into_id
`;

export async function listReporterRequests(userId: string) {
  const rows = await sql<RequestListItem[]>`
    select ${LIST_COLUMNS(userId)} ${LIST_JOINS()}
    where r.reporter_id = ${userId}
       or exists(select 1 from request_followers f where f.request_id = r.id and f.user_id = ${userId})
    order by r.updated_at desc`;
  // Followed requests belong to someone else: do not send that person's name to this reporter's browser.
  return rows.map((r) => (r.reporter_id === userId ? r : { ...r, reporter_name: FOLLOWED_REPORTER_NAME }));
}

/** Shown instead of the original reporter's name to people who only follow a request (PDPA). */
const FOLLOWED_REPORTER_NAME = "ผู้แจ้ง";

export async function listTechnicianJobs(techId: string) {
  return sql<RequestListItem[]>`
    select ${LIST_COLUMNS(null)} ${LIST_JOINS()}
    where r.assigned_technician_id = ${techId} and r.status in ('assigned', 'in_progress', 'waiting_parts', 'completed', 'closed')
    order by case r.urgency when 'urgent' then 0 when 'normal' then 1 else 2 end, r.created_at asc`;
}

export type AdminFilters = {
  status?: string;
  category?: number;
  campus?: number;
  building?: number;
  urgency?: string;
  from?: string;
  to?: string;
  q?: string;
};

export type AdminRequestRow = Pick<
  RequestListItem,
  "id" | "code" | "status" | "urgency" | "created_at" | "category_name" | "category_icon" | "building_name" | "floor" | "room_name" | "reporter_name" | "technician_name" | "merged_into_code"
>;

export async function listAdminRequests(f: AdminFilters) {
  const conds = [sql`true`];
  if (f.status === "open") conds.push(sql`r.status in ('pending','accepted','assigned','in_progress','waiting_parts','need_info','completed')`);
  else if (f.status) conds.push(sql`r.status = ${f.status}`);
  if (f.category) conds.push(sql`r.category_id = ${f.category}`);
  if (f.campus) conds.push(sql`cp.id = ${f.campus}`);
  if (f.building) conds.push(sql`b.id = ${f.building}`);
  if (f.urgency) conds.push(sql`r.urgency = ${f.urgency}`);
  if (f.from) conds.push(sql`r.created_at >= ${new Date(f.from + "T00:00:00+07:00")}`);
  if (f.to) conds.push(sql`r.created_at < ${new Date(new Date(f.to + "T00:00:00+07:00").getTime() + 86400000)}`);
  if (f.q) conds.push(sql`r.code ilike ${"%" + f.q.trim() + "%"}`);
  const where = conds.reduce((acc, c) => sql`${acc} and ${c}`);
  // Only the columns the table shows: no per-row image lookup, no follower check.
  return sql<AdminRequestRow[]>`
    select r.id, r.code, r.status, r.urgency, r.created_at,
      c.name_th as category_name, c.icon as category_icon,
      b.name_th as building_name, rm.floor, rm.name_th as room_name,
      rep.full_name as reporter_name, tech.full_name as technician_name, merged.code as merged_into_code
    from requests r
    join categories c on c.id = r.category_id
    join rooms rm on rm.id = r.room_id
    join buildings b on b.id = rm.building_id
    join campuses cp on cp.id = b.campus_id
    join users rep on rep.id = r.reporter_id
    left join users tech on tech.id = r.assigned_technician_id
    left join requests merged on merged.id = r.merged_into_id
    where ${where}
    order by r.created_at desc
    limit ${ADMIN_LIST_LIMIT}`;
}

export type RequestDetail = RequestListItem & {
  reporter_phone: string | null;
  reporter_faculty: string | null;
  reject_reason: string | null;
  status_before_info: Status | null;
  reopen_count: number;
  images: { id: string; url: string; kind: "before" | "after" }[];
  history: { id: string; from_status: Status | null; to_status: Status; note: string | null; actor_name: string | null; created_at: Date }[];
  repair_notes: { cause: string; parts_used: string | null; technician_name: string | null; created_at: Date }[];
  info_requests: { id: string; question: string; answer: string | null; answered_at: Date | null; created_at: Date }[];
  rating: { score: number; comment: string | null } | null;
  follower_count: number;
  can_view_phone: boolean;
};

/** Loads a request if the user may see it: reporter (own or followed), assigned technician, or admin. */
export async function getRequestForUser(code: string, user: CurrentUser): Promise<RequestDetail | null> {
  const [base] = await sql<(RequestListItem & { reporter_phone: string | null; reporter_faculty: string | null; reject_reason: string | null; status_before_info: Status | null; reopen_count: number })[]>`
    select ${LIST_COLUMNS(user.id)}, rep.phone as reporter_phone, rep.faculty as reporter_faculty,
      r.reject_reason, r.status_before_info, r.reopen_count
    ${LIST_JOINS()}
    where r.code = ${code}`;
  if (!base) return null;

  const allowed =
    user.role === "admin" ||
    (user.role === "reporter" && (base.reporter_id === user.id || base.is_following)) ||
    (user.role === "technician" && base.technician_id === user.id);
  if (!allowed) return null;
  // A follower sees the problem and its progress, not who reported it.
  const hideReporter = user.role === "reporter" && base.reporter_id !== user.id;

  const [images, history, notes, info, [rating], [{ count }]] = await runQueries([
    () => sql<RequestDetail["images"]>`select id, url, kind from request_images where request_id = ${base.id} order by created_at`,
    () => sql<RequestDetail["history"]>`
      select h.id, h.from_status, h.to_status, h.note,
        case when ${hideReporter} and h.actor_id = ${base.reporter_id} then ${FOLLOWED_REPORTER_NAME} else u.full_name end as actor_name,
        h.created_at
      from status_history h left join users u on u.id = h.actor_id
      where h.request_id = ${base.id} order by h.created_at, h.id`,
    () => sql<RequestDetail["repair_notes"]>`
      select n.cause, n.parts_used, u.full_name as technician_name, n.created_at
      from repair_notes n left join users u on u.id = n.technician_id
      where n.request_id = ${base.id} order by n.created_at desc`,
    () => sql<RequestDetail["info_requests"]>`select id, question, answer, answered_at, created_at from info_requests where request_id = ${base.id} order by created_at`,
    () => sql<{ score: number; comment: string | null }[]>`select score, comment from ratings where request_id = ${base.id}`,
    () => sql<{ count: number }[]>`select count(*)::int as count from request_followers where request_id = ${base.id}`,
  ]);

  const canViewPhone = user.role === "admin" || (user.role === "technician" && base.technician_id === user.id);
  return {
    ...base,
    reporter_name: hideReporter ? FOLLOWED_REPORTER_NAME : base.reporter_name,
    reporter_faculty: hideReporter ? null : base.reporter_faculty,
    reporter_phone: canViewPhone ? base.reporter_phone : null,
    images,
    history,
    repair_notes: notes,
    info_requests: info,
    rating: rating ?? null,
    follower_count: count,
    can_view_phone: canViewPhone,
  };
}

export async function findDuplicate(roomId: number, categoryId: number, excludeReporterId: string) {
  const [row] = await sql<RequestListItem[]>`
    select ${LIST_COLUMNS(excludeReporterId)} ${LIST_JOINS()}
    where r.room_id = ${roomId} and r.category_id = ${categoryId}
      and r.status not in ('closed', 'cancelled', 'rejected')
    order by r.created_at desc limit 1`;
  return row ?? null;
}

export type Catalog = {
  categories: { id: number; name_th: string; icon: string; is_active: boolean }[];
  campuses: { id: number; name_th: string }[];
  buildings: { id: number; campus_id: number; name_th: string; faculty_th: string | null }[];
  rooms: { id: number; building_id: number; floor: number; name_th: string }[];
};

async function loadCatalog(includeInactive: boolean): Promise<Catalog> {
  const [categories, campuses, buildings, rooms] = await runQueries([
    () => sql<Catalog["categories"]>`select id, name_th, icon, is_active from categories ${includeInactive ? sql`` : sql`where is_active`} order by sort_order, id`,
    () => sql<Catalog["campuses"]>`select id, name_th from campuses order by id`,
    () =>
      sql<Catalog["buildings"]>`select id, campus_id, name_th, faculty_th from buildings order by name_th`.catch((err: { code?: string }) => {
        // Database not migrated yet (no faculty_th column): keep working, every building lands in "อื่น ๆ".
        if (err?.code !== "42703") throw err;
        return sql<Catalog["buildings"]>`select id, campus_id, name_th, null::text as faculty_th from buildings order by name_th`;
      }),
    () => sql<Catalog["rooms"]>`select id, building_id, floor, name_th from rooms order by floor, name_th`,
  ]);
  // A building without a stored faculty (database not synced yet, or added by an admin without one)
  // is grouped by the same rules as db/locations.ts, so the faculty step never collapses into one list.
  const grouped = buildings.map((b) => ({ ...b, faculty_th: b.faculty_th || facultyOf(b.name_th) }));
  return { categories, campuses, buildings: grouped, rooms };
}

/** Master data changes rarely, so the reporter form does not pay for four queries on every load. */
// The key carries a version: Vercel's data cache survives deployments, and entries cached before
// buildings had a faculty would otherwise be served for up to 10 more minutes.
const cachedCatalog = unstable_cache(() => loadCatalog(false), ["catalog-active-v2"], { tags: [CATALOG_TAG], revalidate: 600 });

export async function getCatalog(includeInactive = false): Promise<Catalog> {
  return includeInactive ? loadCatalog(true) : cachedCatalog();
}

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: Date | null;
  created_at: Date;
  request_code: string | null;
};

export async function listNotifications(userId: string, limit = 50) {
  return sql<NotificationItem[]>`
    select n.id, n.type, n.title, n.body, n.read_at, n.created_at, r.code as request_code
    from notifications n left join requests r on r.id = n.request_id
    where n.user_id = ${userId}
    order by n.created_at desc limit ${limit}`;
}

export async function unreadCount(userId: string) {
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from notifications where user_id = ${userId} and read_at is null`;
  return count;
}

export async function pendingCount() {
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from requests where status = 'pending'`;
  return count;
}

export type TechnicianOption = {
  id: string;
  full_name: string;
  skills: string[];
  matches: boolean;
  open_jobs: number;
};

/** Technicians ranked for a request: skill match first, then fewest open jobs. */
export async function technicianOptions(categoryId: number) {
  return sql<TechnicianOption[]>`
    select u.id, u.full_name,
      coalesce(array_agg(c.name_th order by c.sort_order) filter (where c.id is not null), '{}') as skills,
      bool_or(c.id = ${categoryId}) is true as matches,
      (select count(*)::int from requests r where r.assigned_technician_id = u.id and r.status in ('assigned','in_progress','waiting_parts')) as open_jobs
    from users u
    left join technician_skills ts on ts.technician_id = u.id
    left join categories c on c.id = ts.category_id
    where u.role = 'technician' and u.is_active
    group by u.id
    order by matches desc, open_jobs asc, u.full_name`;
}
