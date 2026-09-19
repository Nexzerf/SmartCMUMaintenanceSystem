"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActionUser } from "@/lib/auth/guard";
import { actionError as fail, type ActionResult } from "@/lib/actions/result";
import { sql } from "@/lib/db";
import { findDuplicate } from "@/lib/requests/queries";
import { notify, pingUsers, transitionStatus } from "@/lib/requests/transition";
import { serialize } from "@/lib/serialize";
import { isOwnImageUrl } from "@/lib/storage";

function yymmBangkok(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "2-digit", month: "2-digit" }).formatToParts(d);
  return parts.find((p) => p.type === "year")!.value + parts.find((p) => p.type === "month")!.value;
}

const createSchema = z.object({
  categoryId: z.number().int().positive({ message: "กรุณาเลือกประเภทปัญหา" }),
  urgency: z.enum(["low", "normal", "urgent"], { message: "กรุณาเลือกความเร่งด่วน" }),
  roomId: z.number().int().positive({ message: "กรุณาเลือกห้องหรือจุดที่พบปัญหา" }),
  landmark: z.string().trim().max(200, "จุดสังเกตยาวเกิน 200 ตัวอักษร").optional(),
  description: z.string().trim().min(10, "อธิบายปัญหาอย่างน้อย 10 ตัวอักษร").max(1000, "รายละเอียดยาวเกิน 1,000 ตัวอักษร"),
  images: z
    .array(z.string().refine(isOwnImageUrl, "รูปภาพไม่ถูกต้อง กรุณาอัปโหลดใหม่"))
    .min(1, "กรุณาแนบรูปอย่างน้อย 1 รูป")
    .max(3, "แนบรูปได้สูงสุด 3 รูป"),
});

export async function createRequest(input: z.input<typeof createSchema>): Promise<ActionResult<{ code: string }>> {
  try {
    const user = await requireActionUser("reporter");
    const data = createSchema.parse(input);

    const [cat] = await sql`select id from categories where id = ${data.categoryId} and is_active`;
    if (!cat) return { ok: false, error: "ประเภทปัญหานี้ปิดใช้งานแล้ว กรุณาเลือกประเภทใหม่" };
    const [room] = await sql`select id from rooms where id = ${data.roomId}`;
    if (!room) return { ok: false, error: "ไม่พบห้องที่เลือก กรุณาเลือกสถานที่ใหม่" };

    const code = await sql.begin(async (tx) => {
      const yymm = yymmBangkok();
      const [{ last_value }] = await tx<{ last_value: number }[]>`
        insert into request_code_counters (yymm, last_value) values (${yymm}, 1)
        on conflict (yymm) do update set last_value = request_code_counters.last_value + 1
        returning last_value`;
      const code = `MR-${yymm}-${String(last_value).padStart(4, "0")}`;
      const [req] = await tx<{ id: string }[]>`
        insert into requests (code, reporter_id, category_id, room_id, landmark, description, urgency, status)
        values (${code}, ${user.id}, ${data.categoryId}, ${data.roomId}, ${data.landmark || null}, ${data.description}, ${data.urgency}, 'pending')
        returning id`;
      for (const url of data.images) {
        await tx`insert into request_images (request_id, url, kind) values (${req.id}, ${url}, 'before')`;
      }
      await tx`insert into status_history (request_id, from_status, to_status, actor_id) values (${req.id}, null, 'pending', ${user.id})`;
      await notify(tx, [user.id], req.id, "submitted", "ส่งคำร้องแล้ว", `เราได้รับคำร้อง ${code} แล้ว จะแจ้งให้ทราบเมื่อมีความคืบหน้า`);
      return code;
    });

    await pingUsers([user.id]);
    revalidatePath("/home");
    return { ok: true, code };
  } catch (err) {
    return fail(err);
  }
}

const positiveInt = z.number().int().positive();
const uuid = z.guid();

export async function checkDuplicate(roomId: number, categoryId: number) {
  const user = await requireActionUser("reporter");
  const room = positiveInt.safeParse(roomId);
  const category = positiveInt.safeParse(categoryId);
  if (!room.success || !category.success) return null;
  const dup = await findDuplicate(room.data, category.data, user.id);
  if (!dup) return null;
  return serialize({
    id: dup.id,
    code: dup.code,
    status: dup.status,
    description: dup.description,
    created_at: dup.created_at,
    category_name: dup.category_name,
    category_icon: dup.category_icon,
    building_name: dup.building_name,
    floor: dup.floor,
    room_name: dup.room_name,
    is_own: dup.reporter_id === user.id,
    is_following: dup.is_following,
    thumb: dup.thumb,
  });
}

