"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { ROLE_HOME, type Role } from "@/lib/status";

export type LoginState = { error?: string; username?: string };

const schema = z.object({
  username: z
    .string()
    .transform((v) => v.split("@")[0].trim().toLowerCase())
    .pipe(z.string().min(1, "กรุณากรอก Username").max(64)),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน").max(128),
});

// Compared against for unknown usernames so they take as long as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ username: formData.get("username") ?? "", password: formData.get("password") ?? "" });
  const username = String(formData.get("username") ?? "").split("@")[0];
  if (!parsed.success) return { error: parsed.error.issues[0].message, username };

  const [user] = await sql<{ id: string; username: string; role: Role; password_hash: string; profile_completed: boolean }[]>`
    select id, username, role, password_hash, profile_completed from users where username = ${parsed.data.username} and is_active`;
  // A stored value that is not a bcrypt hash (e.g. a password typed straight into the database)
  // makes bcrypt throw; treat that as a failed login instead of a server error.
  let ok = false;
  try {
    ok = await bcrypt.compare(parsed.data.password, user?.password_hash ?? DUMMY_HASH);
  } catch (err) {
    console.error(`[login] invalid password_hash for "${parsed.data.username}"`, err);
  }
  if (!user || !ok) return { error: "Username หรือรหัสผ่านไม่ถูกต้อง", username };

  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession({ uid: user.id, role: user.role, username: user.username }), sessionCookieOptions);

  if (user.role === "reporter" && !user.profile_completed) redirect("/profile/setup");
  redirect(ROLE_HOME[user.role]);
}

export async function logout(reason?: "idle") {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect(reason === "idle" ? "/login?expired=1" : "/login");
}
