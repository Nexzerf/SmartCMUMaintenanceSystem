import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { ALLOWED_TYPES, looksLikeImage, MAX_UPLOAD_BYTES, storeImage } from "@/lib/storage";

export const runtime = "nodejs";

/** Receives one client-compressed image. Uses XHR on the client so we can show upload progress. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "reporter" && user.role !== "technician")) {
    return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "อ่านไฟล์ไม่สำเร็จ ลองอีกครั้ง" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "รองรับเฉพาะไฟล์ JPG หรือ PNG" }, { status: 415 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "รูปยังใหญ่เกิน 1 MB หลังบีบอัด ลองเลือกรูปอื่น" }, { status: 413 });
  if (!(await looksLikeImage(file))) return NextResponse.json({ error: "ไฟล์นี้ไม่ใช่รูป JPG หรือ PNG" }, { status: 415 });

  try {
    const url = await storeImage(file, user.role === "technician" ? "after" : "before");
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
