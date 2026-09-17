import "server-only";
import { sql, type Tx } from "@/lib/db";
import { ADMIN_TOPIC, broadcast, userTopic } from "@/lib/realtime/server";
import { AUTO_CLOSE_DAYS, STATUS_LABEL, type Role, type Status } from "@/lib/status";

export class TransitionError extends Error {}

type Actor = { id: string; role: Role } | { id: null; role: "system" };

type Rule = { roles: (Role | "system")[]; owner?: boolean; assignee?: boolean };

/**
 * The single source of truth for allowed status changes.
 * owner: reporter must own the request. assignee: technician must be the assigned one.
 */
const RULES: Partial<Record<Status, Partial<Record<Status, Rule>>>> = {
  pending: {
    accepted: { roles: ["admin"] },
    need_info: { roles: ["admin"] },
    rejected: { roles: ["admin"] },
    cancelled: { roles: ["reporter", "admin"], owner: true },
  },
  accepted: {
    assigned: { roles: ["admin"] },
    need_info: { roles: ["admin"] },
    rejected: { roles: ["admin"] },
    cancelled: { roles: ["admin"] },
  },
  need_info: {
    pending: { roles: ["reporter", "admin"], owner: true },
    accepted: { roles: ["reporter", "admin"], owner: true },
    rejected: { roles: ["admin"] },
  },
  assigned: {
    assigned: { roles: ["admin"] }, // reassign to another technician
    in_progress: { roles: ["technician"], assignee: true },
    rejected: { roles: ["admin"] },
  },
  in_progress: {
    waiting_parts: { roles: ["technician"], assignee: true },
    completed: { roles: ["technician"], assignee: true },
  },
  waiting_parts: {
    in_progress: { roles: ["technician"], assignee: true },
  },
  completed: {
    closed: { roles: ["reporter", "system"], owner: true },
    reopened: { roles: ["reporter"], owner: true },
  },
};

export function canTransition(from: Status, to: Status, role: Role | "system") {
  return !!RULES[from]?.[to]?.roles.includes(role);
}

type TransitionInput = {
  requestId: string;
  to: Status;
  actor: Actor;
  note?: string | null;
  /** Extra column updates applied atomically with the status change. */
  assignTechnicianId?: string;
  rejectReason?: string;
};

type Row = {
  id: string;
  code: string;
  status: Status;
  reporter_id: string;
  assigned_technician_id: string | null;
  status_before_info: Status | null;
  category_name: string;
  location: string;
};

const MESSAGES: Partial<Record<Status, (r: Row, extra: { note?: string | null; techName?: string }) => { title: string; body: string }>> = {
  accepted: (r) => ({ title: "รับเรื่องแล้ว", body: `เจ้าหน้าที่รับเรื่อง ${r.code} แล้ว กำลังจัดหาช่างที่เหมาะสม` }),
  assigned: (r, e) => ({ title: "มอบหมายช่างแล้ว", body: `ช่าง${e.techName ?? ""} จะเข้าดูแลคำร้อง ${r.code}` }),
  in_progress: (r) => ({ title: "ช่างกำลังซ่อม", body: `ช่างเริ่มดำเนินการคำร้อง ${r.code} แล้ว` }),
  waiting_parts: (r, e) => ({ title: "รออะไหล่", body: e.note ? `${r.code}: ${e.note}` : `คำร้อง ${r.code} อยู่ระหว่างรออะไหล่` }),
  need_info: (r, e) => ({ title: "ขอข้อมูลเพิ่มเติม", body: e.note ? `${r.code}: ${e.note}` : `เจ้าหน้าที่ขอข้อมูลเพิ่มเติมสำหรับ ${r.code}` }),
  completed: (r) => ({ title: "ซ่อมเสร็จแล้ว รอคุณยืนยัน", body: `ตรวจสอบงาน ${r.code} แล้วกดยืนยันได้เลย` }),
  closed: (r) => ({ title: "ปิดงานแล้ว", body: `คำร้อง ${r.code} ปิดงานเรียบร้อย ขอบคุณที่แจ้งเข้ามา` }),
  rejected: (r, e) => ({ title: "คำร้องถูกปฏิเสธ", body: e.note ? `${r.code}: ${e.note}` : `คำร้อง ${r.code} ถูกปฏิเสธ` }),
  cancelled: (r) => ({ title: "ยกเลิกคำร้องแล้ว", body: `คำร้อง ${r.code} ถูกยกเลิก` }),
};

