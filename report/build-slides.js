// Builds out/สไลด์-FastFix-CMU.pptx — 15 slides covering all 8 assessment criteria.
// Run: npm run slides   (run `npm run diagrams` first so out/diagrams/*.png exist)
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

const DIA = (n) => path.join(__dirname, "out", "diagrams", `${n}.png`);
// Slide-sized diagrams: tall ones laid out in columns, plus one use case view per actor.
// Made by `python tools/slide-images.py`; falls back to the report diagram when it is missing.
const SLIDE_DIA = (n) => {
  const f = path.join(__dirname, "out", "diagrams", "slide", `${n}.png`);
  return fs.existsSync(f) ? f : DIA(n);
};
const SCR = (n) => path.join(__dirname, "screens", `${n}.png`);
const ORB = (n) => path.join(__dirname, "assets", `orb-${n}.png`);
const BRAND = (n) => path.join(__dirname, "..", "public", "brand", `${n}.png`);
const URL = "https://fastfix-cmu.vercel.app";

const FONT = "Leelawadee UI";
const C = {
  brand: "5B2C83",
  lilac: "B49CF0",
  lilacSoft: "EFE6FA",
  tint: "F4EEFB",
  ink: "111114",
  black: "0E0E11",
  muted: "6B6B73",
  dim: "A7A1B4",
  white: "FFFFFF",
  line: "E7E0EF",
  green: "17693A",
  greenTint: "E5F6EA",
  orange: "9A4A00",
  orangeTint: "FFF1E0",
  blue: "0A58CA",
  blueTint: "E6F0FF",
};
const W = 13.333;
const H = 7.5;
const M = 0.72; // page margin

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.title = "FastFix CMU — ระบบแจ้งซ่อมอัจฉริยะ มหาวิทยาลัยเชียงใหม่";
pptx.author = "FastFix CMU";
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };

// ---------- helpers ----------
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

/** Fit an image inside a box, centered — never stretched. */
function img(s, file, x, y, w, h) {
  const p = pngSize(file);
  const k = Math.min(w / p.w, h / p.h);
  const iw = p.w * k;
  const ih = p.h * k;
  s.addImage({ path: file, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih });
  return { x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih };
}

function card(s, x, y, w, h, o = {}) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: o.fill || C.white },
    line: o.line ? { color: o.line, width: 1 } : { color: o.fill || C.white },
    rectRadius: o.r ?? 0.16,
  });
}

let n = 0;
/** A page: white by default, dark for cover and divider-style slides. */
function page(o = {}) {
  const s = pptx.addSlide();
  const dark = !!o.dark;
  s.background = { color: dark ? C.black : o.bg || C.white };
  n++;
  if (o.orbs !== false) {
    if (dark) {
      s.addImage({ path: ORB("lg"), x: W - 3.1, y: -1.5, w: 4.6, h: 4.6, transparency: 55 });
      s.addImage({ path: ORB("sm"), x: -0.7, y: H - 2.1, w: 2.4, h: 2.4, transparency: 65 });
    } else {
      s.addImage({ path: ORB("md"), x: W - 1.9, y: -1.1, w: 3.2, h: 3.2, transparency: 45 });
    }
  }
  if (o.label) s.addText(o.label, { x: M, y: 0.44, w: 9, h: 0.3, fontFace: FONT, fontSize: 12, color: dark ? C.dim : C.muted, charSpacing: 0.6 });
  if (o.title) {
    s.addText(
      o.title.map((t) => (typeof t === "string" ? { text: t, options: { color: dark ? C.white : C.ink, bold: true } } : { text: t.t, options: { color: t.c || C.lilac, bold: true } })),
      { x: M - 0.05, y: 0.78, w: W - 2 * M + 0.1, h: 0.78, fontFace: FONT, fontSize: o.size || 30, color: dark ? C.white : C.ink, bold: true },
    );
  }
  if (o.sub) s.addText(o.sub, { x: M, y: 1.52, w: W - 2 * M - 1, h: 0.34, fontFace: FONT, fontSize: 14.5, color: dark ? C.dim : C.muted });
  if (!o.nopage) s.addText(String(n).padStart(2, "0"), { x: W - 1.05, y: H - 0.62, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 11, color: dark ? C.dim : C.muted, align: "right" });
  return s;
}

/** Check list with a purple tick, like the reference deck. */
function checks(s, items, x, y, w, o = {}) {
  const size = o.size || 14.5;
  const gap = o.gap || 0.42;
  items.forEach((t, i) => {
    s.addText("✓", { x, y: y + i * gap, w: 0.26, h: 0.34, fontFace: FONT, fontSize: size - 1, bold: true, color: o.tick || C.brand });
    s.addText(t, { x: x + 0.3, y: y + i * gap, w: w - 0.3, h: 0.34, fontFace: FONT, fontSize: size, color: o.color || C.ink });
  });
}

function chip(s, text, x, y, o = {}) {
  const w = o.w || 1.55;
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.38, fill: { color: o.fill || C.tint }, line: { color: o.fill || C.tint }, rectRadius: 0.19 });
  s.addText(text, { x, y, w, h: 0.38, fontFace: FONT, fontSize: 11.5, bold: true, color: o.color || C.brand, align: "center", valign: "middle" });
}

