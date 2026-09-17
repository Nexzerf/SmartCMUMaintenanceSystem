"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, type ActionResult } from "@/lib/actions/result";
import { requireActionUser } from "@/lib/auth/guard";
import { sql } from "@/lib/db";

const name = (label: string) => z.string().trim().min(1, `กรุณากรอก${label}`).max(120, `${label}ยาวเกินไป`);
const optId = z.number().int().positive().optional();

function ok() {
  revalidatePath("/admin/settings");
  revalidatePath("/request/new");
  return { ok: true as const };
}

async function guard() {
  await requireActionUser("admin");
}

// ----- Categories -----

const categorySchema = z.object({ id: optId, name_th: name("ชื่อประเภท"), icon: z.string().min(1).max(40), is_active: z.boolean() });

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  try {
    await guard();
    const d = categorySchema.parse(input);
    if (d.id) await sql`update categories set name_th = ${d.name_th}, icon = ${d.icon}, is_active = ${d.is_active} where id = ${d.id}`;
    else await sql`insert into categories (name_th, icon, is_active, sort_order) values (${d.name_th}, ${d.icon}, ${d.is_active}, (select coalesce(max(sort_order), 0) + 1 from categories))`;
    return ok();
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  try {
    await guard();
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from requests where category_id = ${id}`;
    if (n > 0) return { ok: false, error: `ประเภทนี้มีคำร้องอยู่ ${n} รายการ จึงลบไม่ได้ ให้ปิดการใช้งานแทน` };
    await sql`delete from categories where id = ${id}`;
    return ok();
  } catch (err) {
    return actionError(err);
  }
}

// ----- Locations -----

export async function saveCampus(input: { id?: number; name_th: string }): Promise<ActionResult> {
  try {
    await guard();
    const d = z.object({ id: optId, name_th: name("ชื่อวิทยาเขต") }).parse(input);
    if (d.id) await sql`update campuses set name_th = ${d.name_th} where id = ${d.id}`;
    else await sql`insert into campuses (name_th) values (${d.name_th})`;
    return ok();
  } catch (err) {
    return actionError(err);
  }
}

export async function saveBuilding(input: { id?: number; campus_id: number; name_th: string }): Promise<ActionResult> {
  try {
    await guard();
    const d = z.object({ id: optId, campus_id: z.number().int().positive(), name_th: name("ชื่ออาคาร") }).parse(input);
    if (d.id) await sql`update buildings set name_th = ${d.name_th}, campus_id = ${d.campus_id} where id = ${d.id}`;
    else await sql`insert into buildings (campus_id, name_th) values (${d.campus_id}, ${d.name_th})`;
    return ok();
  } catch (err) {
    return actionError(err);
  }
}

export async function saveRoom(input: { id?: number; building_id: number; floor: number; name_th: string }): Promise<ActionResult> {
  try {
    await guard();
    const d = z
      .object({ id: optId, building_id: z.number().int().positive(), floor: z.number({ message: "กรุณากรอกชั้นเป็นตัวเลข" }).int("ชั้นต้องเป็นจำนวนเต็ม").min(-5).max(60), name_th: name("ชื่อห้อง") })
      .parse(input);
    if (d.id) await sql`update rooms set name_th = ${d.name_th}, floor = ${d.floor}, building_id = ${d.building_id} where id = ${d.id}`;
    else await sql`insert into rooms (building_id, floor, name_th) values (${d.building_id}, ${d.floor}, ${d.name_th})`;
    return ok();
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteLocation(kind: "campus" | "building" | "room", id: number): Promise<ActionResult> {
  try {
    await guard();
    const roomFilter =
      kind === "room"
        ? sql`r.room_id = ${id}`
        : kind === "building"
          ? sql`r.room_id in (select id from rooms where building_id = ${id})`
          : sql`r.room_id in (select rm.id from rooms rm join buildings b on b.id = rm.building_id where b.campus_id = ${id})`;
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from requests r where ${roomFilter}`;
    if (n > 0) return { ok: false, error: `มีคำร้องผูกกับสถานที่นี้ ${n} รายการ จึงลบไม่ได้ เพื่อรักษาประวัติการซ่อม` };
    if (kind === "room") await sql`delete from rooms where id = ${id}`;
    if (kind === "building") await sql`delete from buildings where id = ${id}`;
    if (kind === "campus") await sql`delete from campuses where id = ${id}`;
    return ok();
  } catch (err) {
    return actionError(err);
  }
}

// ----- Technicians -----

const techSchema = z.object({
  id: z.string().uuid().optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,40}$/, "Username ใช้ a-z, 0-9, จุด, ขีด ได้ 3-40 ตัวอักษร"),
  full_name: name("ชื่อ-นามสกุล"),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(0\d{8,9})?$/, "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก")),
  password: z.string().max(128).optional(),
  is_active: z.boolean(),
  skills: z.array(z.number().int().positive()),
});

export async function saveTechnician(input: z.input<typeof techSchema>): Promise<ActionResult> {
  try {
    await guard();
    const d = techSchema.parse(input);
    if (!d.id && (!d.password || d.password.length < 8)) return { ok: false, error: "ตั้งรหัสผ่านเริ่มต้นอย่างน้อย 8 ตัวอักษร" };
    if (d.password && d.password.length > 0 && d.password.length < 8) return { ok: false, error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };

    const [dup] = await sql`select id from users where username = ${d.username} and id is distinct from ${d.id ?? null}`;
    if (dup) return { ok: false, error: `Username "${d.username}" ถูกใช้แล้ว` };

    await sql.begin(async (tx) => {
      let techId = d.id;
      if (techId) {
        await tx`update users set username = ${d.username}, full_name = ${d.full_name}, phone = ${d.phone || null}, is_active = ${d.is_active}
          where id = ${techId} and role = 'technician'`;
        if (d.password) await tx`update users set password_hash = ${await bcrypt.hash(d.password, 10)} where id = ${techId}`;
      } else {
        const [row] = await tx<{ id: string }[]>`
          insert into users (username, password_hash, role, full_name, phone, profile_completed, is_active)
          values (${d.username}, ${await bcrypt.hash(d.password!, 10)}, 'technician', ${d.full_name}, ${d.phone || null}, true, ${d.is_active})
          returning id`;
        techId = row.id;
      }
      await tx`delete from technician_skills where technician_id = ${techId!}`;
      for (const c of d.skills) await tx`insert into technician_skills (technician_id, category_id) values (${techId!}, ${c})`;
    });
    return ok();
  } catch (err) {
    return actionError(err);
  }
}
