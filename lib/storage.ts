import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export const MAX_UPLOAD_BYTES = 1.2 * 1024 * 1024; // compressed images are <= 1 MB; allow a little headroom
export const ALLOWED_TYPES = ["image/jpeg", "image/png"];

/** Stores an image in Supabase Storage when configured, otherwise under public/uploads (local dev only). */
export async function storeImage(file: File, folder: string): Promise<string> {
  const ext = file.type === "image/png" ? "png" : "jpg";
  const name = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "request-images";
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from(bucket).upload(name, bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  }

  const target = path.join(process.cwd(), "public", "uploads", name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
  return `/uploads/${name}`;
}

/** Accept only image URLs this app produced, so clients cannot attach arbitrary links. */
export function isOwnImageUrl(u: string) {
  if (u.startsWith("/uploads/")) return !u.includes("..");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "request-images";
  return !!base && u.startsWith(`${base}/storage/v1/object/public/${bucket}/`);
}
