"use client";

import { MessageCircleQuestion, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { answerInfoRequest, cancelRequest, confirmCompletion, reopenRequest } from "@/app/actions/requests";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldError, Label, Textarea } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { AUTO_CLOSE_DAYS, type Status } from "@/lib/status";

type Props = {
  requestId: string;
  code: string;
  status: Status;
  isOwner: boolean;
  completedAt: string | null;
  openQuestion: string | null;
  categoryId: number;
  roomId: number;
  hasRating: boolean;
};

const STAR_LABEL = ["", "ไม่พอใจมาก", "ไม่ค่อยพอใจ", "พอใช้", "พอใจ", "พอใจมาก"];

export function RequestActions(p: Props) {
  const router = useRouter();
  const [sheet, setSheet] = useState<"cancel" | "confirm" | "reopen" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError(null);
    start(async () => {
      try {
        const res = await fn();
        if (!res.ok) return setError(res.error ?? "ทำรายการไม่สำเร็จ");
        setSheet(null);
        after?.();
        router.refresh();
      } catch {
        setError("เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
    });
  };

  const close = () => {
    setSheet(null);
    setError(null);
  };

  if (!p.isOwner) {
    return p.status === "closed" || p.status === "cancelled" || p.status === "rejected" ? null : (
      <p className="rounded-[14px] bg-brand-soft px-4 py-3 text-sm text-brand">คุณกำลังติดตามคำร้องนี้ จะได้รับแจ้งเตือนเมื่อมีความคืบหน้า</p>
    );
  }

  const daysLeft = p.completedAt
    ? Math.max(0, Math.ceil(AUTO_CLOSE_DAYS - (Date.now() - new Date(p.completedAt).getTime()) / 86_400_000))
    : AUTO_CLOSE_DAYS;

  return (
    <>
      {p.status === "pending" ? (
        <Button variant="danger" block onClick={() => setSheet("cancel")}>
          ยกเลิกคำร้อง
        </Button>
      ) : null}

      {p.status === "need_info" ? (
        <div className="rounded-[16px] bg-orange-tint p-4">
          <div className="flex gap-2.5">
            <MessageCircleQuestion size={20} className="mt-0.5 shrink-0 text-orange-ink" aria-hidden />
            <div>
              <p className="text-[15px] font-bold text-orange-ink">เจ้าหน้าที่ขอข้อมูลเพิ่มเติม</p>
              <p className="mt-0.5 text-[15px]">{p.openQuestion}</p>
            </div>
          </div>
          <div className="mt-3">
            <Label htmlFor="answer">คำตอบของคุณ</Label>
            <Textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="พิมพ์ข้อมูลที่เจ้าหน้าที่ต้องการ" className="min-h-24" />
            <FieldError>{error}</FieldError>
            <Button className="mt-3" block loading={pending} onClick={() => run(() => answerInfoRequest({ requestId: p.requestId, answer }), () => setAnswer(""))}>
              ส่งคำตอบ
            </Button>
          </div>
        </div>
      ) : null}

      {p.status === "completed" ? (
        <div className="rounded-[16px] bg-white p-4">
          <p className="text-[17px] font-bold">ช่างแจ้งว่าซ่อมเสร็จแล้ว</p>
          <p className="mt-0.5 text-sm text-muted">ลองตรวจดูหน้างาน แล้วบอกเราว่าใช้งานได้ปกติหรือยัง</p>
          <div className="mt-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <Button size="lg" onClick={() => setSheet("confirm")}>
              ยืนยันว่าซ่อมเสร็จ
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setSheet("reopen")}>
              ยังไม่หาย
            </Button>
          </div>
          <p className="mt-3 text-center text-[13px] text-muted">
            {daysLeft > 0 ? `ระบบจะปิดงานอัตโนมัติใน ${daysLeft} วัน` : "ระบบจะปิดงานอัตโนมัติเร็ว ๆ นี้"}
          </p>
        </div>
      ) : null}

      {p.status === "closed" ? (
        <ButtonLink href={`/request/new?category=${p.categoryId}&room=${p.roomId}`} variant="secondary" block>
          แจ้งซ่อมซ้ำที่เดิม
        </ButtonLink>
      ) : null}

      <Sheet
        open={sheet === "cancel"}
        onClose={close}
        title="ยกเลิกคำร้องนี้?"
        description={`${p.code} จะไม่ถูกส่งต่อให้ช่าง และยกเลิกแล้วย้อนกลับไม่ได้`}
        footer={
          <div className="space-y-2">
            <Button variant="danger" size="lg" block loading={pending} onClick={() => run(() => cancelRequest(p.requestId))}>
              ยืนยันยกเลิก
            </Button>
            <Button variant="secondary" size="lg" block onClick={close}>
              ไม่ยกเลิก
            </Button>
          </div>
        }
      >
        <FieldError>{error}</FieldError>
      </Sheet>

      <Sheet
        open={sheet === "confirm"}
        onClose={close}
        title="ให้คะแนนงานซ่อมครั้งนี้"
        description="คะแนนช่วยให้ทีมช่างปรับปรุงบริการ"
        footer={
          <Button
            size="lg"
            block
            loading={pending}
            disabled={score === 0}
            onClick={() => run(() => confirmCompletion({ requestId: p.requestId, score, comment }))}
          >
            {score === 0 ? "แตะดาวเพื่อให้คะแนน" : "ยืนยันและปิดงาน"}
          </Button>
        }
      >
        <div className="flex justify-center gap-1 py-2" role="radiogroup" aria-label="คะแนนความพึงพอใจ">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={score === n}
              aria-label={`${n} ดาว ${STAR_LABEL[n]}`}
              onClick={() => setScore(n)}
              className="inline-flex h-14 w-14 items-center justify-center transition-transform active:scale-90"
            >
              <Star size={36} className={cn("transition-colors", n <= score ? "fill-[#f5a524] text-[#f5a524]" : "text-fill-strong")} aria-hidden />
            </button>
          ))}
        </div>
        <p className="h-6 text-center text-[15px] font-semibold text-muted" aria-live="polite">
          {STAR_LABEL[score]}
        </p>
        <div className="mt-3">
          <Label htmlFor="comment" optional>
            ความคิดเห็น
          </Label>
          <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="เช่น ช่างมาเร็ว อธิบายสาเหตุชัดเจน" className="min-h-20" maxLength={500} />
        </div>
        <FieldError>{error}</FieldError>
      </Sheet>

      <Sheet
        open={sheet === "reopen"}
        onClose={close}
        title="ยังพบปัญหาอยู่?"
        description="เราจะส่งเรื่องกลับให้เจ้าหน้าที่มอบหมายช่างอีกครั้ง"
        footer={
          <Button size="lg" block loading={pending} onClick={() => run(() => reopenRequest({ requestId: p.requestId, reason }), () => setReason(""))}>
            ส่งเรื่องกลับ
          </Button>
        }
      >
        <Label htmlFor="reason">อาการที่ยังพบ</Label>
        <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น แอร์เย็นได้ครึ่งชั่วโมงแล้วกลับมามีน้ำหยดอีก" className="min-h-24" maxLength={500} />
        <FieldError>{error}</FieldError>
      </Sheet>
    </>
  );
}
