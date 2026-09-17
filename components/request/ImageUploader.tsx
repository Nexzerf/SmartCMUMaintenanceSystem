"use client";

import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png"];

type Item = {
  id: string;
  preview: string;
  status: "compressing" | "uploading" | "done" | "error";
  progress: number; // 0..100 across compression (0-50) and upload (50-100)
  url?: string;
  error?: string;
  file?: File;
};

function uploadWithProgress(file: Blob, name: string, onProgress: (p: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
        else reject(new Error(data.error ?? "อัปโหลดไม่สำเร็จ"));
      } catch {
        reject(new Error("อัปโหลดไม่สำเร็จ"));
      }
    };
    xhr.onerror = () => reject(new Error("การเชื่อมต่อขัดข้อง แตะเพื่อลองใหม่"));
    xhr.timeout = 30_000;
    xhr.ontimeout = () => reject(new Error("อัปโหลดนานเกินไป แตะเพื่อลองใหม่"));
    const form = new FormData();
    form.append("file", file, name);
    xhr.send(form);
  });
}

function ProgressRing({ value }: { value: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label="ความคืบหน้าการอัปโหลด">
      <circle cx="22" cy="22" r={r} stroke="rgba(255,255,255,0.35)" strokeWidth="4" fill="none" />
      <motion.circle
        cx="22"
        cy="22"
        r={r}
        stroke="white"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: c - (value / 100) * c }}
        transition={{ duration: 0.2 }}
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}

export function ImageUploader({
  max = 3,
  initialUrls = [],
  onChange,
  invalid,
  label = "รูปภาพ",
}: {
  max?: number;
  initialUrls?: string[];
  onChange: (urls: string[], busy: boolean) => void;
  invalid?: boolean;
  label?: string;
}) {
  const [items, setItems] = useState<Item[]>(() => initialUrls.map((url) => ({ id: url, preview: url, status: "done", progress: 100, url })));
  const [notice, setNotice] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(
      items.filter((i) => i.status === "done" && i.url).map((i) => i.url!),
      items.some((i) => i.status === "compressing" || i.status === "uploading"),
    );
  }, [items]);

  const patch = (id: string, p: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const process = useCallback(async (id: string, file: File) => {
    try {
      patch(id, { status: "compressing", progress: 2, error: undefined });
      const compressed =
        file.size <= 1024 * 1024
          ? file
          : await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 2048,
              useWebWorker: true,
              fileType: file.type,
              onProgress: (p) => patch(id, { progress: Math.max(2, p / 2) }),
            });
      if (compressed.size > 1024 * 1024) throw new Error("บีบอัดรูปให้ต่ำกว่า 1 MB ไม่ได้ ลองเลือกรูปอื่น");
      patch(id, { status: "uploading", progress: 50 });
      const ext = file.type === "image/png" ? "png" : "jpg";
      const url = await uploadWithProgress(compressed, `photo.${ext}`, (p) => patch(id, { progress: 50 + p * 48 }));
      patch(id, { status: "done", progress: 100, url, file: undefined });
    } catch (err) {
      patch(id, { status: "error", error: err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ" });
    }
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setNotice(null);
    const room = max - items.length;
    const picked = Array.from(files);
    if (picked.length > room) setNotice(`แนบได้สูงสุด ${max} รูป จึงเลือกไว้ ${Math.max(room, 0)} รูปแรก`);
    const accepted: Item[] = [];
    for (const file of picked.slice(0, Math.max(room, 0))) {
      if (!TYPES.includes(file.type)) {
        setNotice(`"${file.name}" ไม่ใช่ไฟล์ JPG หรือ PNG กรุณาเลือกรูปใหม่`);
        continue;
      }
      if (file.size > MAX_ORIGINAL_BYTES) {
        setNotice(`"${file.name}" ใหญ่เกิน 10 MB กรุณาเลือกรูปที่เล็กกว่านี้`);
        continue;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      accepted.push({ id, preview: URL.createObjectURL(file), status: "compressing", progress: 0, file });
    }
    if (accepted.length) {
      setItems((list) => [...list, ...accepted]);
      accepted.forEach((a) => process(a.id, a.file!));
    }
  };

  const remove = (id: string) =>
    setItems((list) => {
      const item = list.find((i) => i.id === id);
      if (item?.preview.startsWith("blob:")) URL.revokeObjectURL(item.preview);
      return list.filter((i) => i.id !== id);
    });

  const canAdd = items.length < max;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative aspect-square overflow-hidden rounded-[12px] bg-fill"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blob previews cannot use next/image */}
              <img src={item.preview} alt="รูปที่แนบ" className="h-full w-full object-cover" />
              {item.status === "compressing" || item.status === "uploading" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white">
                  <ProgressRing value={item.progress} />
                  <span className="mt-1 text-[11px] font-semibold">{item.status === "compressing" ? "กำลังบีบอัด" : "กำลังอัปโหลด"}</span>
                </div>
              ) : null}
              {item.status === "error" ? (
                <button
                  type="button"
                  onClick={() => item.file && process(item.id, item.file)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 px-2 text-center text-white"
                  disabled={!item.file}
                >
                  <RotateCcw size={20} aria-hidden />
                  <span className="text-[11px] font-semibold leading-tight">{item.file ? "ลองอีกครั้ง" : item.error}</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center"
                aria-label="ลบรูปนี้"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
                  <X size={16} aria-hidden />
                </span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {canAdd ? (
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] bg-white text-brand transition-colors hover:bg-brand-soft",
              invalid && "ring-2 ring-red-ink",
            )}
          >
            <ImagePlus size={24} aria-hidden />
            <span className="text-[13px] font-semibold">เลือกรูป</span>
            <span className="text-[11px] text-muted">
              {items.length}/{max}
            </span>
          </button>
        ) : null}
      </div>

      {canAdd ? (
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-fill text-[15px] font-semibold text-ink sm:hidden"
        >
          <Camera size={18} aria-hidden />
          ถ่ายรูปด้วยกล้อง
        </button>
      ) : null}

      <input ref={galleryRef} type="file" accept="image/jpeg,image/png" multiple className="sr-only" aria-label={`เลือก${label}`} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <input ref={cameraRef} type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" aria-label="ถ่ายรูป" tabIndex={-1} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

      <p className="mt-2 text-[13px] text-muted">JPG หรือ PNG ไม่เกิน 10 MB ต่อรูป ระบบจะย่อขนาดให้อัตโนมัติ</p>
      {notice ? (
        <p role="alert" className="mt-1.5 text-[13px] text-red-ink">
          {notice}
        </p>
      ) : null}
      {items.some((i) => i.status === "error" && i.file) ? (
        <p role="alert" className="mt-1.5 text-[13px] text-red-ink">
          มีรูปที่อัปโหลดไม่สำเร็จ แตะที่รูปเพื่อลองอีกครั้ง หรือกดกากบาทเพื่อลบ
        </p>
      ) : null}
    </div>
  );
}
