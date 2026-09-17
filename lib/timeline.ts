import { MAIN_FLOW, STATUS_LABEL, type Status, type Tone } from "@/lib/status";

export type HistoryEntry = { id: string; from_status: Status | null; to_status: Status; note: string | null; actor_name: string | null; created_at: string };

export type TimelineSideEvent = { id: string; label: string; note: string | null; at: string; tone: Tone };

export type TimelineStep = {
  status: Status;
  label: string;
  state: "done" | "current" | "future";
  at: string | null;
  actor: string | null;
  note: string | null;
  events: TimelineSideEvent[];
};

export type TimelineModel = {
  steps: TimelineStep[];
  terminal: { status: Status; label: string; at: string | null; note: string | null } | null;
  currentTone: Tone;
};

const STEP_LABEL: Partial<Record<Status, string>> = {
  pending: "ส่งคำร้อง · รอรับเรื่อง",
  completed: "ซ่อมเสร็จ รอยืนยัน",
};

function sideEvent(h: HistoryEntry): { step: Status; ev: TimelineSideEvent } | null {
  const base = { id: h.id, note: h.note, at: h.created_at };
  if (h.to_status === "need_info") return { step: h.from_status === "accepted" ? "accepted" : "pending", ev: { ...base, label: "ขอข้อมูลเพิ่มเติม", tone: "orange" } };
  if (h.from_status === "need_info") return { step: h.to_status, ev: { ...base, label: "ผู้แจ้งส่งข้อมูลเพิ่มเติมแล้ว", tone: "gray" } };
  if (h.to_status === "waiting_parts") return { step: "in_progress", ev: { ...base, label: "รออะไหล่", tone: "orange" } };
  if (h.from_status === "waiting_parts") return { step: "in_progress", ev: { ...base, label: "ได้อะไหล่แล้ว กลับมาซ่อมต่อ", tone: "blue" } };
  if (h.to_status === "reopened") return { step: "accepted", ev: { ...base, label: "ผู้แจ้งแจ้งว่ายังไม่หาย", tone: "orange" } };
  if (h.from_status === "reopened") return null;
  if (h.from_status === "assigned" && h.to_status === "assigned") return { step: "assigned", ev: { ...base, label: "เปลี่ยนช่างผู้รับผิดชอบ", tone: "blue" } };
  return null;
}

/** Builds the vertical timeline: main flow steps with inline side events. */
export function buildTimeline(status: Status, statusBeforeInfo: Status | null, history: HistoryEntry[], technicianName: string | null): TimelineModel {
  const lastReopen = [...history].reverse().find((h) => h.to_status === "reopened");
  const cycleStart = lastReopen ? new Date(lastReopen.created_at).getTime() : -Infinity;

  const mapped: Status =
    status === "waiting_parts" ? "in_progress" : status === "need_info" ? (statusBeforeInfo ?? "pending") : status;

  const isTerminal = status === "cancelled" || status === "rejected";
  let currentIdx = MAIN_FLOW.indexOf(mapped);
  if (isTerminal) {
    // Last main step reached before the terminal state.
    const reached = history.filter((h) => MAIN_FLOW.includes(h.to_status)).map((h) => MAIN_FLOW.indexOf(h.to_status));
    currentIdx = reached.length ? Math.max(...reached) : 0;
  }

  const side = history.map(sideEvent);

  const steps: TimelineStep[] = MAIN_FLOW.map((s, idx) => {
    const occurrences = history.filter((h, i) => h.to_status === s && !side[i] && (s === "pending" || new Date(h.created_at).getTime() >= cycleStart || h.from_status === null));
    const entry = s === "pending" ? history.find((h) => h.to_status === "pending") : occurrences[0];
    const state: TimelineStep["state"] = idx < currentIdx || (idx === currentIdx && (status === "closed" || isTerminal)) ? "done" : idx === currentIdx ? "current" : "future";
    const events = state === "future" ? [] : history.flatMap((_, i) => (side[i] && side[i]!.step === s ? [side[i]!.ev] : []));
    return {
      status: s,
      label: STEP_LABEL[s] ?? STATUS_LABEL[s],
      state,
      at: state === "future" ? null : (entry?.created_at ?? null),
      actor: s === "assigned" && state !== "future" ? technicianName : (entry?.actor_name ?? null),
      note: state === "future" ? null : (entry?.note ?? null),
      events,
    };
  });

  const terminalEntry = isTerminal ? [...history].reverse().find((h) => h.to_status === status) : undefined;
  const currentTone: Tone =
    status === "waiting_parts" || status === "need_info" ? "orange" : status === "pending" ? "gray" : status === "completed" || status === "closed" ? "green" : "blue";

  return {
    steps: isTerminal ? steps.slice(0, currentIdx + 1) : steps,
    terminal: isTerminal ? { status, label: STATUS_LABEL[status], at: terminalEntry?.created_at ?? null, note: terminalEntry?.note ?? null } : null,
    currentTone,
  };
}
