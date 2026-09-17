/**
 * Seed master data, demo accounts, and ~40 requests over the last 60 days.
 * Run after migrations: `npm run db:seed` (idempotent: it clears existing data first).
 */
import "./env";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { STATUS_LABEL, type Status } from "../lib/status";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

// Deterministic PRNG so the demo data is the same every time.
let seedState = 20260917;
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const HOUR = 3600_000;

const CATEGORIES = [
  { key: "electric", name: "ไฟฟ้า", icon: "Zap" },
  { key: "plumbing", name: "ประปา", icon: "Droplets" },
  { key: "aircon", name: "เครื่องปรับอากาศ", icon: "AirVent" },
  { key: "it", name: "อุปกรณ์ IT", icon: "Monitor" },
  { key: "furniture", name: "เฟอร์นิเจอร์", icon: "Armchair" },
  { key: "building", name: "อาคารและสถานที่", icon: "Building2" },
  { key: "other", name: "อื่น ๆ", icon: "Ellipsis" },
] as const;
type CatKey = (typeof CATEGORIES)[number]["key"];

const CAMPUSES: { name: string; buildings: { name: string; floors: number; roomsPerFloor: number; prefix?: string }[] }[] = [
  {
    name: "วิทยาเขตสวนสัก",
    buildings: [
      { name: "อาคาร CAMT", floors: 5, roomsPerFloor: 4 },
      { name: "อาคารเรียนรวม", floors: 4, roomsPerFloor: 5 },
      { name: "สำนักหอสมุด", floors: 3, roomsPerFloor: 3 },
      { name: "หอพักนักศึกษา 5", floors: 4, roomsPerFloor: 4 },
      { name: "อาคารคณะวิศวกรรมศาสตร์ 30 ปี", floors: 4, roomsPerFloor: 4 },
    ],
  },
  {
    name: "วิทยาเขตสวนดอก",
    buildings: [
      { name: "อาคารเรียนรวม คณะแพทยศาสตร์", floors: 4, roomsPerFloor: 4 },
      { name: "อาคารคณะพยาบาลศาสตร์", floors: 3, roomsPerFloor: 4 },
      { name: "หอพักนักศึกษาแพทย์", floors: 4, roomsPerFloor: 3 },
    ],
  },
  {
    name: "วิทยาเขตแม่เหียะ",
    buildings: [
      { name: "อาคารศูนย์ประชุม", floors: 2, roomsPerFloor: 3 },
      { name: "อาคารปฏิบัติการวิจัย", floors: 3, roomsPerFloor: 3 },
    ],
  },
];

