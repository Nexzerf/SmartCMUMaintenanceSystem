import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Polling fallback for live updates when Supabase Realtime is not configured.
 * Returns a version string that changes whenever something the user can see changes.
 * This route is excluded from the idle-timeout refresh in middleware.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [row] =
    user.role === "admin"
      ? await sql`select (select max(updated_at) from requests) as r, (select count(*)::int from requests) as n,
          (select max(created_at) from notifications where user_id = ${user.id}) as notif`
      : user.role === "technician"
        ? await sql`select (select max(updated_at) from requests where assigned_technician_id = ${user.id}
              or id in (select request_id from notifications where user_id = ${user.id})) as r, 0 as n,
            (select max(created_at) from notifications where user_id = ${user.id}) as notif`
        : await sql`select (select max(updated_at) from requests where reporter_id = ${user.id}
              or id in (select request_id from request_followers where user_id = ${user.id})) as r, 0 as n,
            (select max(created_at) from notifications where user_id = ${user.id}) as notif`;

  const version = [row.r ? new Date(row.r).getTime() : 0, row.n, row.notif ? new Date(row.notif).getTime() : 0].join(":");
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