function caption(s, text, x, y, w) {
  s.addText(text, { x, y, w, h: 0.3, fontFace: FONT, fontSize: 12, color: C.muted, align: "center" });
}

// ---------- 01 · Cover ----------
{
  const s = page({ dark: true, nopage: true });
  s.addImage({ path: BRAND("fastfix-wordmark-white"), x: M, y: 0.72, w: 2.75, h: 0.53 });
  s.addText("954244 การวิเคราะห์และออกแบบระบบสำหรับการบริหารจัดการสมัยใหม่ · ภาคการศึกษาที่ 1/2569", {
    x: M, y: 1.62, w: 9.5, h: 0.32, fontFace: FONT, fontSize: 13.5, color: C.dim,
  });
  s.addText(
    [
      { text: "แจ้งซ่อม ติดตาม ปิดงาน\n", options: { color: C.white, bold: true } },
      { text: "ครบ", options: { color: C.white, bold: true } },
      { text: "ในระบบเดียว", options: { color: C.lilac, bold: true } },
    ],
    { x: M - 0.05, y: 2.1, w: 8.4, h: 1.9, fontFace: FONT, fontSize: 44, bold: true, lineSpacingMultiple: 1.1 },
  );
  s.addText("Smart CMU Maintenance Request System · ระบบแจ้งซ่อมอัจฉริยะ มหาวิทยาลัยเชียงใหม่", {
    x: M, y: 4.08, w: 8.6, h: 0.4, fontFace: FONT, fontSize: 16, color: C.dim,
  });
  const team = [
    ["ตรีรัตน์ จอมพันธ์", "682110032"],
    ["พจณิชา ทองย้อย", "682110061"],
    ["ภานิชา ศรีกระจ่าง", "682110073"],
    ["สุภาวิกา นันทสุวรรณ", "682110095"],
  ];
  team.forEach(([name, code], i) => {
    const x = M + i * 2.05;
    s.addText(name, { x, y: 5.25, w: 1.95, h: 0.3, fontFace: FONT, fontSize: 13.5, bold: true, color: C.white });
    s.addText(code, { x, y: 5.55, w: 1.95, h: 0.28, fontFace: FONT, fontSize: 12, color: C.dim });
  });
  s.addShape(pptx.ShapeType.line, { x: M, y: 5.08, w: 8.1, h: 0, line: { color: "2E2A36", width: 1 } });
  s.addText(`ต้นแบบใช้งานจริง · ${URL}`, { x: M, y: 6.25, w: 8.6, h: 0.35, fontFace: FONT, fontSize: 13.5, color: C.lilac });
  card(s, 9.3, 1.1, 3.3, 5.3, { fill: "17131F", r: 0.22 });
  img(s, SLIDE_DIA("cover-phone"), 9.55, 1.35, 2.8, 4.8);
}

// ---------- 02 · Background and problem ----------
{
  const s = page({ label: "1 · ความเป็นมาและปัญหา", title: ["ระบบเดิมทำให้งานซ่อม ", { t: "ตกหล่นและติดตามไม่ได้" }] });
  const probs = [
    ["ช่องทางกระจัดกระจาย", "โทรศัพท์ กระดาษ และแชต ข้อมูลตกหล่น ไม่มีผู้รับผิดชอบชัดเจน"],
    ["ข้อมูลไม่ครบถ้วน", "ไม่มีรูปภาพ ระบุห้องไม่ชัด ช่างต้องเสียเวลาไปสำรวจซ้ำ"],
    ["ติดตามไม่ได้", "ผู้แจ้งไม่ทราบความคืบหน้า ต้องโทรสอบถามซ้ำซ้อน"],
    ["แจ้งซ้ำ งานไม่สมดุล", "ปัญหาเดียวกันแจ้งหลายครั้ง งานกระจุกที่ช่างบางคน"],
    ["ไม่มีการยืนยันผล", "ไม่ทราบว่าซ่อมแล้วปัญหาหายจริงหรือไม่"],
    ["ไม่มีสถิติ", "ผู้บริหารไม่มีข้อมูลจริงสำหรับวางแผนงบประมาณ"],
  ];
  probs.forEach(([t, d], i) => {
    const x = M + (i % 3) * 4.08;
    const y = 2.1 + Math.floor(i / 3) * 2.42;
    card(s, x, y, 3.82, 2.18, { fill: i === 0 ? C.tint : "F6F5F8" });
    s.addText(String(i + 1).padStart(2, "0"), { x: x + 0.32, y: y + 0.24, w: 1, h: 0.32, fontFace: FONT, fontSize: 14, bold: true, color: C.brand });
    s.addText(t, { x: x + 0.32, y: y + 0.63, w: 3.2, h: 0.45, fontFace: FONT, fontSize: 18, bold: true, color: C.ink });
    s.addText(d, { x: x + 0.32, y: y + 1.14, w: 3.2, h: 0.85, fontFace: FONT, fontSize: 13.5, color: C.muted, valign: "top" });
  });
}