async function lockRequest(tx: Tx, id: string) {
  const [row] = await tx<Row[]>`
    select r.id, r.code, r.status, r.reporter_id, r.assigned_technician_id, r.status_before_info,
      c.name_th as category_name, b.name_th || ' ' || rm.name_th as location
    from requests r
    join categories c on c.id = r.category_id
    join rooms rm on rm.id = r.room_id
    join buildings b on b.id = rm.building_id
    where r.id = ${id}
    for update of r`;
  if (!row) throw new TransitionError("ไม่พบคำร้องนี้");
  return row;
}

async function followers(tx: Tx, requestId: string) {
  const rows = await tx<{ user_id: string }[]>`select user_id from request_followers where request_id = ${requestId}`;
  return rows.map((r) => r.user_id);
}

export async function notify(tx: Tx, userIds: string[], requestId: string | null, type: string, title: string, body: string) {
  for (const uid of new Set(userIds)) {
    await tx`insert into notifications (user_id, request_id, type, title, body) values (${uid}, ${requestId}, ${type}, ${title}, ${body})`;
  }
}

/**
 * Validates and applies one status change inside a transaction, writes status_history,
 * and creates notifications. Returns the users whose screens should refresh.
 */
export async function transitionInTx(tx: Tx, input: TransitionInput): Promise<string[]> {
  const r = await lockRequest(tx, input.requestId);
  const { actor, to } = input;
  const from = r.status;
  const rule = RULES[from]?.[to];

  if (!rule || !rule.roles.includes(actor.role)) {
    throw new TransitionError(`เปลี่ยนสถานะจาก "${STATUS_LABEL[from]}" เป็น "${STATUS_LABEL[to]}" ไม่ได้`);
  }
  if (actor.role === "reporter" && rule.owner && r.reporter_id !== actor.id) {
    throw new TransitionError("คุณไม่มีสิทธิ์จัดการคำร้องนี้");
  }
  if (actor.role === "technician" && rule.assignee && r.assigned_technician_id !== actor.id) {
    throw new TransitionError("งานนี้ไม่ได้มอบหมายให้คุณ");
  }
  if (from === "need_info" && to !== "rejected" && to !== (r.status_before_info ?? "pending")) {
    throw new TransitionError("สถานะที่จะย้อนกลับไม่ถูกต้อง");
  }
  if (to === "rejected" && !input.rejectReason?.trim()) throw new TransitionError("กรุณาระบุเหตุผลที่ปฏิเสธ");

  const followerIds = await followers(tx, r.id);
  const audience = [r.reporter_id, ...followerIds];
  const refresh = new Set<string>([...audience, ...(r.assigned_technician_id ? [r.assigned_technician_id] : [])]);
  const actorId = actor.id;
  const note = input.note ?? input.rejectReason ?? null;

  // Reopen: completed -> reopened -> accepted, technician released so Admin can reassign.
  if (to === "reopened") {
    await tx`insert into status_history (request_id, from_status, to_status, actor_id, note)
      values (${r.id}, ${from}, 'reopened', ${actorId}, ${note})`;
    await tx`insert into status_history (request_id, from_status, to_status, actor_id, note, created_at)
      values (${r.id}, 'reopened', 'accepted', null, 'ส่งกลับให้เจ้าหน้าที่มอบหมายช่างอีกครั้ง', now() + interval '1 millisecond')`;
    await tx`update requests set status = 'accepted', assigned_technician_id = null, completed_at = null,
      reopen_count = reopen_count + 1, updated_at = now() where id = ${r.id}`;
    await notify(tx, audience, r.id, "reopened", "ส่งเรื่องกลับให้เจ้าหน้าที่แล้ว", `เราจะมอบหมายช่างเข้าไปดู ${r.code} อีกครั้ง`);
    if (r.assigned_technician_id) {
      await notify(tx, [r.assigned_technician_id], r.id, "reopened", "ผู้แจ้งแจ้งว่ายังไม่หาย",
        `${r.code} · ${r.location}${note ? ` — "${note}"` : ""} งานถูกส่งกลับให้เจ้าหน้าที่`);
    }
    return [...refresh];
  }

  let techName: string | undefined;
  if (to === "assigned") {
    if (!input.assignTechnicianId) throw new TransitionError("กรุณาเลือกช่าง");
    const [tech] = await tx<{ id: string; full_name: string }[]>`
      select id, full_name from users where id = ${input.assignTechnicianId} and role = 'technician' and is_active`;
    if (!tech) throw new TransitionError("ไม่พบช่างที่เลือก");
    techName = tech.full_name;
    refresh.add(tech.id);
  }

  await tx`
    update requests set
      status = ${to},
      updated_at = now(),
      status_before_info = ${to === "need_info" ? from : null},
      assigned_technician_id = ${to === "assigned" ? input.assignTechnicianId! : r.assigned_technician_id},
      reject_reason = ${to === "rejected" ? input.rejectReason!.trim() : null},
      completed_at = case when ${to} = 'completed' then now() else completed_at end,
      closed_at = case when ${to} in ('closed', 'cancelled', 'rejected') then now() else closed_at end
    where id = ${r.id}`;

  await tx`insert into status_history (request_id, from_status, to_status, actor_id, note)
    values (${r.id}, ${from}, ${to}, ${actorId}, ${note})`;

  // Notifications
  if (from === "need_info") {
    await notify(tx, audience, r.id, "info_answered", "ส่งข้อมูลเพิ่มเติมแล้ว", `เจ้าหน้าที่จะดำเนินการคำร้อง ${r.code} ต่อ`);
  } else if (from === "waiting_parts" && to === "in_progress") {
    await notify(tx, audience, r.id, "in_progress", "ได้อะไหล่แล้ว", `ช่างกลับมาซ่อมคำร้อง ${r.code} ต่อ`);
  } else if (from === "assigned" && to === "assigned") {
    await notify(tx, audience, r.id, "assigned", "เปลี่ยนช่างผู้รับผิดชอบ", `ช่าง${techName} จะเข้าดูแลคำร้อง ${r.code}`);
  } else {
    const msg = MESSAGES[to]?.(r, { note, techName });
    if (msg) await notify(tx, audience, r.id, to, msg.title, msg.body);
  }

  if (to === "assigned") {
    await notify(tx, [input.assignTechnicianId!], r.id, "job_assigned", "งานใหม่เข้ามา", `${r.code} · ${r.category_name} · ${r.location}`);
    if (r.assigned_technician_id && r.assigned_technician_id !== input.assignTechnicianId) {
      await notify(tx, [r.assigned_technician_id], r.id, "job_unassigned", "งานถูกโอนให้ช่างท่านอื่น", `${r.code} · ${r.location}`);
    }
  }
  if ((to === "rejected" || to === "cancelled") && r.assigned_technician_id) {
    await notify(tx, [r.assigned_technician_id], r.id, to, `งาน${STATUS_LABEL[to]}`, `${r.code} · ${r.location}`);
  }
  if (to === "closed" && r.assigned_technician_id) {
    await notify(tx, [r.assigned_technician_id], r.id, "closed", "ผู้แจ้งยืนยันงานแล้ว", `${r.code} ปิดงานเรียบร้อย`);
  }

  return [...refresh];
}

