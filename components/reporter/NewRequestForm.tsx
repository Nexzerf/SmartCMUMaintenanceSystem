"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, MapPin, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { checkDuplicate, createRequest, followRequest } from "@/app/actions/requests";
import { ImageUploader } from "@/components/request/ImageUploader";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { FieldError, Input, Label, Textarea } from "@/components/ui/Field";
import { GroupedList, GroupedRow } from "@/components/ui/GroupedList";
import { Sheet } from "@/components/ui/Sheet";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import type { Catalog } from "@/lib/requests/queries";
import { URGENCY_HINT, URGENCY_LABEL, type Urgency } from "@/lib/status";
import { SuccessCheck } from "./SuccessCheck";

type Draft = {
  categoryId: number | null;
  urgency: Urgency;
  campusId: number | null;
  buildingId: number | null;
  floor: number | null;
  roomId: number | null;
  landmark: string;
  description: string;
  images: string[];
};

type Duplicate = Awaited<ReturnType<typeof checkDuplicate>>;

const STEPS = ["ปัญหา", "สถานที่", "รายละเอียด", "ตรวจสอบ"];
const DRAFT_KEY = "cmu-request-draft";
const EMPTY: Draft = { categoryId: null, urgency: "normal", campusId: null, buildingId: null, floor: null, roomId: null, landmark: "", description: "", images: [] };

