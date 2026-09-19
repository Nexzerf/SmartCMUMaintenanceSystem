"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, type ActionResult } from "@/lib/actions/result";
import { requireActionUser } from "@/lib/auth/guard";
import { sql } from "@/lib/db";
import { getRequestForUser, technicianOptions } from "@/lib/requests/queries";
import { notify, pingUsers, runAutoClose, TransitionError, transitionStatus } from "@/lib/requests/transition";
import { serialize } from "@/lib/serialize";
import { AUTO_CLOSE_DAYS } from "@/lib/status";

const id = z.guid();
const admin = (userId: string) => ({ id: userId, role: "admin" as const });

function done() {
  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

export async function getRequestPanel(code: string) {
  const user = await requireActionUser("admin");
  const detail = await getRequestForUser(code, user);
  if (!detail) return null;
  const [technicians, mergeCandidates] = await Promise.all([
    technicianOptions(detail.category_id),
    sql<{ id: string; code: string; status: string; description: string; same_room: boolean; created_at: Date }[]>`
      select r.id, r.code, r.status, r.description, (r.room_id = ${detail.room_id}) as same_room, r.created_at
      from requests r
      where r.id <> ${detail.id} and r.merged_into_id is null
        and r.status not in ('closed', 'cancelled', 'rejected')
        and r.category_id = ${detail.category_id}
        and r.room_id in (select id from rooms where building_id = (select building_id from rooms where id = ${detail.room_id}))
      order by (r.room_id = ${detail.room_id}) desc, r.created_at asc
      limit 10`,
  ]);
  return serialize({ detail, technicians, mergeCandidates });
}

export async function acceptRequest(requestId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("admin");
    await transitionStatus({ requestId: id.parse(requestId), to: "accepted", actor: admin(user.id) });
    return done();
  } catch (err) {
    return actionError(err);
  }
}

export async function setUrgency(requestId: string, urgency: string): Promise<ActionResult> {
  try {
    await requireActionUser("admin");
    const u = z.enum(["low", "normal", "urgent"]).parse(urgency);
    const [row] = await sql<{ reporter_id: string; assigned_technician_id: string | null }[]>`
      update requests set urgency = ${u}, updated_at = now()
      where id = ${id.parse(requestId)} and status not in ('closed', 'cancelled', 'rejected')
      returning reporter_id, assigned_technician_id`;
    if (!row) return { ok: false, error: "เปลี่ยนความเร่งด่วนไม่ได้ คำร้องนี้ปิดไปแล้วหรือไม่พบคำร้อง" };
    await pingUsers([row.reporter_id, ...(row.assigned_technician_id ? [row.assigned_technician_id] : [])]);
    return done();
  } catch (err) {
    return actionError(err);
  }
}

export async function askForInfo(requestId: string, question: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("admin");
    const q = z.string().trim().min(5, "พิมพ์คำถามให้ชัดเจน อย่างน้อย 5 ตัวอักษร").max(500).parse(question);
    const rid = id.parse(requestId);
    await transitionStatus({ requestId: rid, to: "need_info", actor: admin(user.id), note: q }, async (tx) => {
      await tx`insert into info_requests (request_id, asked_by, question) values (${rid}, ${user.id}, ${q})`;
    });
    return done();
  } catch (err) {
    return actionError(err);
  }
}

export async function assignTechnician(requestId: string, technicianId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("admin");
    await transitionStatus({ requestId: id.parse(requestId), to: "assigned", actor: admin(user.id), assignTechnicianId: id.parse(technicianId) });
    return done();
  } catch (err) {
    return actionError(err);
  }
}

export async function rejectRequest(requestId: string, reason: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("admin");
    const why = z.string().trim().min(5, "ระบุเหตุผลให้ผู้แจ้งเข้าใจ อย่างน้อย 5 ตัวอักษร").max(500).parse(reason);
    await transitionStatus({ requestId: id.parse(requestId), to: "rejected", actor: admin(user.id), rejectReason: why });
    return done();
  } catch (err) {
    return actionError(err);
  }
}

/** Marks a request as a duplicate of another; its reporter and followers now follow the target. */
export async function mergeRequest(requestId: string, targetId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("admin");
    const src = id.parse(requestId);
    const dst = id.parse(targetId);
    if (src === dst) return { ok: false, error: "เลือกคำร้องปลายทางที่ไม่ใช่คำร้องเดียวกัน" };

    const touched = await sql.begin(async (tx) => {
      const [a] = await tx<{ code: string; status: string; reporter_id: string; assigned_technician_id: string | null }[]>`
        select code, status, reporter_id, assigned_technician_id from requests where id = ${src} for update`;
      const [b] = await tx<{ code: string; status: string; reporter_id: string }[]>`
        select code, status, reporter_id from requests where id = ${dst} for update`;
      if (!a || !b) throw new TransitionError("ไม่พบคำร้อง");
      if (!["pending", "accepted", "need_info"].includes(a.status)) throw new TransitionError("รวมได้เฉพาะคำร้องที่ยังไม่มอบหมายช่าง");
      if (["closed", "cancelled", "rejected"].includes(b.status)) throw new TransitionError("คำร้องปลายทางปิดไปแล้ว เลือกคำร้องอื่น");

      const followers = await tx<{ user_id: string }[]>`select user_id from request_followers where request_id = ${src}`;
      const people = [a.reporter_id, ...followers.map((f) => f.user_id)].filter((u) => u !== b.reporter_id);

      await tx`update requests set status = 'cancelled', merged_into_id = ${dst}, closed_at = now(), updated_at = now() where id = ${src}`;
      await tx`insert into status_history (request_id, from_status, to_status, actor_id, note)
        values (${src}, ${a.status}, 'cancelled', ${user.id}, ${`รวมกับคำร้อง ${b.code} ซึ่งแจ้งปัญหาเดียวกัน`})`;
      for (const p of people) {
        await tx`insert into request_followers (request_id, user_id) values (${dst}, ${p}) on conflict do nothing`;
      }
      await tx`update requests set updated_at = now() where id = ${dst}`;
      await notify(tx, people, src, "merged", "รวมกับคำร้องเดิมแล้ว", `${a.code} มีผู้แจ้งไว้ก่อนแล้ว คุณจะติดตามความคืบหน้าผ่าน ${b.code} แทน`);
      return [...people, b.reporter_id];
    });
    await pingUsers(touched);
    return done();
  } catch (err) {
    return actionError(err);
  }
}