/** Run a transition in its own transaction and ping affected screens afterwards. */
export async function transitionStatus(input: TransitionInput, extra?: (tx: Tx) => Promise<void>) {
  const refresh = await sql.begin(async (tx) => {
    const users = await transitionInTx(tx, input);
    if (extra) await extra(tx);
    return users;
  });
  await pingUsers(refresh);
}

export async function pingUsers(userIds: string[]) {
  await broadcast([...userIds.map(userTopic), ADMIN_TOPIC]);
}

let lastAutoCloseCheck = 0;

/** Auto-close completed requests older than AUTO_CLOSE_DAYS. Called on read; throttled unless forced. */
export async function runAutoClose(force = false) {
  if (!force && Date.now() - lastAutoCloseCheck < 30_000) return 0;
  lastAutoCloseCheck = Date.now();
  const due = await sql<{ id: string }[]>`
    select id from requests
    where status = 'completed' and completed_at < now() - make_interval(days => ${AUTO_CLOSE_DAYS})`;
  const touched = new Set<string>();
  for (const { id } of due) {
    const users = await sql.begin((tx) =>
      transitionInTx(tx, {
        requestId: id,
        to: "closed",
        actor: { id: null, role: "system" },
        note: `ปิดงานอัตโนมัติ เนื่องจากไม่มีการยืนยันภายใน ${AUTO_CLOSE_DAYS} วัน`,
      }),
    );
    users.forEach((u) => touched.add(u));
  }
  if (due.length) await pingUsers([...touched]);
  return due.length;
}
