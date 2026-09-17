"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActionUser } from "@/lib/auth/guard";
import { sql } from "@/lib/db";

export type ProfileState = { errors?: Partial<Record<"full_name" | "user_type" | "faculty" | "phone" | "pdpa", string>>; saved?: boolean; message?: string };

const schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อ-นามสกุล")
    .refine((v) => v.split(/\s+/).length >= 2, "กรุณากรอกทั้งชื่อและนามสกุล โดยเว้นวรรคระหว่างกัน")
    .pipe(z.string().max(120, "ชื่อยาวเกินไป")),
  user_type: z.enum(["student", "staff"], { message: "กรุณาเลือกว่าเป็นนักศึกษาหรือบุคลากร" }),
  faculty: z.string().trim().min(2, "กรุณากรอกคณะหรือหน่วยงาน เช่น CAMT").max(120),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^0\d{8,9}$/, "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก เช่น 0812345678")),
});

export async function saveProfile(mode: "setup" | "edit", _prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireActionUser("reporter");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  const errors: ProfileState["errors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ProfileState["errors"]>;
      errors[key] ??= issue.message;
    }
  }
  const pdpa = formData.get("pdpa") === "on";
  if (mode === "setup" && !pdpa) errors.pdpa = "กรุณายอมรับการเก็บและใช้ข้อมูลส่วนบุคคลก่อนเริ่มใช้งาน";
  if (!parsed.success || Object.keys(errors).length) return { errors };

  const d = parsed.data;
  await sql`
    update users set full_name = ${d.full_name}, user_type = ${d.user_type}, faculty = ${d.faculty}, phone = ${d.phone},
      profile_completed = true,
      pdpa_accepted_at = coalesce(pdpa_accepted_at, ${mode === "setup" ? new Date() : null})
    where id = ${user.id}`;

  revalidatePath("/", "layout");
  if (mode === "setup") redirect("/home");
  return { saved: true, message: "บันทึกโปรไฟล์แล้ว" };
}