// ---------- 03 · Objectives and scope ----------
{
  const s = page({ label: "1 · วัตถุประสงค์และขอบเขต", title: ["ระบบเดียว ตั้งแต่ ", { t: "แจ้งจนปิดงาน" }] });
  card(s, M, 2.1, 6.6, 4.6, { fill: C.tint });
  s.addText("วัตถุประสงค์", { x: M + 0.38, y: 2.34, w: 5.8, h: 0.36, fontFace: FONT, fontSize: 17, bold: true, color: C.brand });
  checks(s, [
    "สร้างระบบแจ้งซ่อมแบบรวมศูนย์ ตั้งแต่แจ้งจนปิดงาน",
    "แจ้งซ่อมพร้อมรูปถ่ายและระบุสถานที่ได้ใน 3 นาที",
    "ติดตามสถานะแบบเรียลไทม์ และให้ผู้แจ้งยืนยันผลเอง",
    "ช่างดูงานและอัปเดตสถานะผ่านสมาร์ตโฟนได้",
    "ผู้ดูแลระบบคัดกรอง มอบหมายงาน และดูแดชบอร์ด",
    "ประยุกต์ใช้ Agile (Scrum) พัฒนาต้นแบบที่ใช้งานได้จริง",
  ], M + 0.38, 2.86, 5.9, { gap: 0.6, size: 14 });

  card(s, 7.68, 2.1, 4.94, 2.6, { fill: C.white, line: C.line });
  s.addText("อยู่ในขอบเขต", { x: 8.02, y: 2.3, w: 4.3, h: 0.34, fontFace: FONT, fontSize: 16, bold: true, color: C.ink });
  checks(s, [
    "ฟังก์ชันหลัก 3 ส่วน + แดชบอร์ดผู้ดูแลระบบ",
    "ส่งออกรายงาน Excel และ PDF ภาษาไทย",
    "ข้อมูลจริง 3 วิทยาเขต 157 อาคาร 965 ห้อง",
  ], 8.02, 2.76, 4.3, { gap: 0.52, size: 13.5 });

  card(s, 7.68, 4.86, 4.94, 1.84, { fill: C.black });
  s.addText("นอกขอบเขต · รอบถัดไป", { x: 8.02, y: 5.06, w: 4.3, h: 0.34, fontFace: FONT, fontSize: 16, bold: true, color: C.white });
  s.addText("CMU OAuth จริง · LINE OA · AI จัดประเภทคำร้องอัตโนมัติ · QR Code ประจำห้อง", {
    x: 8.02, y: 5.46, w: 4.3, h: 1.0, fontFace: FONT, fontSize: 13.5, color: C.dim, valign: "top",
  });
}

// ---------- 04 · Stakeholders and users ----------
{
  const s = page({ label: "1 · ผู้มีส่วนได้ส่วนเสียและผู้ใช้", title: ["3 บทบาท ", { t: "3 รูปแบบการใช้งาน" }] });
  const roles = [
    ["ผู้แจ้ง", "นักศึกษาและบุคลากร", "มือถือ", ["แจ้งซ่อมพร้อมรูปและสถานที่", "ติดตามสถานะคำร้อง", "ยืนยันผลและให้คะแนน"], "ใช้ไม่บ่อย ต้องเร็วและเข้าใจง่าย"],
    ["ช่าง", "ช่างซ่อมบำรุง", "มือถือ", ["ดูงานที่ได้รับมอบหมาย", "รับงานและแจ้งรออะไหล่", "บันทึกผลพร้อมรูปหลังซ่อม"], "ทำงานนอกสถานที่ เดินระหว่างอาคาร"],
    ["ผู้ดูแลระบบ", "เจ้าหน้าที่อาคารสถานที่", "คอมพิวเตอร์", ["คัดกรองและมอบหมายงาน", "ดูแดชบอร์ดสรุปผล", "ส่งออกรายงาน Excel/PDF"], "จัดการคำร้องจำนวนมากต่อเนื่อง"],
  ];
  roles.forEach(([r, who, dev, tasks, trait], i) => {
    const x = M + i * 4.08;
    const dark = i === 2;
    card(s, x, 2.1, 3.82, 3.5, { fill: dark ? C.black : i === 0 ? C.tint : "F6F5F8" });
    s.addText(r, { x: x + 0.32, y: 2.3, w: 3.2, h: 0.5, fontFace: FONT, fontSize: 23, bold: true, color: dark ? C.white : C.brand });
    s.addText(`${who} · ${dev}`, { x: x + 0.32, y: 2.82, w: 3.2, h: 0.32, fontFace: FONT, fontSize: 13, color: dark ? C.dim : C.muted });
    checks(s, tasks, x + 0.32, 3.3, 3.25, { size: 13.5, gap: 0.46, color: dark ? C.white : C.ink, tick: dark ? C.lilac : C.brand });
    s.addText(trait, { x: x + 0.32, y: 4.86, w: 3.2, h: 0.6, fontFace: FONT, fontSize: 12.5, italic: true, color: dark ? C.dim : C.muted, valign: "top" });
  });
  card(s, M, 5.8, 11.89, 1.1, { fill: C.white, line: C.line });
  s.addText("ผู้มีส่วนได้ส่วนเสียอื่น", { x: M + 0.34, y: 5.96, w: 2.6, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: C.brand });
  s.addText("ผู้บริหารมหาวิทยาลัย (รายงานและสถิติเพื่อวางแผนงบประมาณ) · ITSC (ความปลอดภัยและการเชื่อมต่อ CMU Account) · เจ้าหน้าที่ PDPA (คุ้มครองข้อมูลส่วนบุคคล)", {
    x: M + 0.34, y: 6.26, w: 11.2, h: 0.5, fontFace: FONT, fontSize: 12.5, color: C.muted, valign: "top",
  });
}

