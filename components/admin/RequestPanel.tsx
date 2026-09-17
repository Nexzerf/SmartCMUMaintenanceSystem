"use client";

import { Ban, Check, CheckCircle2, GitMerge, MessageCircleQuestion, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { acceptRequest, askForInfo, assignTechnician, getRequestPanel, mergeRequest, rejectRequest, setUrgency } from "@/app/actions/admin";
import { RequestDetailBody, RequestHeader } from "@/components/request/RequestDetailBody";
import { Timeline } from "@/components/request/Timeline";
import { Button } from "@/components/ui/Button";
import { FieldError, Textarea } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import type { Status, Urgency } from "@/lib/status";
import { buildTimeline } from "@/lib/timeline";

type Panel = NonNullable<Awaited<ReturnType<typeof getRequestPanel>>>;
type Mode = null | "info" | "assign" | "merge" | "reject";

export function RequestPanel({ code, onClose }: { code: string | null; onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<Panel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const load = useCallback(async (c: string) => {
    try {
      const res = await getRequestPanel(c);
      setNotFound(!res);
      setData(res);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    setData(null);
    setMode(null);
    setError(null);
    if (code) load(code);
  }, [code, load]);

  // Refresh the open panel when live updates arrive.
  useEffect(() => {
    if (!code) return;
    const onLive = () => load(code);
    window.addEventListener("cmu:live-update", onLive);
    return () => window.removeEventListener("cmu:live-update", onLive);
  }, [code, load]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    start(async () => {
      try {
        const res = await fn();
        if (!res.ok) return setError(res.error ?? "ทำรายการไม่สำเร็จ");
        setMode(null);
        setText("");
        setPicked(null);
        if (code) await load(code);
        router.refresh();
      } catch {
        setError("เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
    });
  };

  const r = data?.detail;
  const status = r?.status as Status | undefined;
  const canAccept = status === "pending";
  const canAssign = status === "accepted" || status === "assigned";
  const canAsk = status === "pending" || status === "accepted";
  const canMerge = !r?.merged_into_code && (status === "pending" || status === "accepted" || status === "need_info");
  const canReject = status === "pending" || status === "accepted" || status === "assigned" || status === "need_info";
  const canChangeUrgency = !!status && !["closed", "cancelled", "rejected"].includes(status);

  const openMode = (m: Mode) => {
    setError(null);
    setText("");
    setPicked(m === "assign" ? (data?.technicians[0]?.id ?? null) : null);
    setMode(m);
  };

  return (
    <Sheet open={!!code} onClose={onClose} side="right" wide title={code ?? ""} description={r ? `แจ้งโดย ${r.reporter_name} · ${relativeTime(r.created_at)}` : undefined}>
      {!data && !notFound ? (
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-28 w-full rounded-[20px]" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full rounded-[16px]" />
        </div>
      ) : notFound || !r ? (
        <p className="py-10 text-center text-muted">ไม่พบคำร้องนี้</p>
      ) : (
        <div className="space-y-5 pb-6">
          <RequestHeader r={r} showUrgency={false} />

          {/* Actions */}
          <section className="rounded-[16px] bg-white p-4">
            <h3 className="text-[13px] font-medium text-muted">การดำเนินการ</h3>
            {canChangeUrgency ? (
              <div className="mt-2">
                <span className="mb-1.5 block text-sm font-semibold">ความเร่งด่วน</span>
                <SegmentedControl
                  label="ความเร่งด่วน"
                  value={r.urgency}
                  onChange={(u: Urgency) => run(() => setUrgency(r.id, u))}
                  options={[
                    { value: "low", label: "ไม่ด่วน" },
                    { value: "normal", label: "ปกติ" },
                    { value: "urgent", label: "ด่วนมาก" },
                  ]}
                />
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2">
              {canAccept ? (
                <Button className="col-span-2" size="lg" loading={pending && !mode} onClick={() => run(() => acceptRequest(r.id))}>
                  <CheckCircle2 size={18} aria-hidden /> รับเรื่อง
                </Button>
              ) : null}
              {canAssign ? (
                <Button className="col-span-2" size="lg" onClick={() => openMode("assign")}>
                  <UserCheck size={18} aria-hidden /> {status === "assigned" ? "เปลี่ยนช่าง" : "มอบหมายช่าง"}
                </Button>
              ) : null}
              {canAsk ? (
                <Button variant="secondary" onClick={() => openMode("info")}>
                  <MessageCircleQuestion size={17} aria-hidden /> ขอข้อมูลเพิ่ม
                </Button>
              ) : null}
              {canMerge ? (
                <Button variant="secondary" onClick={() => openMode("merge")}>
                  <GitMerge size={17} aria-hidden /> รวมคำร้องซ้ำ
                </Button>
              ) : null}
              {canReject ? (
                <Button variant="danger" className={cn((canAsk ? 1 : 0) + (canMerge ? 1 : 0) !== 1 && "col-span-2")} onClick={() => openMode("reject")}>
                  <Ban size={17} aria-hidden /> ปฏิเสธ
                </Button>
              ) : null}
            </div>
            {!canAccept && !canAssign && !canAsk && !canReject ? (
              <p className="mt-2 text-sm text-muted">
                {status === "in_progress" || status === "waiting_parts"
                  ? "ช่างกำลังดำเนินการ ระบบจะอัปเดตให้อัตโนมัติ"
                  : status === "completed"
                    ? "รอผู้แจ้งยืนยันผลการซ่อม"
                    : "คำร้องนี้สิ้นสุดแล้ว"}
              </p>
            ) : null}
            {error && !mode ? (
              <p role="alert" className="mt-2 text-sm text-red-ink">
                {error}
              </p>
            ) : null}

            {/* Inline forms */}
            {mode === "assign" ? (
              <div className="mt-4">
                <p className="text-sm font-semibold">เลือกช่าง</p>
                <p className="text-[13px] text-muted">เรียงจากความถนัดตรงกับ “{r.category_name}” และงานค้างน้อยที่สุด</p>
                <ul className="mt-2 overflow-hidden rounded-[14px] bg-page" role="radiogroup" aria-label="ช่าง">
                  {data.technicians.map((t, i) => (
                    <li key={t.id} className="border-b border-white last:border-0">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={picked === t.id}
                        onClick={() => setPicked(t.id)}
                        className={cn("flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-left", picked === t.id && "bg-brand-soft")}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                            ช่าง{t.full_name}
                            {i === 0 && t.matches ? <span className="rounded-full bg-green-tint px-2 text-xs font-semibold leading-5 text-green-ink">เหมาะสมที่สุด</span> : null}
                            {r.technician_id === t.id ? <span className="rounded-full bg-fill px-2 text-xs font-semibold leading-5 text-muted">ช่างปัจจุบัน</span> : null}
                          </p>
                          <p className="truncate text-[13px] text-muted">
                            {t.skills.map((s) => (s === r.category_name ? `✓ ${s}` : s)).join(" · ") || "ยังไม่กำหนดความถนัด"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={cn("text-[15px] font-bold tabular-nums", t.open_jobs >= 5 ? "text-orange-ink" : "text-ink")}>{t.open_jobs}</p>
                          <p className="text-[11px] text-muted">งานค้าง</p>
                        </div>
                        {picked === t.id ? <Check size={18} className="shrink-0 text-brand" aria-hidden /> : <span className="w-[18px]" />}
                      </button>
                    </li>
                  ))}
                </ul>
                <FieldError>{error}</FieldError>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" onClick={() => setMode(null)}>
                    ยกเลิก
                  </Button>
                  <Button className="flex-1" loading={pending} disabled={!picked || picked === r.technician_id} onClick={() => picked && run(() => assignTechnician(r.id, picked))}>
                    ยืนยันมอบหมาย
                  </Button>
                </div>
              </div>
            ) : null}

            {mode === "info" || mode === "reject" ? (
              <div className="mt-4">
                <label htmlFor="panel-text" className="text-sm font-semibold">
                  {mode === "info" ? "คำถามถึงผู้แจ้ง" : "เหตุผลที่ปฏิเสธ (ผู้แจ้งจะเห็นข้อความนี้)"}
                </label>
                <Textarea
                  id="panel-text"
                  className="mt-1.5 min-h-24 bg-page"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={mode === "info" ? "เช่น ช่วยถ่ายรูปป้ายรุ่นของเครื่องปรับอากาศเพิ่มเติม" : "เช่น อยู่นอกความรับผิดชอบ กรุณาติดต่อผู้ดูแลหอพักเอกชน"}
                  maxLength={500}
                />
                <FieldError>{error}</FieldError>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" onClick={() => setMode(null)}>
                    ยกเลิก
                  </Button>
                  <Button
                    className="flex-1"
                    variant={mode === "reject" ? "danger" : "primary"}
                    loading={pending}
                    onClick={() => run(() => (mode === "info" ? askForInfo(r.id, text) : rejectRequest(r.id, text)))}
                  >
                    {mode === "info" ? "ส่งคำถาม" : "ยืนยันปฏิเสธ"}
                  </Button>
                </div>
              </div>
            ) : null}

            {mode === "merge" ? (
              <div className="mt-4">
                <p className="text-sm font-semibold">รวมเข้ากับคำร้อง</p>
                <p className="text-[13px] text-muted">คำร้องนี้จะถูกปิด และผู้แจ้งจะติดตามคำร้องที่เลือกแทน</p>
                {data.mergeCandidates.length ? (
                  <ul className="mt-2 overflow-hidden rounded-[14px] bg-page" role="radiogroup" aria-label="คำร้องปลายทาง">
                    {data.mergeCandidates.map((m) => (
                      <li key={m.id} className="border-b border-white last:border-0">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={picked === m.id}
                          onClick={() => setPicked(m.id)}
                          className={cn("flex w-full items-start gap-3 px-3.5 py-3 text-left", picked === m.id && "bg-brand-soft")}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold tabular-nums">
                              {m.code} <StatusPill status={m.status as Status} />
                              {m.same_room ? <span className="text-xs font-semibold text-green-ink">ห้องเดียวกัน</span> : null}
                            </p>
                            <p className="line-clamp-2 text-[13px] text-muted">{m.description}</p>
                          </div>
                          {picked === m.id ? <Check size={18} className="mt-1 shrink-0 text-brand" aria-hidden /> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-[12px] bg-page px-3.5 py-3 text-sm text-muted">ไม่พบคำร้องประเภทเดียวกันที่ยังเปิดอยู่ในอาคารนี้</p>
                )}
                <FieldError>{error}</FieldError>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" onClick={() => setMode(null)}>
                    ยกเลิก
                  </Button>
                  <Button className="flex-1" loading={pending} disabled={!picked} onClick={() => picked && run(() => mergeRequest(r.id, picked))}>
                    ยืนยันรวมคำร้อง
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="mb-1.5 px-1 text-[13px] font-medium text-muted">ไทม์ไลน์</h3>
            <div className="rounded-[16px] bg-white p-4">
              <Timeline model={buildTimeline(r.status, r.status_before_info, r.history, r.technician_name)} />
            </div>
          </section>

          <RequestDetailBody r={r} showReporter />
        </div>
      )}
    </Sheet>
  );
}
