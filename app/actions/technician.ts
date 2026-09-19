"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, type ActionResult } from "@/lib/actions/result";
import { requireActionUser } from "@/lib/auth/guard";
import { transitionStatus } from "@/lib/requests/transition";
import { isOwnImageUrl } from "@/lib/storage";

const id = z.guid();

export async function startJob(requestId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("technician");
    await transitionStatus({ requestId: id.parse(requestId), to: "in_progress", actor: { id: user.id, role: "technician" }, note: "ช่างรับงานและเริ่มดำเนินการ" });
    revalidatePath("/tech", "layout");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function waitForParts(requestId: string, note: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("technician");
    const clean = z.string().trim().max(300, "หมายเหตุยาวเกิน 300 ตัวอักษร").parse(note);
    await transitionStatus({ requestId: id.parse(requestId), to: "waiting_parts", actor: { id: user.id, role: "technician" }, note: clean || "รออะไหล่" });
    revalidatePath("/tech", "layout");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function resumeJob(requestId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("technician");
    await transitionStatus({ requestId: id.parse(requestId), to: "in_progress", actor: { id: user.id, role: "technician" }, note: "ได้อะไหล่แล้ว กลับมาซ่อมต่อ" });
    revalidatePath("/tech", "layout");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

const completeSchema = z.object({
  requestId: id,
  cause: z.string().trim().min(3, "กรุณาระบุสาเหตุของปัญหา อย่างน้อย 3 ตัวอักษร").max(500),
  partsUsed: z.string().trim().max(500).optional(),
  images: z
    .array(z.string().refine(isOwnImageUrl, "รูปภาพไม่ถูกต้อง กรุณาอัปโหลดใหม่"))
    .min(1, "แนบรูปหลังซ่อมอย่างน้อย 1 รูป")
    .max(3, "แนบรูปได้สูงสุด 3 รูป"),
});

export async function completeJob(input: z.input<typeof completeSchema>): Promise<ActionResult> {
  try {
    const user = await requireActionUser("technician");
    const data = completeSchema.parse(input);
    await transitionStatus({ requestId: data.requestId, to: "completed", actor: { id: user.id, role: "technician" }, note: `สาเหตุ: ${data.cause}` }, async (tx) => {
      await tx`insert into repair_notes (request_id, cause, parts_used, technician_id)
        values (${data.requestId}, ${data.cause}, ${data.partsUsed || null}, ${user.id})`;
      for (const url of data.images) {
        await tx`insert into request_images (request_id, url, kind) values (${data.requestId}, ${url}, 'after')`;
      }
    });
    revalidatePath("/tech", "layout");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