// ---------- 05 · Functional requirements ----------
{
  const s = page({ label: "2 · ความต้องการเชิงฟังก์ชัน", title: ["ฟังก์ชันหลัก 3 ฟังก์ชัน และ ", { t: "ฟังก์ชันเพิ่มเติมของทีม" }] });
  const fns = [
    ["ฟังก์ชันหลักที่ 1", "ส่งคำร้องแจ้งซ่อม", ["ฟอร์ม 4 ขั้นตอน: ประเภท สถานที่ รายละเอียด ตรวจสอบ", "แนบรูปถ่ายปัญหา 1–3 รูป", "ตรวจพบคำร้องซ้ำ แล้วกดติดตามแทนการแจ้งใหม่"], false],
    ["ฟังก์ชันหลักที่ 2", "ติดตามสถานะคำร้อง", ["ไทม์ไลน์อัปเดตแบบเรียลไทม์", "ยกเลิกคำร้อง และตอบคำถามเพิ่มเติม", "ยืนยันผล ให้คะแนนดาว หรือแจ้งว่ายังไม่หาย"], false],
    ["ฟังก์ชันหลักที่ 3", "ดูงานและอัปเดตสถานะของช่าง", ["รายการงานเรียงตามความเร่งด่วน", "รับงาน · รออะไหล่ · ซ่อมเสร็จ", "บันทึกผลพร้อมรูปหลังซ่อม และโทรหาผู้แจ้ง"], false],
    ["ฟังก์ชันเพิ่มเติม", "แดชบอร์ดผู้ดูแลระบบ", ["คัดกรอง มอบหมายช่าง และรวมคำร้องซ้ำ", "ตัวชี้วัด 5 ตัว และกราฟวิเคราะห์ 5 ด้าน", "ส่งออกรายงาน Excel และ PDF ภาษาไทย"], true],
  ];
  fns.forEach(([tag, title, items, extra], i) => {
    const x = M + i * 3.04;
    card(s, x, 2.1, 2.82, 4.5, { fill: extra ? C.black : C.white, line: extra ? null : C.line });
    chip(s, tag, x + 0.26, 2.32, { w: 1.85, fill: extra ? "241E2E" : C.tint, color: extra ? C.lilac : C.brand });
    s.addText(title, { x: x + 0.26, y: 2.82, w: 2.34, h: 0.9, fontFace: FONT, fontSize: 17, bold: true, color: extra ? C.white : C.ink, valign: "top" });
    checks(s, items, x + 0.26, 3.78, 2.34, { size: 13, gap: 0.88, color: extra ? C.white : C.ink, tick: extra ? C.lilac : C.brand });
  });
  s.addText("ทุกบทบาทใช้ร่วมกัน: เข้าสู่ระบบด้วย CMU Account (จำลอง) · ระบบแจ้งเตือน · ลืมรหัสผ่าน", {
    x: M, y: 6.88, w: 11.9, h: 0.3, fontFace: FONT, fontSize: 12.5, color: C.muted,
  });
}

// ---------- 06 · Non-functional requirements ----------
{
  const s = page({ label: "2 · ความต้องการที่ไม่ใช่ฟังก์ชัน", title: ["วัดผลได้จริง ", { t: "ใน 4 ด้านหลัก" }] });
  const nfr = [
    ["ความปลอดภัย", C.brand, C.tint, ["เซสชันหมดเวลาอัตโนมัติใน 30 นาที", "ตรวจสอบสิทธิ์และสถานะฝั่งเซิร์ฟเวอร์", "เข้ารหัสรหัสผ่าน bcrypt และใช้ HTTPS", "เบอร์ผู้แจ้งเห็นเฉพาะช่างที่รับงาน", "ยินยอม PDPA ก่อนใช้งานครั้งแรก", "แยกบทบาทฐานข้อมูล (smartcmu_app)"]],
    ["ประสิทธิภาพ", C.blue, C.blueTint, ["โหลดหน้าเว็บเร็ว", "รูปภาพไม่เกิน 1 MB อัปโหลดเสร็จใน 5 วินาที", "สถานะอัปเดตถึงผู้ใช้อื่นภายใน 5 วินาที", "เซิร์ฟเวอร์ตั้งที่สิงคโปร์ (sin1)"]],
    ["การใช้งาน", C.green, C.greenTint, ["รองรับทุกขนาดจอ เริ่มที่ 360 px", "มีเลย์เอาต์เฉพาะสำหรับเดสก์ท็อป", "ออกแบบให้แจ้งซ่อมเสร็จใน 3 นาที", "รองรับโหมดลดภาพเคลื่อนไหว"]],
    ["การบำรุงรักษา", C.orange, C.orangeTint, ["ผิดพลาดแล้วลองใหม่ได้ ข้อมูลที่กรอกไม่หาย", "แก้ไขข้อมูลพื้นฐานผ่านหน้าผู้ดูแลระบบ", "รองรับ Chrome, Safari และ Edge"]],
  ];
  nfr.forEach(([t, color, tint, items], i) => {
    const x = M + (i % 2) * 6.08;
    const y = 2.1 + Math.floor(i / 2) * 2.42;
    card(s, x, y, 5.82, 2.18, { fill: C.white, line: C.line });
    s.addShape(pptx.ShapeType.roundRect, { x: x + 0.3, y: y + 0.28, w: 1.9, h: 0.4, fill: { color: tint }, line: { color: tint }, rectRadius: 0.2 });
    s.addText(t, { x: x + 0.3, y: y + 0.28, w: 1.9, h: 0.4, fontFace: FONT, fontSize: 12.5, bold: true, color, align: "center", valign: "middle" });
    s.addText(
      items.map((it) => ({ text: it, options: { bullet: { code: "2022", indent: 14 }, paraSpaceAfter: 2 } })),
      { x: x + 0.34, y: y + 0.78, w: 5.2, h: 1.3, fontFace: FONT, fontSize: 12, color: C.muted, valign: "top", lineSpacingMultiple: 1.0 },
    );
  });
}