const DESCRIPTIONS: Record<CatKey, { text: string; landmark?: string }[]> = {
  electric: [
    { text: "หลอดไฟกลางห้องดับ 2 หลอด ห้องค่อนข้างมืดตอนเรียนช่วงบ่าย", landmark: "แถวกลางห้อง" },
    { text: "ปลั๊กไฟใต้โต๊ะแถวหลังไม่มีไฟ เสียบชาร์จโน้ตบุ๊กไม่ได้", landmark: "โต๊ะแถวสุดท้ายฝั่งหน้าต่าง" },
    { text: "สวิตช์ไฟหน้าห้องหลวม กดแล้วมีประกายไฟ", landmark: "ข้างประตูทางเข้า" },
    { text: "ไฟทางเดินกะพริบตลอดเวลา ตอนกลางคืนมองไม่ค่อยเห็น", landmark: "ทางเดินหน้าลิฟต์" },
  ],
  plumbing: [
    { text: "ก๊อกน้ำอ่างล้างมือปิดไม่สนิท น้ำหยดตลอดเวลา", landmark: "ห้องน้ำหญิง อ่างที่ 2" },
    { text: "ชักโครกกดน้ำไม่ลง น้ำไหลค้างในถัง", landmark: "ห้องน้ำชาย ห้องสุดท้าย" },
    { text: "ท่อใต้อ่างล้างจานรั่ว มีน้ำนองพื้น เสี่ยงลื่น", landmark: "ห้องแพนทรี" },
    { text: "น้ำไหลอ่อนมากทั้งชั้น เปิดก๊อกแล้วแทบไม่มีน้ำ" },
  ],
  aircon: [
    { text: "แอร์เปิดแล้วไม่เย็น มีแต่ลมออก นักศึกษานั่งเรียนร้อนมาก", landmark: "เครื่องฝั่งหน้าต่าง" },
    { text: "แอร์มีน้ำหยดลงบนโต๊ะเรียน ต้องย้ายที่นั่ง", landmark: "เหนือโต๊ะแถวที่ 3" },
    { text: "แอร์มีเสียงดังผิดปกติเวลาเปิด เหมือนมีอะไรกระทบใบพัด" },
    { text: "รีโมตแอร์หาย และตั้งอุณหภูมิที่ตัวเครื่องไม่ได้" },
  ],
  it: [
    { text: "โปรเจกเตอร์ไม่ขึ้นภาพเมื่อเสียบสาย HDMI ลองหลายเครื่องแล้ว", landmark: "โต๊ะอาจารย์หน้าห้อง" },
    { text: "คอมพิวเตอร์เครื่องที่ 12 เปิดไม่ติด ไฟไม่เข้า", landmark: "แถวที่ 3 เครื่องที่ 12" },
    { text: "Wi-Fi @JumboPlus หลุดบ่อยในห้องนี้ เชื่อมต่อไม่ได้เกือบทั้งห้อง" },
    { text: "ไมโครโฟนไร้สายมีเสียงซ่า ใช้สอนไม่ได้" },
  ],
  furniture: [
    { text: "เก้าอี้พนักพิงหักหลายตัว นั่งแล้วไม่ปลอดภัย", landmark: "แถวหลังฝั่งขวา" },
    { text: "โต๊ะเรียนขาโยก เขียนหนังสือลำบาก" },
    { text: "ประตูตู้เก็บของหลุดจากบานพับ", landmark: "ตู้หลังห้อง" },
  ],
  building: [
    { text: "ฝ้าเพดานมีรอยน้ำซึมและเริ่มโป่ง กลัวจะหล่นลงมา", landmark: "มุมห้องด้านหลัง" },
    { text: "ผนังมีรอยร้าวยาวตั้งแต่ขอบหน้าต่างลงมา" },
    { text: "ประตูห้องปิดไม่ได้ ลูกบิดชำรุด", landmark: "ประตูหลัง" },
    { text: "กระเบื้องพื้นทางเดินแตกและยกตัว เดินสะดุดง่าย", landmark: "หน้าบันไดหนีไฟ" },
  ],
  other: [
    { text: "มีรังผึ้งขนาดใหญ่ใต้ชายคาหน้าอาคาร นักศึกษาเดินผ่านบ่อย", landmark: "หน้าทางเข้าหลัก" },
    { text: "ป้ายบอกทางหนีไฟหลุดออกจากผนัง" },
  ],
};

const IMAGE_BY_CAT: Record<CatKey, string> = {
  electric: "light",
  plumbing: "pipe",
  aircon: "aircon",
  it: "computer",
  furniture: "chair",
  building: "wall",
  other: "wall",
};

const CAUSES: Record<CatKey, { cause: string; parts?: string }[]> = {
  electric: [
    { cause: "บัลลาสต์หลอดไฟเสื่อม", parts: "บัลลาสต์อิเล็กทรอนิกส์ 2 ตัว, หลอด LED T8 2 หลอด" },
    { cause: "สายไฟในเต้ารับหลวม", parts: "เต้ารับคู่ 1 ชุด" },
  ],
  plumbing: [
    { cause: "ซีลยางในก๊อกเสื่อม", parts: "ซีลยาง 2 ชิ้น" },
    { cause: "ลูกลอยชักโครกค้าง", parts: "ชุดลูกลอย 1 ชุด" },
  ],
  aircon: [
    { cause: "น้ำยาแอร์รั่วและคอยล์ร้อนสกปรก", parts: "น้ำยา R32 1 กก." },
    { cause: "ท่อน้ำทิ้งตัน", parts: undefined },
  ],
  it: [
    { cause: "สาย HDMI ในรางชำรุด", parts: "สาย HDMI 10 ม. 1 เส้น" },
    { cause: "Power supply เสีย", parts: "Power supply 500W 1 ตัว" },
  ],
  furniture: [{ cause: "น็อตยึดหลุดและโครงเหล็กงอ", parts: "น็อตพร้อมแหวน 8 ชุด" }],
  building: [{ cause: "รอยต่อหลังคารั่วซึม", parts: "ซิลิโคนกันรั่ว 2 หลอด, แผ่นฝ้า 2 แผ่น" }],
  other: [{ cause: "ประสานหน่วยงานที่เกี่ยวข้องดำเนินการเรียบร้อย" }],
};

const RATING_COMMENTS = ["ช่างมาเร็วมาก ขอบคุณครับ", "ซ่อมเรียบร้อยดีค่ะ", "", "ใช้เวลานานไปนิด แต่งานดี", "ขอบคุณที่ช่วยดูแลครับ", ""];

