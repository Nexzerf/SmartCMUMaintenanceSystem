// Shared status, urgency, and role vocabulary. Safe to import from client and server.

export type Role = "reporter" | "technician" | "admin";
export type Urgency = "low" | "normal" | "urgent";
export type Status =
  | "pending"
  | "accepted"
  | "assigned"
  | "in_progress"
  | "waiting_parts"
  | "need_info"
  | "completed"
  | "closed"
  | "cancelled"
  | "rejected"
  | "reopened";

export type Tone = "gray" | "blue" | "orange" | "green" | "red" | "purple";

export const STATUS_LABEL: Record<Status, string> = {
  pending: "รอรับเรื่อง",
  accepted: "รับเรื่องแล้ว",
  assigned: "มอบหมายช่างแล้ว",
  in_progress: "กำลังซ่อม",
  waiting_parts: "รออะไหล่",
  need_info: "ขอข้อมูลเพิ่มเติม",
  completed: "ซ่อมเสร็จ รอยืนยัน",
  closed: "ปิดงาน",
  cancelled: "ยกเลิก",
  rejected: "ปฏิเสธ",
  reopened: "แจ้งว่ายังไม่หาย",
};

export const STATUS_TONE: Record<Status, Tone> = {
  pending: "gray",
  accepted: "blue",
  assigned: "blue",
  in_progress: "blue",
  waiting_parts: "orange",
  need_info: "orange",
  completed: "green",
  closed: "green",
  cancelled: "red",
  rejected: "red",
  reopened: "orange",
};

export const MAIN_FLOW: Status[] = ["pending", "accepted", "assigned", "in_progress", "completed", "closed"];

export const OPEN_STATUSES: Status[] = [
  "pending",
  "accepted",
  "assigned",
  "in_progress",
  "waiting_parts",
  "need_info",
  "completed",
];
export const DONE_STATUSES: Status[] = ["closed"];
export const CANCELLED_STATUSES: Status[] = ["cancelled", "rejected"];

export const URGENCY_LABEL: Record<Urgency, string> = {
  low: "ไม่ด่วน",
  normal: "ปกติ",
  urgent: "ด่วนมาก",
};

export const URGENCY_HINT: Record<Urgency, string> = {
  low: "รอได้ ไม่กระทบการใช้งานมาก",
  normal: "ใช้งานได้ไม่สะดวก ควรซ่อมในไม่กี่วัน",
  urgent: "อันตรายหรือกระทบคนจำนวนมาก",
};

export const URGENCY_RANK: Record<Urgency, number> = { urgent: 0, normal: 1, low: 2 };

export const ROLE_HOME: Record<Role, string> = {
  reporter: "/home",
  technician: "/tech",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  reporter: "ผู้แจ้ง",
  technician: "ช่าง",
  admin: "ผู้ดูแลระบบ",
};

/** Progress through the main flow, 0..1, for the mini progress bar. */
export function statusProgress(status: Status): number {
  const map: Partial<Record<Status, Status>> = {
    waiting_parts: "in_progress",
    need_info: "pending",
    reopened: "accepted",
  };
  const idx = MAIN_FLOW.indexOf(map[status] ?? status);
  if (idx < 0) return 0;
  return (idx + 1) / MAIN_FLOW.length;
}

export const AUTO_CLOSE_DAYS = 3;