// ---------- 07 · Agile ----------
{
  const s = page({ label: "3 · การประยุกต์ใช้ Agile", title: ["4 Sprint ", { t: "ส่งมอบทีละฟังก์ชัน" }], sub: "รอบละ 1–2 วัน แต่ละ Sprint ส่งมอบฟังก์ชันที่ทดสอบได้จริงตามลำดับความสำคัญ" });
  const sprints = [
    ["Sprint 1", "ส่งคำร้องแจ้งซ่อม", "เข้าสู่ระบบ ตั้งค่าโปรไฟล์/PDPA · ฟอร์มแจ้งซ่อมและเลือกสถานที่ · แนบรูปและบีบอัดภาพ · สร้างรหัสคำร้องอัตโนมัติ", "หน้าจอแจ้งซ่อมที่บันทึกข้อมูลและรูปได้จริง"],
    ["Sprint 2", "ติดตามสถานะคำร้อง", "ประวัติคำร้อง ค้นหาและกรอง · ไทม์ไลน์เรียลไทม์ · ยกเลิกคำร้องและตอบคำถามเพิ่มเติม · ยืนยันผลและให้คะแนน", "หน้าติดตามสถานะพร้อมไทม์ไลน์และการให้คะแนน"],
    ["Sprint 3", "งานของช่าง", "รายการงานเรียงตามความเร่งด่วน · หน้ารายละเอียดงานและโทรหาผู้แจ้ง · เปลี่ยนสถานะตามกฎ · ปิดงานพร้อมรูปหลังซ่อม", "โมดูลช่างที่จัดการสถานะได้ครบบนมือถือ"],
    ["Sprint 4", "แดชบอร์ดและบูรณาการ", "ตัวชี้วัด 5 ตัว · กราฟวิเคราะห์ 5 ด้าน · ตารางงานด่วนค้างนาน · ส่งออก Excel/PDF · ทดสอบแบบ End-to-End", "ระบบเต็มที่ทุกฟังก์ชันทำงานเชื่อมโยงกัน"],
  ];
  sprints.forEach(([sp, title, acts, out], i) => {
    const x = M + i * 3.04;
    card(s, x, 2.18, 2.82, 3.6, { fill: i === 3 ? C.tint : C.white, line: i === 3 ? null : C.line });
    s.addText(sp, { x: x + 0.26, y: 2.36, w: 2.3, h: 0.3, fontFace: FONT, fontSize: 12.5, bold: true, color: C.brand, charSpacing: 0.5 });
    s.addText(title, { x: x + 0.26, y: 2.68, w: 2.3, h: 0.6, fontFace: FONT, fontSize: 16.5, bold: true, color: C.ink, valign: "top" });
    s.addText("กิจกรรมหลัก", { x: x + 0.26, y: 3.32, w: 2.3, h: 0.26, fontFace: FONT, fontSize: 11, bold: true, color: C.muted });
    s.addText(acts, { x: x + 0.26, y: 3.58, w: 2.32, h: 1.35, fontFace: FONT, fontSize: 11.5, color: C.ink, valign: "top" });
    s.addText("ผลลัพธ์", { x: x + 0.26, y: 4.98, w: 2.3, h: 0.26, fontFace: FONT, fontSize: 11, bold: true, color: C.muted });
    s.addText(out, { x: x + 0.26, y: 5.24, w: 2.32, h: 0.5, fontFace: FONT, fontSize: 11.5, color: C.brand, valign: "top" });
  });
  card(s, M, 5.96, 11.89, 0.96, { fill: C.black });
  const cer = [
    ["Sprint Planning", "เลือก Requirement มาแตกเป็น Task ทุกสองวัน"],
    ["Daily Standup", "ประชุมสั้น 10–15 นาที ติดตามงานและปัญหา"],
    ["Sprint Review", "ตรวจรับงานตามเกณฑ์ Definition of Done"],
    ["Sprint Retrospective", "สรุปปัญหาและแนวทางปรับปรุงรอบถัดไป"],
  ];
  cer.forEach(([t, d], i) => {
    const x = M + 0.34 + i * 2.93;
    s.addText(t, { x, y: 6.14, w: 2.8, h: 0.28, fontFace: FONT, fontSize: 12.5, bold: true, color: C.lilac });
    s.addText(d, { x, y: 6.42, w: 2.8, h: 0.34, fontFace: FONT, fontSize: 11, color: C.dim });
  });
}

