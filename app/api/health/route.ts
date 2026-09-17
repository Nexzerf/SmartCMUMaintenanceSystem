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
  try {
    const [row] = await sql<{ users: number; requests: number; bad_hashes: number }[]>`
      select (select count(*)::int from users) as users,
             (select count(*)::int from requests) as requests,
             (select count(*)::int from users where password_hash !~ '^\\$2[aby]\\$') as bad_hashes`;
    database = { ok: true, ...row };
  } catch (err) {
    database = { ok: false, error: err instanceof Error ? err.message.slice(0, 200) : "unknown error" };
  }

  const ready = Object.values(env).every(Boolean) && database.ok === true && database.bad_hashes === 0;
  return NextResponse.json({ ready, env, database }, { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
