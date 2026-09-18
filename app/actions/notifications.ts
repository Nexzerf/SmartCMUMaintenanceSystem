"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActionUser } from "@/lib/auth/guard";
import { sql } from "@/lib/db";
import { listNotifications } from "@/lib/requests/queries";

export async function fetchNotifications() {
  const user = await requireActionUser();
  const items = await listNotifications(user.id, 40);
  return items.map((n) => ({ ...n, created_at: n.created_at.toISOString(), read_at: n.read_at?.toISOString() ?? null }));
}

export async function markNotificationRead(id: string) {
  const user = await requireActionUser();
  if (!z.string().uuid().safeParse(id).success) return;
  await sql`update notifications set read_at = now() where id = ${id} and user_id = ${user.id} and read_at is null`;
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const user = await requireActionUser();
  await sql`update notifications set read_at = now() where user_id = ${user.id} and read_at is null`;
  revalidatePath("/", "layout");
}