// ---------- 08 · Use case diagram ----------
{
  const s = page({ label: "4 · Use Case Diagram", title: ["ผู้กระทำ 4 ราย ", { t: "27 ยูสเคส" }], sub: "แยกแสดงทีละมุมมองให้อ่านได้ชัด แผนภาพฉบับเต็มที่รวมทุกผู้กระทำอยู่ในรายงาน" });
  const views = [
    ["usecase-reporter", "มุมมองผู้แจ้ง", "UC01–UC13", M, 5.95],
    ["usecase-tech", "มุมมองช่าง", "UC14–UC18", 6.87, 2.86],
    ["usecase-admin", "มุมมองผู้ดูแลระบบและตัวตั้งเวลา", "UC19–UC27", 9.95, 2.66],
  ];
  views.forEach(([file, t, range, x, w]) => {
    card(s, x, 2.12, w, 4.74, { fill: C.white, line: C.line });
    s.addText(t, { x: x + 0.24, y: 2.24, w: w - 0.4, h: 0.28, fontFace: FONT, fontSize: 12.5, bold: true, color: C.ink });
    s.addText(range, { x: x + 0.24, y: 2.52, w: w - 0.4, h: 0.26, fontFace: FONT, fontSize: 11.5, color: C.brand });
    img(s, SLIDE_DIA(file), x + 0.14, 2.86, w - 0.28, 3.84);
  });
  s.addText("«include» แจ้งซ่อม ต้องเลือกสถานที่และแนบรูป · «extend» ยืนยันผล ต่อยอดจากติดตามสถานะ", {
    x: M, y: 6.94, w: 11.9, h: 0.3, fontFace: FONT, fontSize: 11.5, color: C.muted,
  });
}

// ---------- 09–13 · Activity diagrams ----------
const activities = [
  ["ฟังก์ชันหลักที่ 1 · ", "ส่งคำร้องแจ้งซ่อม", "activity-submit", ["เลือกประเภทและความเร่งด่วน", "เลือกวิทยาเขต คณะ อาคาร ชั้น ห้อง", "ระบบตรวจคำร้องซ้ำ แล้วเลือกติดตามแทน", "กรอกรายละเอียด แนบรูป 1–3 รูป", "ยืนยัน แล้วได้เลขคำร้อง MR-YYMM-NNNN"]],
  ["ฟังก์ชันหลักที่ 2 · ", "ติดตามสถานะคำร้อง", "activity-confirm", ["เปิดไทม์ไลน์ดูทุกขั้นตอนและเวลา", "ยกเลิกคำร้องได้ก่อนช่างรับเรื่อง", "ตอบคำถามเพิ่มเติมเมื่อแอดมินขอข้อมูล", "ซ่อมเสร็จ: ยืนยันผลและให้คะแนนดาว", "ยังไม่หาย: ส่งกลับให้ช่างแก้ไขต่อ"]],
  ["ฟังก์ชันหลักที่ 3 · ", "คัดกรองและมอบหมายงาน (ผู้ดูแลระบบ)", "activity-admin", ["รับเรื่องคำร้องที่เข้ามาใหม่", "ขอข้อมูลเพิ่มเติมเมื่อรายละเอียดไม่พอ", "รวมคำร้องซ้ำ หรือปฏิเสธพร้อมเหตุผล", "มอบหมายช่างตามความถนัดและงานค้าง", "ปรับระดับความเร่งด่วนได้ตลอดเวลา"]],
  ["ฟังก์ชันหลักที่ 3 · ", "ดูงานและอัปเดตสถานะ (ช่าง)", "activity-technician", ["ดูรายการงานเรียงตามความเร่งด่วน", "กดรับงาน สถานะเปลี่ยนเป็นกำลังซ่อม", "แจ้งรออะไหล่พร้อมเหตุผล", "บันทึกผล แนบรูปหลังซ่อมและสาเหตุ", "โทรหาผู้แจ้งได้จากหน้ารายละเอียดงาน"]],
  ["ฟังก์ชันเพิ่มเติม · ", "แดชบอร์ดผู้ดูแลระบบ", "activity-dashboard", ["เลือกช่วงเวลา 7 วัน 30 วัน เดือนนี้ หรือกำหนดเอง", "ตัวชี้วัด 5 ตัว สรุปภาพรวมงานซ่อม", "กราฟวิเคราะห์ 5 ด้าน จากข้อมูลจริง", "ตารางงานด่วนค้างนาน กดเข้าจัดการต่อได้", "ส่งออกรายงาน Excel หรือ PDF ภาษาไทย"]],
];
for (const [pre, name, file, steps] of activities) {
  const s = page({ label: "5 · Activity Diagram", title: [pre, { t: name }], size: 27 });
  card(s, M, 1.62, 8.95, 5.3, { fill: C.white, line: C.line });
  img(s, SLIDE_DIA(file), M + 0.2, 1.8, 8.55, 4.94);
  card(s, 9.9, 1.62, 2.71, 5.3, { fill: C.tint });
  s.addText("ขั้นตอนสำคัญ", { x: 10.16, y: 1.84, w: 2.2, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: C.brand });
  steps.forEach((t, i) => {
    const y = 2.3 + i * 0.92;
    s.addText(String(i + 1), { x: 10.16, y, w: 0.3, h: 0.28, fontFace: FONT, fontSize: 12, bold: true, color: C.lilac });
    s.addText(t, { x: 10.44, y: y - 0.03, w: 1.95, h: 0.82, fontFace: FONT, fontSize: 11.5, color: C.ink, valign: "top" });
  });
}