export async function followRequest(requestId: string): Promise<ActionResult<{ code: string }>> {
  try {
    const user = await requireActionUser("reporter");
    requestId = uuid.parse(requestId);
    const [req] = await sql<{ code: string; status: string }[]>`select code, status from requests where id = ${requestId}`;
    if (!req) return { ok: false, error: "ไม่พบคำร้องนี้" };
    if (["closed", "cancelled", "rejected"].includes(req.status)) return { ok: false, error: "คำร้องนี้ปิดไปแล้ว กรุณาแจ้งใหม่" };
    await sql`insert into request_followers (request_id, user_id) values (${requestId}, ${user.id}) on conflict do nothing`;
    await sql`insert into notifications (user_id, request_id, type, title, body)
      values (${user.id}, ${requestId}, 'following', 'ติดตามคำร้องแล้ว', ${`คุณจะได้รับแจ้งเตือนเมื่อ ${req.code} มีความคืบหน้า`})`;
    await pingUsers([user.id]);
    return { ok: true, code: req.code };
  } catch (err) {
    return fail(err);
  }
}

export async function cancelRequest(requestId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("reporter");
    await transitionStatus({ requestId: uuid.parse(requestId), to: "cancelled", actor: { id: user.id, role: "reporter" }, note: "ผู้แจ้งยกเลิกคำร้อง" });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

const answerSchema = z.object({
  requestId: z.guid(),
  answer: z.string().trim().min(2, "กรุณาพิมพ์คำตอบ").max(1000),
});

export async function answerInfoRequest(input: z.input<typeof answerSchema>): Promise<ActionResult> {
  try {
    const user = await requireActionUser("reporter");
    const data = answerSchema.parse(input);
    const [req] = await sql<{ status_before_info: string | null; reporter_id: string }[]>`
      select status_before_info, reporter_id from requests where id = ${data.requestId}`;
    if (!req || req.reporter_id !== user.id) return { ok: false, error: "คุณไม่มีสิทธิ์ตอบคำถามนี้" };
    const back = (req.status_before_info ?? "pending") as "pending" | "accepted";
    await transitionStatus({ requestId: data.requestId, to: back, actor: { id: user.id, role: "reporter" }, note: `ผู้แจ้งตอบ: ${data.answer}` }, async (tx) => {
      await tx`update info_requests set answer = ${data.answer}, answered_at = now()
        where id = (select id from info_requests where request_id = ${data.requestId} and answer is null order by created_at desc limit 1)`;
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

const confirmSchema = z.object({
  requestId: z.guid(),
  score: z.number().int().min(1, "กรุณาให้คะแนน 1-5 ดาว").max(5),
  comment: z.string().trim().max(500).optional(),
});

export async function confirmCompletion(input: z.input<typeof confirmSchema>): Promise<ActionResult> {
  try {
    const user = await requireActionUser("reporter");
    const data = confirmSchema.parse(input);
    await transitionStatus({ requestId: data.requestId, to: "closed", actor: { id: user.id, role: "reporter" }, note: "ผู้แจ้งยืนยันว่าซ่อมเสร็จ" }, async (tx) => {
      await tx`insert into ratings (request_id, score, comment) values (${data.requestId}, ${data.score}, ${data.comment || null})
        on conflict (request_id) do update set score = excluded.score, comment = excluded.comment, created_at = now()`;
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

const reopenSchema = z.object({
  requestId: z.guid(),
  reason: z.string().trim().min(5, "บอกอาการที่ยังพบสั้น ๆ อย่างน้อย 5 ตัวอักษร").max(500),
});

export async function reopenRequest(input: z.input<typeof reopenSchema>): Promise<ActionResult> {
  try {
    const user = await requireActionUser("reporter");
    const data = reopenSchema.parse(input);
    await transitionStatus({ requestId: data.requestId, to: "reopened", actor: { id: user.id, role: "reporter" }, note: data.reason });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

