"use client";

import { CheckCircle2, PackageSearch, Play, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeJob, resumeJob, startJob, waitForParts } from "@/app/actions/technician";
import { ImageUploader } from "@/components/request/ImageUploader";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import type { Status } from "@/lib/status";

export function JobActions({ requestId, code, status }: { requestId: string; code: string; status: Status }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"parts" | "complete" | null>(null);
  const [partsNote, setPartsNote] = useState("");
  const [cause, setCause] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ cause?: string; images?: string }>({});

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    start(async () => {
      try {
        const res = await fn();
        if (!res.ok) return setError(res.error ?? "ทำรายการไม่สำเร็จ");
        setSheet(null);
        router.refresh();
      } catch {
        setError("เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
    });
  };

  const submitCompletion = () => {
    const e: typeof fieldErrors = {};
    if (cause.trim().length < 3) e.cause = "ระบุสาเหตุของปัญหาสั้น ๆ เช่น ท่อน้ำทิ้งตัน";
    if (uploading) e.images = "รอให้รูปอัปโหลดเสร็จก่อน";
    else if (!images.length) e.images = "แนบรูปหลังซ่อมอย่างน้อย 1 รูป ให้ผู้แจ้งเห็นผลงาน";
    setFieldErrors(e);
    if (Object.keys(e).length) return;
    run(() => completeJob({ requestId, cause, partsUsed, images }));
  };

  if (!["assigned", "in_progress", "waiting_parts"].includes(status)) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 bg-page pb-3 pt-3 lg:static lg:z-auto lg:rounded-[16px] lg:bg-white lg:p-4">
      <div className="mx-auto max-w-[560px] space-y-2 px-5 lg:max-w-none lg:px-0">
        {error && !sheet ? (
          <p role="alert" className="text-center text-[13px] text-red-ink">
            {error}
          </p>
        ) : null}

        {status === "assigned" ? (
          <Button size="lg" block loading={pending} onClick={() => run(() => startJob(requestId))}>
            <Play size={18} aria-hidden />
            รับงาน
          </Button>
        ) : null}

        {status === "in_progress" ? (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Button size="lg" variant="secondary" className="whitespace-nowrap px-3" onClick={() => setSheet("parts")}>
              <PackageSearch size={18} aria-hidden />
              รออะไหล่
            </Button>
            <Button size="lg" className="whitespace-nowrap px-3" onClick={() => setSheet("complete")}>
              <CheckCircle2 size={18} aria-hidden />
              ซ่อมเสร็จแล้ว
            </Button>
          </div>
        ) : null}

        {status === "waiting_parts" ? (
          <Button size="lg" block loading={pending} onClick={() => run(() => resumeJob(requestId))}>
            <RotateCcw size={18} aria-hidden />
            ได้อะไหล่แล้ว กลับไปซ่อมต่อ
          </Button>
        ) : null}
      </div>

      <Sheet
        open={sheet === "parts"}
        onClose={() => setSheet(null)}
        title="พักงานเพื่อรออะไหล่"
        description="ผู้แจ้งจะเห็นสถานะ “รออะไหล่” พร้อมหมายเหตุนี้"
        footer={
          <Button size="lg" block loading={pending} onClick={() => run(() => waitForParts(requestId, partsNote))}>
            ยืนยันรออะไหล่
          </Button>
        }
      >
        <Label htmlFor="parts-note" optional>
          หมายเหตุ
        </Label>
        <Input id="parts-note" value={partsNote} onChange={(e) => setPartsNote(e.target.value)} placeholder="เช่น สั่งคอมเพรสเซอร์แล้ว คาดว่าได้ใน 2 วัน" maxLength={300} />
        <FieldError>{error}</FieldError>
      </Sheet>

      <Sheet
        open={sheet === "complete"}
        onClose={() => setSheet(null)}
        title="บันทึกงานซ่อมเสร็จ"
        description={`${code} · ผู้แจ้งจะได้รับแจ้งให้ตรวจสอบและยืนยัน`}
        footer={
          <Button size="lg" block loading={pending} disabled={uploading} onClick={submitCompletion}>
            {uploading ? "กำลังอัปโหลดรูป..." : "ยืนยันซ่อมเสร็จ"}
          </Button>
        }
      >
        <div className="space-y-5">
          <div>
            <span className="mb-1.5 block text-sm font-semibold">รูปหลังซ่อม (1–3 รูป)</span>
            <ImageUploader
              label="รูปหลังซ่อม"
              invalid={!!fieldErrors.images}
              onChange={(urls, busy) => {
                setImages(urls);
                setUploading(busy);
                if (urls.length) setFieldErrors((f) => ({ ...f, images: undefined }));
              }}
            />
            <FieldError>{fieldErrors.images}</FieldError>
          </div>
          <div>
            <Label htmlFor="cause">สาเหตุ</Label>
            <Textarea id="cause" value={cause} onChange={(e) => {
                setCause(e.target.value);
                if (e.target.value.trim().length >= 3) setFieldErrors((f) => ({ ...f, cause: undefined }));
              }} placeholder="เช่น ท่อน้ำทิ้งแอร์ตัน ทำความสะอาดแล้ว" className="min-h-20" maxLength={500} aria-invalid={!!fieldErrors.cause} />
            <FieldError>{fieldErrors.cause}</FieldError>
          </div>
          <div>
            <Label htmlFor="parts-used" optional>
              อะไหล่ที่ใช้
            </Label>
            <Input id="parts-used" value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} placeholder="เช่น ซีลยาง 2 ชิ้น" maxLength={500} />
          </div>
          <FieldError>{error}</FieldError>
        </div>
      </Sheet>
    </div>
  );
}