// ---------- 14 · Information architecture ----------
{
  const s = page({ label: "6 · Information Architecture", title: ["โครงสร้างหน้าจอ ", { t: "แยกตามบทบาท" }], sub: "ทุกบทบาทเริ่มที่หน้าเข้าสู่ระบบเดียวกัน แล้วเข้าสู่พื้นที่ของตนเอง (/login › /home · /tech · /admin)" });
  card(s, M, 2.06, 11.89, 2.86, { fill: C.tint });
  s.addText("ผู้แจ้ง", { x: M + 0.3, y: 2.26, w: 1.6, h: 0.3, fontFace: FONT, fontSize: 15, bold: true, color: C.brand });
  s.addText("9 หน้าจอหลัก", { x: M + 0.3, y: 2.6, w: 1.6, h: 0.28, fontFace: FONT, fontSize: 11.5, color: C.muted });
  img(s, SLIDE_DIA("ia-reporter"), M + 1.95, 2.2, 9.7, 2.58);
  const pair = [
    ["ia-tech", "ช่าง", "4 หน้าจอหลัก", M],
    ["ia-admin", "ผู้ดูแลระบบ", "3 หน้าจอหลัก", 6.8],
  ];
  pair.forEach(([file, t, d, x]) => {
    card(s, x, 5.06, 5.82, 1.86, { fill: C.white, line: C.line });
    s.addText(t, { x: x + 0.3, y: 5.22, w: 1.5, h: 0.3, fontFace: FONT, fontSize: 14, bold: true, color: C.brand });
    s.addText(d, { x: x + 0.3, y: 5.54, w: 1.5, h: 0.28, fontFace: FONT, fontSize: 11.5, color: C.muted });
    img(s, SLIDE_DIA(file), x + 1.75, 5.18, 3.9, 1.62);
  });
}

// ---------- 15 · User flows ----------
{
  const s = page({ label: "6 · User Flows", title: ["เส้นทางการใช้งาน ", { t: "ของทั้ง 3 บทบาท" }] });
  card(s, M, 2.0, 4.9, 4.92, { fill: C.white, line: C.line });
  img(s, DIA("userflow"), M + 0.25, 2.16, 4.4, 4.6);
  const flows = [
    ["ผู้แจ้ง", "เข้าสู่ระบบ › หน้าแรก › แจ้งซ่อม 4 ขั้นตอน › เจอคำร้องซ้ำให้กดติดตามแทน › ติดตามสถานะ › ยืนยันผลและให้คะแนน"],
    ["ช่าง", "เข้าสู่ระบบ › งานของฉัน (เรียงตามความเร่งด่วน) › รายละเอียดงาน › รับงาน › รออะไหล่ › บันทึกซ่อมเสร็จพร้อมรูป"],
    ["ผู้ดูแลระบบ", "เข้าสู่ระบบ › แดชบอร์ด › คำร้องทั้งหมด › แผงจัดการ (รับเรื่อง มอบหมาย รวมซ้ำ) › ส่งออกรายงาน"],
  ];
  flows.forEach(([t, d], i) => {
    const y = 2.0 + i * 1.44;
    card(s, 5.96, y, 6.65, 1.3, { fill: i === 0 ? C.tint : "F6F5F8" });
    s.addText(t, { x: 6.26, y: y + 0.18, w: 6.0, h: 0.3, fontFace: FONT, fontSize: 15, bold: true, color: C.ink });
    s.addText(d, { x: 6.26, y: y + 0.5, w: 6.05, h: 0.66, fontFace: FONT, fontSize: 12, color: C.muted, valign: "top" });
  });
  card(s, 5.96, 6.32, 6.65, 0.6, { fill: C.black });
  s.addText("ทุกเส้นทางจบที่สถานะปิดงาน และระบบปิดงานอัตโนมัติให้เมื่อครบ 3 วันหลังซ่อมเสร็จ", {
    x: 6.26, y: 6.32, w: 6.05, h: 0.6, fontFace: FONT, fontSize: 12, color: C.dim, valign: "middle",
  });
}

// ---------- 13 · Wireframes to UI ----------
{
  const s = page({ label: "7 · Wireframes และ Prototype", title: ["จากไวร์เฟรม ", { t: "สู่หน้าจอจริงของผู้แจ้ง" }] });
  card(s, M, 2.0, 5.82, 4.3, { fill: "F6F5F8" });
  s.addText("Wireframe", { x: M + 0.3, y: 2.14, w: 3, h: 0.28, fontFace: FONT, fontSize: 12.5, bold: true, color: C.muted });
  img(s, SCR("wf-reporter"), M + 0.2, 2.5, 5.42, 3.6);
  card(s, 6.8, 2.0, 5.82, 4.3, { fill: C.tint });
  s.addText("หน้าจอจริง · แจ้งซ่อม 4 ขั้นตอน และตรวจพบคำร้องซ้ำ", { x: 7.1, y: 2.14, w: 5.2, h: 0.28, fontFace: FONT, fontSize: 12.5, bold: true, color: C.brand });
  img(s, SCR("ui-reporter"), 7.0, 2.5, 5.42, 3.6);
  s.addText("ไวร์เฟรมวางโครงและลำดับข้อมูลก่อน แล้วจึงลงสี ไอคอน และสถานะจริง โดยคงโครงเดิมไว้ทั้งหมด", {
    x: M, y: 6.5, w: 11.9, h: 0.3, fontFace: FONT, fontSize: 12.5, color: C.muted,
  });
}

