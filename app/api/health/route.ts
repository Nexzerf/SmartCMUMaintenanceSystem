import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deployment check: which settings are present and whether the database answers.
 * Reports booleans and counts only — never values, hosts, or keys.
 */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    SESSION_SECRET_present: !!process.env.SESSION_SECRET,
    SESSION_SECRET_long_enough: (process.env.SESSION_SECRET ?? "").length >= 32,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: !!process.env.SUPABASE_STORAGE_BUCKET,
  };

  let database: Record<string, unknown> = { ok: false };
  let connection: Record<string, unknown> = {};
  try {
    // Report the role and its search_path even when the tables are not visible:
    // that is what explains "relation does not exist".
    const [who] = await sql<{ db_user: string; search_path: string }[]>`
      select current_user as db_user, current_setting('search_path') as search_path`;
    connection = { ...who };
    const schemas = await sql<{ nspname: string }[]>`
      select nspname from pg_namespace where nspname in ('SmartCMU', 'public') order by nspname`;
    connection.schemas_visible = schemas.map((s) => s.nspname);
    const [row] = await sql<{ users: number; requests: number; bad_hashes: number }[]>`
      select (select count(*)::int from users) as users,
             (select count(*)::int from requests) as requests,
             (select count(*)::int from users where password_hash !~ '^\\$2[aby]\\$') as bad_hashes`;
    database = { ok: true, ...row };
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 200) : "unknown error";
    const hint = message.includes("does not exist")
      ? "The database user cannot see the app tables. Put the smartcmu_app connection string in DATABASE_URL."
      : undefined;
    database = { ok: false, error: message, hint };
  }
  database = { ...database, ...connection };

  const ready = Object.values(env).every(Boolean) && database.ok === true && database.bad_hashes === 0;
  return NextResponse.json({ ready, env, database }, { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
