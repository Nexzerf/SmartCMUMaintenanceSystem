import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "@/lib/db";
import { ROLE_HOME, type Role } from "@/lib/status";
import { SESSION_COOKIE, verifySession } from "./session";

export type CurrentUser = {
  id: string;
  username: string;
  role: Role;
  full_name: string;
  user_type: "student" | "staff" | null;
  faculty: string | null;
  phone: string | null;
  profile_completed: boolean;
  pdpa_accepted_at: Date | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const [user] = await sql<CurrentUser[]>`
    select id, username, role, full_name, user_type, faculty, phone, profile_completed, pdpa_accepted_at
    from users where id = ${session.uid} and is_active`;
  return user ?? null;
});

/** For pages: redirects to /login, to the user's own home on role mismatch, and to profile setup when needed. */
export async function requirePageUser(role?: Role, opts: { allowIncompleteProfile?: boolean } = {}) {
  const user = await getCurrentUser();
  // A valid cookie for a missing/deactivated user would bounce between /login and home; clear it instead.
  if (!user) redirect("/logout");
  if (role && user.role !== role) redirect(ROLE_HOME[user.role]);
  if (user.role === "reporter" && !user.profile_completed && !opts.allowIncompleteProfile) redirect("/profile/setup");
  return user;
}

export class AuthError extends Error {}

/** For Server Actions and route handlers: throws instead of redirecting. */
export async function requireActionUser(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
  if (roles.length && !roles.includes(user.role)) throw new AuthError("คุณไม่มีสิทธิ์ทำรายการนี้");
  return user;
}
