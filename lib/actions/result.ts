import { z } from "zod";
import { AuthError } from "@/lib/auth/guard";
import { TransitionError } from "@/lib/requests/transition";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export function actionError(err: unknown): { ok: false; error: string } {
  if (err instanceof TransitionError || err instanceof AuthError) return { ok: false, error: err.message };
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0].message };
  console.error(err);
  return { ok: false, error: "ระบบขัดข้องชั่วคราว ข้อมูลที่กรอกยังอยู่ครบ กรุณาลองอีกครั้ง" };
}
