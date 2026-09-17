// Thai date and relative-time formatting. Safe on client and server.

const TZ = "Asia/Bangkok";

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short", year: "2-digit" }).format(new Date(d));
}

export function relativeTime(d: Date | string | null | undefined, now = Date.now()) {
  if (!d) return "";
  const diff = Math.max(0, now - new Date(d).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} วันที่แล้ว`;
  const month = Math.floor(day / 30);
  return `${month} เดือนที่แล้ว`;
}

export function firstName(fullName: string | null | undefined) {
  return (fullName ?? "").trim().split(/\s+/)[0] ?? "";
}

export function locationLabel(r: { building_name?: string | null; floor?: number | null; room_name?: string | null }) {
  return [r.building_name, r.floor != null ? `ชั้น ${r.floor}` : null, r.room_name].filter(Boolean).join(" · ");
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return "";
  const p = phone.replace(/\D/g, "");
  if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
  if (p.length === 9) return `${p.slice(0, 2)}-${p.slice(2, 5)}-${p.slice(5)}`;
  return phone;
}