// ---------- 14 · Prototype, technician and admin ----------
{
  const s = page({ label: "7 · Wireframes และ Prototype", title: ["ต้นแบบที่กดใช้งานได้จริง ", { t: "ทั้ง 3 บทบาท" }] });
  card(s, M, 2.04, 5.82, 3.1, { fill: C.white, line: C.line });
  s.addText("ช่าง · รายการงานและการอัปเดตสถานะ", { x: M + 0.3, y: 2.16, w: 5.2, h: 0.28, fontFace: FONT, fontSize: 12.5, bold: true, color: C.brand });
  img(s, SCR("ui-tech"), M + 0.25, 2.5, 5.32, 2.5);
  card(s, 6.8, 2.04, 5.82, 3.1, { fill: C.white, line: C.line });
  s.addText("ผู้ดูแลระบบ · แดชบอร์ดและการมอบหมายช่าง", { x: 7.1, y: 2.16, w: 5.2, h: 0.28, fontFace: FONT, fontSize: 12.5, bold: true, color: C.brand });
  img(s, SCR("ui-admin-dash"), 7.05, 2.5, 5.32, 2.5);
  card(s, M, 5.3, 11.89, 1.62, { fill: C.black });
  s.addText("ต้นแบบใช้งานได้จริงบนเว็บ", { x: M + 0.36, y: 5.5, w: 6, h: 0.34, fontFace: FONT, fontSize: 16, bold: true, color: C.white });
  s.addText(URL, { x: M + 0.36, y: 5.86, w: 6, h: 0.34, fontFace: FONT, fontSize: 14, color: C.lilac, hyperlink: { url: URL } });
  s.addText("ครอบคลุมทุกฟังก์ชันที่ออกแบบไว้ · ใช้ได้ทั้งมือถือและเดสก์ท็อป · ข้อมูลสถานที่จริง 3 วิทยาเขต", {
    x: 7.0, y: 5.68, w: 5.5, h: 0.6, fontFace: FONT, fontSize: 12.5, color: C.dim, valign: "middle",
  });
}

// ---------- 15 · Summary ----------
{
  const s = page({ dark: true, label: "สรุป", title: ["FastFix CMU ", { t: "พร้อมใช้งานจริง" }] });
  const stats = [
    ["3", "ฟังก์ชันหลัก + 1 ฟังก์ชันเพิ่มเติม"],
    ["27", "ยูสเคส จาก 4 ผู้กระทำ"],
    ["4", "Sprint ตามกระบวนการ Agile"],
    ["157", "อาคารจริง 965 ห้อง ใน 3 วิทยาเขต"],
  ];
  stats.forEach(([v, d], i) => {
    const x = M + i * 3.04;
    card(s, x, 2.26, 2.82, 1.96, { fill: "1A1620" });
    s.addText(v, { x: x + 0.3, y: 2.44, w: 2.2, h: 0.72, fontFace: FONT, fontSize: 36, bold: true, color: C.lilac });
    s.addText(d, { x: x + 0.3, y: 3.2, w: 2.3, h: 0.86, fontFace: FONT, fontSize: 12.5, color: C.dim, valign: "top" });
  });
  s.addText("ขอบคุณครับ/ค่ะ", { x: M, y: 4.7, w: 7, h: 0.6, fontFace: FONT, fontSize: 30, bold: true, color: C.white });
  s.addText(`ยินดีตอบคำถาม · ${URL}`, { x: M, y: 5.34, w: 7, h: 0.36, fontFace: FONT, fontSize: 14, color: C.lilac });
  const team = ["ตรีรัตน์ จอมพันธ์ 682110032", "พจณิชา ทองย้อย 682110061", "ภานิชา ศรีกระจ่าง 682110073", "สุภาวิกา นันทสุวรรณ 682110095"];
  team.forEach((t, i) => {
    s.addText(t, { x: M + (i % 2) * 3.4, y: 6.06 + Math.floor(i / 2) * 0.36, w: 3.3, h: 0.32, fontFace: FONT, fontSize: 12.5, color: C.dim });
  });
  card(s, 8.0, 4.56, 4.61, 2.36, { fill: "1A1620" });
  s.addText("ส่งมอบครบตามเกณฑ์", { x: 8.34, y: 4.76, w: 4.0, h: 0.32, fontFace: FONT, fontSize: 15, bold: true, color: C.white });
  checks(s, [
    "รายงานฉบับเต็ม (PDF) และสไลด์นำเสนอ",
    "ยูสเคส · แอกทิวิตี · IA · ผังการใช้งาน",
    "ไวร์เฟรมและต้นแบบที่กดใช้งานได้จริง",
  ], 8.34, 5.22, 4.0, { size: 12.5, gap: 0.46, color: C.dim, tick: C.lilac });
}

const out = path.join(__dirname, "out", "สไลด์-FastFix-CMU.pptx");
pptx.writeFile({ fileName: out }).then(() => console.log(`Wrote ${out} (${n} slides)`));