export function NewRequestForm({ catalog, prefill }: { catalog: Catalog; prefill?: { categoryId?: number; roomId?: number } }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [restored, setRestored] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<Duplicate>(null);
  const [dismissedDup, setDismissedDup] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [buildingQuery, setBuildingQuery] = useState("");
  const [submitting, startSubmit] = useTransition();
  const [following, startFollow] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  // Restore an unsent draft (or apply "แจ้งซ่อมซ้ำ" prefill) once on mount.
  // Guarded by a ref: live refreshes re-render with new prop identities and must not wipe input.
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    let next = EMPTY;
    if (prefill?.categoryId || prefill?.roomId) {
      const room = catalog.rooms.find((r) => r.id === prefill.roomId);
      const building = room ? catalog.buildings.find((b) => b.id === room.building_id) : undefined;
      next = {
        ...EMPTY,
        categoryId: catalog.categories.some((c) => c.id === prefill.categoryId) ? prefill.categoryId! : null,
        roomId: room?.id ?? null,
        floor: room?.floor ?? null,
        buildingId: building?.id ?? null,
        campusId: building?.campus_id ?? null,
      };
    } else {
      try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        if (saved) next = { ...EMPTY, ...JSON.parse(saved) };
      } catch {
        // ignore unavailable storage
      }
    }
    setDraft(next);
    setRestored(true);
  }, [catalog, prefill]);

  useEffect(() => {
    if (!restored || successCode) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft, restored, successCode]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const category = catalog.categories.find((c) => c.id === draft.categoryId);
  const campus = catalog.campuses.find((c) => c.id === draft.campusId);
  const building = catalog.buildings.find((b) => b.id === draft.buildingId);
  const room = catalog.rooms.find((r) => r.id === draft.roomId);

  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
    topRef.current?.scrollIntoView({ block: "start" });
    window.scrollTo({ top: 0 });
  };

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0 && !draft.categoryId) e.categoryId = "เลือกประเภทปัญหาก่อนไปขั้นต่อไป";
    if (s === 1 && !draft.roomId) e.roomId = "เลือกห้องหรือจุดที่พบปัญหาให้ครบ วิทยาเขต → อาคาร → ชั้น → ห้อง";
    if (s === 2) {
      const len = draft.description.trim().length;
      if (len < 10) e.description = `อธิบายเพิ่มอีก ${10 - len} ตัวอักษร เช่น อาการที่พบ หรือเริ่มเป็นตั้งแต่เมื่อไร`;
      if (uploading) e.images = "รอให้รูปอัปโหลดเสร็จก่อน";
      else if (draft.images.length < 1) e.images = "แนบรูปอย่างน้อย 1 รูป เพื่อให้ช่างเห็นปัญหาก่อนเข้าหน้างาน";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate(step) && goTo(step + 1);
  const back = () => (step === 0 ? router.push("/home") : goTo(step - 1));

  const selectRoom = async (roomId: number) => {
    set("roomId", roomId);
    if (!draft.categoryId) return;
    const key = `${roomId}:${draft.categoryId}`;
    if (dismissedDup === key) return;
    try {
      const dup = await checkDuplicate(roomId, draft.categoryId);
      if (dup) setDuplicate(dup);
    } catch {
      // Duplicate check is best effort; never block submitting.
    }
  };

  const submit = () => {
    if (![0, 1, 2].every((s) => validate(s))) return;
    setSubmitError(null);
    startSubmit(async () => {
      try {
        const res = await createRequest({
          categoryId: draft.categoryId!,
          urgency: draft.urgency,
          roomId: draft.roomId!,
          landmark: draft.landmark,
          description: draft.description,
          images: draft.images,
        });
        if (res.ok) {
          try {
            sessionStorage.removeItem(DRAFT_KEY);
          } catch {}
          setSuccessCode(res.code);
          window.scrollTo({ top: 0 });
        } else setSubmitError(res.error);
      } catch {
        setSubmitError("เชื่อมต่อไม่สำเร็จ ข้อมูลที่กรอกยังอยู่ครบ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง");
      }
    });
  };

  const floors = useMemo(
    () => [...new Set(catalog.rooms.filter((r) => r.building_id === draft.buildingId).map((r) => r.floor))].sort((a, b) => a - b),
    [catalog.rooms, draft.buildingId],
  );

  if (successCode) return <SuccessScreen code={successCode} />;

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div ref={topRef} className="min-h-dvh pb-32 lg:mx-auto lg:min-h-0 lg:max-w-[720px] lg:pb-0">
      {/* Top bar with progress */}
      <div className="sticky top-0 z-20 bg-page px-5 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={back} className="-ml-2 inline-flex min-h-11 items-center pr-3 text-[15px] font-semibold text-brand">
            <ChevronLeft size={22} aria-hidden />
            {step === 0 ? "ยกเลิก" : "ย้อนกลับ"}
          </button>
          <span className="text-sm font-semibold text-muted">
            ขั้นที่ {step + 1}/{STEPS.length} · {STEPS[step]}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-label="ความคืบหน้าการกรอกแบบฟอร์ม">
          <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.25, ease: "easeOut" }} />
        </div>
      </div>

      <div className="relative overflow-x-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="px-5 pt-2"
          >
            {step === 0 ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-[24px] font-bold leading-tight">เกิดปัญหาอะไร</h1>
                  <p className="mt-1 text-[15px] text-muted">เลือกประเภทที่ใกล้เคียงที่สุด</p>
                </div>
                <GroupedList>
                  {catalog.categories.map((c) => (
                    <GroupedRow
                      key={c.id}
                      role="radio"
                      icon={<CategoryIcon name={c.icon} size="sm" />}
                      label={c.name_th}
                      selected={draft.categoryId === c.id}
                      onClick={() => set("categoryId", c.id)}
                    />
                  ))}
                </GroupedList>
                <FieldError>{errors.categoryId}</FieldError>

                <GroupedList title="ความเร่งด่วน">
                  {(["low", "normal", "urgent"] as Urgency[]).map((u) => (
                    <GroupedRow
                      key={u}
                      role="radio"
                      label={<span className={cn(u === "urgent" && "font-semibold text-red-ink")}>{URGENCY_LABEL[u]}</span>}
                      detail={URGENCY_HINT[u]}
                      selected={draft.urgency === u}
                      onClick={() => set("urgency", u)}
                    />
                  ))}
                </GroupedList>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-[24px] font-bold leading-tight">พบปัญหาที่ไหน</h1>
                  <p className="mt-1 text-[15px] text-muted">เลือกทีละขั้นจนถึงห้อง</p>
                </div>

                <nav aria-label="ตำแหน่งที่เลือก" className="no-scrollbar -mx-5 flex items-center gap-1 overflow-x-auto px-5 text-sm">
                  <Crumb active={!campus} onClick={() => setDraft((d) => ({ ...d, campusId: null, buildingId: null, floor: null, roomId: null }))}>
                    วิทยาเขต
                  </Crumb>
                  {campus ? (
                    <>
                      <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden />
                      <Crumb active={!building} onClick={() => setDraft((d) => ({ ...d, buildingId: null, floor: null, roomId: null }))}>
                        {campus.name_th.replace("วิทยาเขต", "")}
                      </Crumb>
                    </>
                  ) : null}
                  {building ? (
                    <>
                      <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden />
                      <Crumb active={draft.floor == null} onClick={() => setDraft((d) => ({ ...d, floor: null, roomId: null }))}>
                        {building.name_th}
                      </Crumb>
                    </>
                  ) : null}
                  {draft.floor != null ? (
                    <>
                      <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden />
                      <Crumb active>ชั้น {draft.floor}</Crumb>
                    </>
                  ) : null}
                </nav>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${draft.campusId}-${draft.buildingId}-${draft.floor}`}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!campus ? (
                      <GroupedList title="วิทยาเขต">
                        {catalog.campuses.map((c) => (
                          <GroupedRow key={c.id} label={c.name_th} chevron onClick={() => setDraft((d) => ({ ...d, campusId: c.id, buildingId: null, floor: null, roomId: null }))} />
                        ))}
                      </GroupedList>
                    ) : !building ? (
                      <BuildingPicker
                        buildings={catalog.buildings.filter((b) => b.campus_id === campus.id)}
                        query={buildingQuery}
                        onQuery={setBuildingQuery}
                        onPick={(id) => {
                          setBuildingQuery("");
                          setDraft((d) => ({ ...d, buildingId: id, floor: null, roomId: null }));
                        }}
                      />
                    ) : draft.floor == null ? (
                      <GroupedList title="ชั้น">
                        {floors.map((f) => (
                          <GroupedRow key={f} label={`ชั้น ${f}`} chevron onClick={() => setDraft((d) => ({ ...d, floor: f, roomId: null }))} />
                        ))}
                      </GroupedList>
                    ) : (
                      <GroupedList title="ห้อง">
                        {catalog.rooms
                          .filter((r) => r.building_id === building.id && r.floor === draft.floor)
                          .map((r) => (
                            <GroupedRow key={r.id} role="radio" label={r.name_th} selected={draft.roomId === r.id} onClick={() => selectRoom(r.id)} />
                          ))}
                      </GroupedList>
                    )}
                  </motion.div>
                </AnimatePresence>
                <FieldError>{errors.roomId}</FieldError>

                <div>
                  <Label htmlFor="landmark" optional>
                    จุดสังเกตเพิ่มเติม
                  </Label>
                  <Input id="landmark" value={draft.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="เช่น ข้างประตูหลัง, โต๊ะแถวที่ 3" maxLength={200} />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-[24px] font-bold leading-tight">เล่าให้ช่างฟังหน่อย</h1>
                  <p className="mt-1 text-[15px] text-muted">รายละเอียดและรูปช่วยให้ช่างเตรียมอุปกรณ์มาถูก</p>
                </div>
                <div>
                  <Label htmlFor="description">รายละเอียดปัญหา</Label>
                  <Textarea
                    id="description"
                    value={draft.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="เช่น แอร์เปิดแล้วไม่เย็น มีน้ำหยดลงโต๊ะ เริ่มเป็นตั้งแต่เมื่อวาน"
                    maxLength={1000}
                    aria-invalid={!!errors.description}
                    aria-describedby="desc-count"
                  />
                  <div className="mt-1.5 flex items-start justify-between gap-3">
                    <FieldError>{errors.description}</FieldError>
                    <span id="desc-count" className={cn("ml-auto shrink-0 text-[13px] tabular-nums", draft.description.trim().length >= 10 ? "text-green-ink" : "text-muted")} aria-live="polite">
                      {draft.description.trim().length}/1000 {draft.description.trim().length < 10 ? `(ขั้นต่ำ 10)` : ""}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-semibold">รูปภาพ (1–3 รูป)</span>
                  {restored ? (
                    <ImageUploader
                      initialUrls={draft.images}
                      invalid={!!errors.images}
                      onChange={(urls, busy) => {
                        setDraft((d) => (d.images.join() === urls.join() ? d : { ...d, images: urls }));
                        setUploading(busy);
                        if (urls.length && !busy) setErrors((e) => ({ ...e, images: "" }));
                      }}
                    />
                  ) : null}
                  <FieldError>{errors.images}</FieldError>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-[24px] font-bold leading-tight">ตรวจสอบก่อนส่ง</h1>
                  <p className="mt-1 text-[15px] text-muted">แตะ “แก้ไข” เพื่อกลับไปเปลี่ยนข้อมูล</p>
                </div>
                <ReviewBlock title="ปัญหา" onEdit={() => goTo(0)}>
                  <div className="flex items-center gap-3">
                    {category ? <CategoryIcon name={category.icon} size="sm" /> : null}
                    <div>
                      <p className="font-semibold">{category?.name_th}</p>
                      <p className={cn("text-sm", draft.urgency === "urgent" ? "font-semibold text-red-ink" : "text-muted")}>ความเร่งด่วน: {URGENCY_LABEL[draft.urgency]}</p>
                    </div>
                  </div>
                </ReviewBlock>
                <ReviewBlock title="สถานที่" onEdit={() => goTo(1)}>
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                    <div>
                      <p className="font-semibold">
                        {building?.name_th} · ชั้น {room?.floor} · {room?.name_th}
                      </p>
                      <p className="text-sm text-muted">{campus?.name_th}</p>
                      {draft.landmark ? <p className="mt-1 text-sm">จุดสังเกต: {draft.landmark}</p> : null}
                    </div>
                  </div>
                </ReviewBlock>
                <ReviewBlock title="รายละเอียดและรูปภาพ" onEdit={() => goTo(2)}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{draft.description}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {draft.images.map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={u} src={u} alt="รูปที่แนบ" className="aspect-square w-full rounded-[10px] object-cover" />
                    ))}
                  </div>
                </ReviewBlock>

                {submitError ? (
                  <div role="alert" className="flex gap-3 rounded-[14px] bg-red-tint p-4 text-red-ink">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden />
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold">ส่งคำร้องไม่สำเร็จ</p>
                      <p className="mt-0.5 text-sm">{submitError}</p>
                      <button type="button" onClick={submit} className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold">
                        <RotateCcw size={16} aria-hidden /> ลองส่งอีกครั้ง
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-page pb-[max(16px,env(safe-area-inset-bottom))] pt-3 lg:sticky lg:mt-6 lg:pb-6">
        <div className="mx-auto max-w-[560px] px-5 lg:max-w-none">
          {step < 3 ? (
            <Button size="lg" block onClick={next} disabled={step === 2 && uploading}>
              {step === 2 && uploading ? "กำลังอัปโหลดรูป..." : "ถัดไป"}
            </Button>
          ) : (
            <Button size="lg" block onClick={submit} loading={submitting}>
              {submitting ? "กำลังส่งคำร้อง..." : "ส่งคำร้อง"}
            </Button>
          )}
        </div>
      </div>

      <Sheet
        open={!!duplicate}
        onClose={() => setDuplicate(null)}
        title={duplicate?.is_own ? "คุณแจ้งปัญหานี้ไปแล้ว" : "มีคนแจ้งปัญหานี้แล้ว"}
        description="ห้องและประเภทปัญหาเดียวกันยังอยู่ระหว่างดำเนินการ"
        footer={
          duplicate ? (
            <div className="space-y-2">
              {duplicate.is_own || duplicate.is_following ? (
                <ButtonLink href={`/request/${duplicate.code}`} size="lg" block>
                  ดูคำร้องเดิม
                </ButtonLink>
              ) : (
                <Button
                  size="lg"
                  block
                  loading={following}
                  onClick={() =>
                    startFollow(async () => {
                      const res = await followRequest(duplicate.id);
                      if (res.ok) {
                        try {
                          sessionStorage.removeItem(DRAFT_KEY);
                        } catch {}
                        router.push(`/request/${res.code}`);
                      } else setSubmitError(res.error);
                    })
                  }
                >
                  ติดตามงานนี้แทน
                </Button>
              )}
              <Button
                size="lg"
                block
                variant="secondary"
                onClick={() => {
                  setDismissedDup(`${draft.roomId}:${draft.categoryId}`);
                  setDuplicate(null);
                }}
              >
                แจ้งใหม่อยู่ดี
              </Button>
            </div>
          ) : null
        }
      >
        {duplicate ? (
          <div className="rounded-[16px] bg-white p-4">
            <div className="flex items-center gap-3">
              <CategoryIcon name={duplicate.category_icon} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{duplicate.category_name}</p>
                <p className="truncate text-[13px] text-muted">
                  {duplicate.building_name} · ชั้น {duplicate.floor} · {duplicate.room_name}
                </p>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed">{duplicate.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <StatusPill status={duplicate.status} />
              <span className="text-xs text-muted">
                {duplicate.code} · แจ้งเมื่อ {relativeTime(duplicate.created_at)}
              </span>
            </div>
          </div>
        ) : null}
        <p className="mt-3 text-sm text-muted">กดติดตามเพื่อรับแจ้งเตือนเมื่อซ่อมเสร็จ โดยไม่ต้องแจ้งซ้ำ</p>
      </Sheet>
    </div>
  );
}

function Crumb({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn("inline-flex min-h-9 shrink-0 items-center rounded-full px-3 font-semibold", active ? "bg-brand-soft text-brand" : "bg-white text-ink hover:bg-fill")}
      aria-current={active ? "step" : undefined}
    >
      {children}
    </button>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-medium text-muted">{title}</h2>
        <button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-brand">
          แก้ไข
        </button>
      </div>
      <div className="rounded-[16px] bg-white p-4">{children}</div>
    </section>
  );
}

function SuccessScreen({ code }: { code: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 pb-28 text-center">
      <SuccessCheck />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.3 }}>
        <h1 className="mt-6 text-[24px] font-bold">ส่งคำร้องเรียบร้อย</h1>
        <p className="mt-1 text-[15px] text-muted">เลขที่คำร้องของคุณ</p>
        <p className="mt-2 tabular-nums text-[28px] font-bold tracking-wide text-brand">{code}</p>
        <p className="mx-auto mt-3 max-w-[300px] text-sm text-muted">เจ้าหน้าที่จะรับเรื่องและมอบหมายช่าง คุณจะได้รับแจ้งเตือนทุกครั้งที่สถานะเปลี่ยน</p>
      </motion.div>
      <motion.div className="mt-8 w-full max-w-[360px] space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.3 }}>
        <ButtonLink href={`/request/${code}`} size="lg" block>
          ติดตามสถานะ
        </ButtonLink>
        <ButtonLink href="/home" size="lg" variant="secondary" block>
          กลับหน้าแรก
        </ButtonLink>
      </motion.div>
      <Link href="/request/new" className="sr-only">
        แจ้งซ่อมเรื่องใหม่
      </Link>
    </div>
  );
}

/** Suan Sak alone has about 50 buildings: a search box saves scrolling through all of them. */
function BuildingPicker({
  buildings,
  query,
  onQuery,
  onPick,
}: {
  buildings: Catalog["buildings"];
  query: string;
  onQuery: (q: string) => void;
  onPick: (id: number) => void;
}) {
  const q = query.trim().toLowerCase();
  const shown = q ? buildings.filter((b) => b.name_th.toLowerCase().includes(q)) : buildings;
  return (
    <div className="space-y-3">
      {buildings.length > 8 ? (
        <Input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="ค้นหาอาคาร เช่น CAMT, RB5, หอสมุด"
          aria-label="ค้นหาอาคาร"
          enterKeyHint="search"
        />
      ) : null}
      {shown.length ? (
        <GroupedList title="อาคาร">
          {shown.map((b) => (
            <GroupedRow key={b.id} label={b.name_th} chevron onClick={() => onPick(b.id)} />
          ))}
        </GroupedList>
      ) : (
        <p className="rounded-[16px] bg-white px-4 py-5 text-center text-[15px] text-muted">ไม่พบอาคารชื่อ “{query.trim()}” ลองพิมพ์รหัสอาคารหรือชื่อคณะ</p>
      )}
    </div>
  );
}