function yymmBangkok(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "2-digit", month: "2-digit" }).formatToParts(d);
  return parts.find((p) => p.type === "year")!.value + parts.find((p) => p.type === "month")!.value;
}

type Plan =
  | "closed"
  | "completed"
  | "in_progress"
  | "waiting_parts"
  | "assigned"
  | "accepted"
  | "pending"
  | "need_info"
  | "cancelled"
  | "rejected";

async function main() {
  console.log("Clearing data...");
  await sql`truncate notifications, ratings, info_requests, repair_notes, status_history, request_followers,
    request_images, requests, request_code_counters, rooms, buildings, campuses, technician_skills,
    categories, users restart identity cascade`;

  const hash = await bcrypt.hash("demo1234", 10);

  // Categories
  const catIds = {} as Record<CatKey, number>;
  for (const [i, c] of CATEGORIES.entries()) {
    const [row] = await sql`insert into categories (name_th, icon, sort_order) values (${c.name}, ${c.icon}, ${i}) returning id`;
    catIds[c.key] = row.id;
  }

  // Locations
  const rooms: { id: number; buildingName: string; buildingId: number; floor: number; name: string }[] = [];
  for (const campus of CAMPUSES) {
    const [c] = await sql`insert into campuses (name_th) values (${campus.name}) returning id`;
    for (const b of campus.buildings) {
      const [bRow] = await sql`insert into buildings (campus_id, name_th) values (${c.id}, ${b.name}) returning id`;
      for (let f = 1; f <= b.floors; f++) {
        for (let r = 1; r <= b.roomsPerFloor; r++) {
          const name = `ห้อง ${f}${String(r).padStart(2, "0")}`;
          const [room] = await sql`insert into rooms (building_id, floor, name_th) values (${bRow.id}, ${f}, ${name}) returning id`;
          rooms.push({ id: room.id, buildingName: b.name, buildingId: bRow.id, floor: f, name });
        }
      }
    }
  }

  // Users
  const insertUser = async (u: {
    username: string;
    role: string;
    full_name: string;
    user_type?: string;
    faculty?: string;
    phone?: string;
    profile_completed: boolean;
  }) => {
    const [row] = await sql`
      insert into users (username, password_hash, role, full_name, user_type, faculty, phone, profile_completed, pdpa_accepted_at)
      values (${u.username}, ${hash}, ${u.role}, ${u.full_name}, ${u.user_type ?? null}, ${u.faculty ?? null},
              ${u.phone ?? null}, ${u.profile_completed}, ${u.profile_completed ? new Date(Date.now() - 90 * 24 * HOUR) : null})
      returning id`;
    return row.id as string;
  };

  // student01 is intentionally fresh so the demo shows first-time profile setup and PDPA consent.
  await insertUser({ username: "student01", role: "reporter", full_name: "", profile_completed: false });
  const staff01 = await insertUser({
    username: "staff01",
    role: "reporter",
    full_name: "ศิริพร คำแสน",
    user_type: "staff",
    faculty: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)",
    phone: "0812345601",
    profile_completed: true,
  });
  const tech01 = await insertUser({ username: "tech01", role: "technician", full_name: "สมศักดิ์ ใจดี", phone: "0891112201", profile_completed: true });
  const tech02 = await insertUser({ username: "tech02", role: "technician", full_name: "วิชัย ศรีสุข", phone: "0891112202", profile_completed: true });
  const tech03 = await insertUser({ username: "tech03", role: "technician", full_name: "ธนากร แก้วมณี", phone: "0891112203", profile_completed: true });
  const admin01 = await insertUser({ username: "admin01", role: "admin", full_name: "พรทิพย์ วงศ์ใหญ่", phone: "053941000", profile_completed: true });

  const skills: [string, CatKey[]][] = [
    [tech01, ["electric", "aircon"]],
    [tech02, ["plumbing", "building", "furniture"]],
    [tech03, ["it", "other", "electric"]],
  ];
  for (const [tid, cats] of skills) {
    for (const k of cats) await sql`insert into technician_skills values (${tid}, ${catIds[k]})`;
  }
  const techFor = (k: CatKey) => {
    const matches = skills.filter(([, cats]) => cats.includes(k)).map(([id]) => id);
    return matches.length ? pick(matches) : tech02;
  };

  const extraReporters: string[] = [staff01];
  const people = [
    ["student02", "ณัฐวุฒิ ปัญญาดี", "student", "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)"],
    ["student03", "กมลชนก อินทร์แก้ว", "student", "คณะวิศวกรรมศาสตร์"],
    ["student04", "ภูริภัทร สายสุวรรณ", "student", "คณะบริหารธุรกิจ"],
    ["student05", "พิมพ์ชนก ทองดี", "student", "คณะแพทยศาสตร์"],
    ["student06", "ธนภัทร มณีวงศ์", "student", "คณะพยาบาลศาสตร์"],
    ["staff02", "อรุณี บุญมา", "staff", "สำนักหอสมุด"],
    ["staff03", "ประเสริฐ ชัยวงค์", "staff", "กองกิจการนักศึกษา"],
  ];
  for (const [i, [username, name, type, faculty]] of people.entries()) {
    extraReporters.push(
      await insertUser({ username, role: "reporter", full_name: name, user_type: type, faculty, phone: `08123456${String(i + 10)}`, profile_completed: true }),
    );
  }

  // Requests: older ones mostly closed, newer ones spread across open statuses.
  const plans: Plan[] = [
    ...Array<Plan>(17).fill("closed"),
    "cancelled", "rejected", "closed", "closed",
    "completed", "completed", "completed",
    "waiting_parts", "waiting_parts",
    "in_progress", "in_progress", "in_progress",
    "assigned", "assigned", "assigned",
    "accepted", "accepted", "need_info", "cancelled",
    "rejected", "pending", "pending", "pending", "pending",
  ];
  const now = Date.now();
  const total = plans.length;
  // Avoid seeding an open air-con request on CAMT room 301 so the demo's first submission is not a duplicate.
  const camt301 = rooms.find((r) => r.buildingName === "อาคาร CAMT" && r.name === "ห้อง 301")!;
  const weightedRooms = [...rooms, ...rooms.filter((r) => r.buildingName === "อาคาร CAMT"), ...rooms.filter((r) => r.buildingName === "อาคารเรียนรวม")];

  const counters = new Map<string, number>();
  const tsAfter = (t: number, minH: number, maxH: number) => Math.min(t + between(minH, maxH) * HOUR, now - 5 * 60_000);

  for (let i = 0; i < total; i++) {
    const plan = plans[i];
    const ageDays = 59 - (i / (total - 1)) * 58.6 + between(-0.4, 0.4);
    const created = now - Math.max(0.05, ageDays) * 24 * HOUR;
    const catKey = pick(CATEGORIES.map((c) => c.key).filter((k) => k !== "other" || rand() < 0.3)) as CatKey;
    let room = pick(weightedRooms);
    if (room.id === camt301.id && catKey === "aircon") room = rooms[0];
    const desc = pick(DESCRIPTIONS[catKey]);
    const urgency = rand() < 0.22 ? "urgent" : rand() < 0.25 ? "low" : "normal";
    const reporter = pick(extraReporters);
    const tech = techFor(catKey);

    const history: { from: string | null; to: string; at: number; actor: string; note?: string }[] = [];
    let t = created;
    history.push({ from: null, to: "pending", at: t, actor: reporter });
    const step = (to: string, minH: number, maxH: number, actor: string, note?: string) => {
      t = tsAfter(t, minH, maxH);
      history.push({ from: history[history.length - 1].to, to, at: t, actor, note });
    };

    let status: string = "pending";
    let assigned: string | null = null;
    let completedAt = null as number | null;
    let closedAt = null as number | null;
    let rejectReason: string | null = null;
    let statusBeforeInfo: string | null = null;

    const flowTo = (target: Plan) => {
      const order = ["accepted", "assigned", "in_progress", "completed", "closed"];
      for (const s of order) {
        if (s === "accepted") step("accepted", 0.3, urgency === "urgent" ? 1 : 8, admin01);
        if (s === "assigned") {
          step("assigned", 0.2, 4, admin01);
          assigned = tech;
        }
        if (s === "in_progress") step("in_progress", 0.5, urgency === "urgent" ? 3 : 20, tech);
        if (s === "completed") {
          if (target !== "in_progress" && rand() < 0.25) {
            step("waiting_parts", 1, 6, tech, "สั่งอะไหล่จากผู้จำหน่ายแล้ว");
            step("in_progress", 12, 60, tech);
          }
          step("completed", 1, 30, tech);
          completedAt = t;
        }
        if (s === "closed") {
          step("closed", 1, 60, reporter, "ผู้แจ้งยืนยันว่าซ่อมเสร็จ");
          closedAt = t;
        }
        status = s;
        if (s === target) return;
      }
    };

    switch (plan) {
      case "closed":
      case "completed":
      case "in_progress":
      case "assigned":
      case "accepted":
        flowTo(plan);
        break;
      case "waiting_parts":
        flowTo("in_progress");
        step("waiting_parts", 1, 8, tech, "รออะไหล่จากผู้จำหน่าย 2-3 วัน");
        status = "waiting_parts";
        break;
      case "need_info":
        step("need_info", 0.5, 3, admin01, "ช่วยระบุหมายเลขเครื่องหรือแนบรูปมุมกว้างเพิ่มเติม");
        status = "need_info";
        statusBeforeInfo = "pending";
        break;
      case "cancelled":
        step("cancelled", 0.1, 2, reporter, "แก้ไขได้เองแล้ว");
        status = "cancelled";
        break;
      case "rejected":
        step("accepted", 0.5, 4, admin01);
        rejectReason = "อยู่นอกความรับผิดชอบของงานอาคารสถานที่ กรุณาติดต่อผู้ให้บริการหอพักเอกชนโดยตรง";
        step("rejected", 0.5, 4, admin01, rejectReason);
        status = "rejected";
        break;
      case "pending":
        break;
    }

    // Keep a few completed ones fresh so they do not auto-close during the demo.
    if (plan === "completed" && completedAt !== null && now - completedAt > 2 * 24 * HOUR) {
      const shift = now - completedAt - between(2, 30) * HOUR;
      for (const h of history) h.at += shift;
      completedAt += shift;
    }
    const updated = history[history.length - 1].at;
    const createdAt = new Date(history[0].at);
    const yymm = yymmBangkok(createdAt);
    const n = (counters.get(yymm) ?? 0) + 1;
    counters.set(yymm, n);
    const code = `MR-${yymm}-${String(n).padStart(4, "0")}`;

    const [req] = await sql`
      insert into requests (code, reporter_id, category_id, room_id, landmark, description, urgency, status, status_before_info,
        assigned_technician_id, reject_reason, created_at, updated_at, completed_at, closed_at)
      values (${code}, ${reporter}, ${catIds[catKey]}, ${room.id}, ${desc.landmark ?? null}, ${desc.text}, ${urgency}, ${status},
        ${statusBeforeInfo}, ${assigned}, ${rejectReason}, ${createdAt}, ${new Date(updated)},
        ${completedAt ? new Date(completedAt) : null}, ${closedAt ? new Date(closedAt) : null})
      returning id`;

    for (const h of history) {
      await sql`insert into status_history (request_id, from_status, to_status, actor_id, note, created_at)
        values (${req.id}, ${h.from}, ${h.to}, ${h.actor}, ${h.note ?? null}, ${new Date(h.at)})`;
    }
    await sql`insert into request_images (request_id, url, kind, created_at) values (${req.id}, ${`/seed/${IMAGE_BY_CAT[catKey]}-before.jpg`}, 'before', ${createdAt})`;
    if (plan === "need_info") {
      await sql`insert into info_requests (request_id, asked_by, question, created_at)
        values (${req.id}, ${admin01}, ${"ช่วยระบุหมายเลขเครื่องหรือแนบรูปมุมกว้างเพิ่มเติม"}, ${new Date(updated)})`;
    }
    if (completedAt) {
      const c = pick(CAUSES[catKey]);
      await sql`insert into request_images (request_id, url, kind, created_at) values (${req.id}, ${`/seed/${IMAGE_BY_CAT[catKey]}-after.jpg`}, 'after', ${new Date(completedAt)})`;
      await sql`insert into repair_notes (request_id, cause, parts_used, technician_id, created_at)
        values (${req.id}, ${c.cause}, ${c.parts ?? null}, ${tech}, ${new Date(completedAt)})`;
    }
    if (closedAt && rand() < 0.85) {
      const score = rand() < 0.55 ? 5 : rand() < 0.7 ? 4 : 3;
      await sql`insert into ratings (request_id, score, comment, created_at) values (${req.id}, ${score}, ${pick(RATING_COMMENTS) || null}, ${new Date(closedAt)})`;
    }
    // A few notifications so bells are not empty for seeded users.
    if (i >= total - 12) {
      const last = history[history.length - 1];
      await sql`insert into notifications (user_id, request_id, type, title, body, read_at, created_at)
        values (${reporter}, ${req.id}, ${last.to}, ${STATUS_LABEL[last.to as Status]}, ${`คำร้อง ${code} · ${room.buildingName} ${room.name}`}, ${rand() < 0.5 ? new Date() : null}, ${new Date(last.at)})`;
    }
  }

  for (const [yymm, value] of counters) {
    await sql`insert into request_code_counters (yymm, last_value) values (${yymm}, ${value})`;
  }

  console.log(`Seeded ${rooms.length} rooms, ${total} requests.`);
  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
