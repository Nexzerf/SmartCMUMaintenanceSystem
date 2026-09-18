"use client";

import { MapPin, Phone, Star, UserRound, Wrench } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { StatusPill, UrgencyTag } from "@/components/ui/StatusPill";
import { floorLabel, formatDateTime, formatPhone } from "@/lib/format";
import type { RequestDetail } from "@/lib/requests/queries";
import type { serialize } from "@/lib/serialize";
import { PhotoGallery } from "./PhotoGallery";

export type RequestDetailView = ReturnType<typeof serialize<RequestDetail>>;

export function RequestHeader({ r, showUrgency = true }: { r: RequestDetailView; showUrgency?: boolean }) {
  return (
    <div className="rounded-[20px] bg-white p-4">
      <div className="flex items-start gap-3">
        <CategoryIcon name={r.category_icon} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="tabular-nums text-[13px] font-semibold text-muted">{r.code}</p>
          <h1 className="text-[20px] font-bold leading-tight">{r.category_name}</h1>
          <p className="mt-1 flex items-start gap-1 text-[14px] text-muted">
            <MapPin size={15} className="mt-[3px] shrink-0" aria-hidden />
            <span>
              {r.building_name} · {floorLabel(r.floor)} · {r.room_name}
              <span className="block text-[13px]">{r.campus_name}</span>
            </span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill status={r.status} merged={!!r.merged_into_code} />
        {showUrgency ? <UrgencyTag urgency={r.urgency} /> : null}
        {r.merged_into_code ? <span className="text-[13px] text-muted">รวมกับ {r.merged_into_code}</span> : null}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 px-1 text-[13px] font-medium text-muted">{title}</h2>
      <div className="rounded-[16px] bg-white p-4">{children}</div>
    </section>
  );
}

export function RequestDetailBody({ r, showReporter }: { r: RequestDetailView; showReporter?: boolean }) {
  const before = r.images.filter((i) => i.kind === "before").map((i) => i.url);
  const after = r.images.filter((i) => i.kind === "after").map((i) => i.url);
  const note = r.repair_notes[0];

  return (
    <div className="space-y-5">
      <Section title="รายละเอียดปัญหา">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{r.description}</p>
        {r.landmark ? (
          <p className="mt-2 text-sm">
            <span className="text-muted">จุดสังเกต: </span>
            {r.landmark}
          </p>
        ) : null}
        <p className="mt-2 text-[13px] text-muted">แจ้งเมื่อ {formatDateTime(r.created_at)}</p>
        {before.length ? (
          <div className="mt-3">
            <PhotoGallery urls={before} label="รูปก่อนซ่อม" />
          </div>
        ) : null}
      </Section>

      {r.info_requests.length ? (
        <Section title="คำถามจากเจ้าหน้าที่">
          <ul className="space-y-3">
            {r.info_requests.map((q) => (
              <li key={q.id} className="text-[15px]">
                <p className="font-semibold">ถาม: {q.question}</p>
                <p className={q.answer ? "mt-0.5" : "mt-0.5 text-orange-ink"}>{q.answer ? `ตอบ: ${q.answer}` : "รอผู้แจ้งตอบ"}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {showReporter ? (
        <Section title="ผู้แจ้ง">
          {/* Wraps the call button under the name when the column is narrow, instead of squeezing the name. */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-muted" aria-hidden>
              <UserRound size={20} />
            </span>
            <div className="min-w-[150px] flex-1">
              <p className="font-semibold">{r.reporter_name}</p>
              <p className="truncate text-[13px] text-muted">{r.reporter_faculty}</p>
            </div>
            {r.can_view_phone && r.reporter_phone ? (
              <a
                href={`tel:${r.reporter_phone}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-green-tint px-3.5 text-[15px] font-semibold text-green-ink"
                aria-label={`โทรหา ${r.reporter_name} ${formatPhone(r.reporter_phone)}`}
              >
                <Phone size={16} aria-hidden />
                <span className="tabular-nums">{formatPhone(r.reporter_phone)}</span>
              </a>
            ) : null}
          </div>
          {r.follower_count > 0 ? <p className="mt-2 text-[13px] text-muted">มีผู้ติดตามคำร้องนี้อีก {r.follower_count} คน</p> : null}
        </Section>
      ) : null}

      {r.technician_name ? (
        <Section title="ช่างผู้รับผิดชอบ">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-tint text-blue-ink" aria-hidden>
              <Wrench size={18} />
            </span>
            <p className="font-semibold">ช่าง{r.technician_name}</p>
          </div>
        </Section>
      ) : null}

      {note || after.length ? (
        <Section title="ผลการซ่อม">
          {note ? (
            <dl className="space-y-2 text-[15px]">
              <div>
                <dt className="text-[13px] text-muted">สาเหตุ</dt>
                <dd>{note.cause}</dd>
              </div>
              {note.parts_used ? (
                <div>
                  <dt className="text-[13px] text-muted">อะไหล่ที่ใช้</dt>
                  <dd>{note.parts_used}</dd>
                </div>
              ) : null}
              <div className="text-[13px] text-muted">
                บันทึกโดยช่าง{note.technician_name} · {formatDateTime(note.created_at)}
              </div>
            </dl>
          ) : null}
          {after.length ? (
            <div className="mt-3">
              <p className="mb-1.5 text-[13px] text-muted">รูปหลังซ่อม</p>
              <PhotoGallery urls={after} label="รูปหลังซ่อม" />
            </div>
          ) : null}
        </Section>
      ) : null}

      {r.rating ? (
        <Section title="ความพึงพอใจ">
          <div className="flex items-center gap-1" aria-label={`${r.rating.score} จาก 5 ดาว`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={20} className={n <= r.rating!.score ? "fill-[#f5a524] text-[#f5a524]" : "text-fill-strong"} aria-hidden />
            ))}
          </div>
          {r.rating.comment ? <p className="mt-2 text-[15px]">“{r.rating.comment}”</p> : null}
        </Section>
      ) : null}
    </div>
  );
}
