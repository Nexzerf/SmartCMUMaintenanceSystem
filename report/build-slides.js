// Builds out/สไลด์-ระบบแจ้งซ่อม-มช.pptx
// Run: npm run slides   (run `npm run diagrams` first)
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

const DIA = (n) => path.join(__dirname, "out", "diagrams", `${n}.png`);
const SCR = (n) => path.join(__dirname, "screens", `${n}.png`);
const URL = "https://fastfix-cmu.vercel.app";

const FONT = "Leelawadee UI";
const C = { brand: "5B2C83", tint: "F1EBF6", ink: "111111", muted: "6B6B6B", bg: "F5F5F7", white: "FFFFFF", line: "E3DCEA", green: "1E7A46", orange: "B45309", blue: "1D5FBF", red: "B42318" };
const W = 13.333;
const H = 7.5;

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.title = "ระบบแจ้งซ่อมอัจฉริยะ มหาวิทยาลัยเชียงใหม่";
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
// Fit an image inside a box, centered.
function img(slide, file, x, y, w, h) {
  const s = pngSize(file);
  const k = Math.min(w / s.w, h / s.h);
  const iw = s.w * k;
  const ih = s.h * k;
  slide.addImage({ path: file, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih });
}

let n = 0;
// Standard content slide: small section label, title, page number.
function page(section, title) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  n++;
  s.addText(section, { x: 0.6, y: 0.35, w: 8, h: 0.35, fontFace: FONT, fontSize: 13, color: C.brand, bold: true });
  s.addText(title, { x: 0.6, y: 0.68, w: 12.1, h: 0.75, fontFace: FONT, fontSize: 28, color: C.ink, bold: true });
  s.addText(String(n + 1), { x: W - 1.1, y: H - 0.55, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 11, color: C.muted, align: "right" });
  return s;
}
function card(s, x, y, w, h, fill = C.bg) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.12 });
}
function bulletsText(s, items, x, y, w, h, size = 17) {
  s.addText(
    items.map((t) => ({ text: t, options: { bullet: { indent: 18 }, paraSpaceAfter: 8 } })),
    { x, y, w, h, fontFace: FONT, fontSize: size, color: C.ink, valign: "top" },
  );
}

// 1 ─ Title
{
  const s = pptx.addSlide();
  s.background = { color: C.brand };
  s.addText("954244 การวิเคราะห์และออกแบบระบบสำหรับการจัดการสมัยใหม่", { x: 0.8, y: 0.8, w: 11.5, h: 0.4, fontFace: FONT, fontSize: 15, color: "E6DAF0" });
  s.addText("ระบบแจ้งซ่อมอัจฉริยะ\nมหาวิทยาลัยเชียงใหม่", { x: 0.8, y: 2.0, w: 11.5, h: 2.2, fontFace: FONT, fontSize: 48, bold: true, color: C.white, lineSpacingMultiple: 1.05 });
  s.addText("Smart CMU Maintenance Request System", { x: 0.8, y: 4.25, w: 11.5, h: 0.5, fontFace: FONT, fontSize: 22, color: "E6DAF0" });
  s.addText("แจ้งซ่อม · ติดตามสถานะ · ช่างอัปเดตงาน · แดชบอร์ดผู้ดูแลระบบ", { x: 0.8, y: 5.3, w: 11.5, h: 0.4, fontFace: FONT, fontSize: 16, color: C.white });
  s.addText(URL, { x: 0.8, y: 6.4, w: 11.5, h: 0.4, fontFace: FONT, fontSize: 14, color: "E6DAF0" });
}

// 2 ─ Problem
{
  const s = page("ความเป็นมาและปัญหา", "แจ้งซ่อมทุกวันนี้ ข้อมูลหาย ติดตามไม่ได้");
  const probs = [
    ["ช่องทางกระจัดกระจาย", "โทรศัพท์ กระดาษ แชต เรื่องตกหล่นและไม่มีผู้รับผิดชอบชัดเจน"],
    ["ข้อมูลไม่ครบ", "ไม่มีรูป ระบุห้องไม่ชัด ช่างต้องไปสำรวจซ้ำ"],
    ["ติดตามไม่ได้", "ผู้แจ้งไม่รู้ความคืบหน้า ต้องโทรถามซ้ำ"],
    ["แจ้งซ้ำ มอบงานไม่สมดุล", "ปัญหาเดียวแจ้งหลายครั้ง งานกระจุกที่ช่างบางคน"],
    ["ไม่มีการยืนยันผล", "ไม่รู้ว่าซ่อมหายจริงหรือไม่"],
    ["ไม่มีสถิติ", "ผู้บริหารวางแผนงบประมาณจากข้อมูลจริงไม่ได้"],
  ];
  probs.forEach(([t, d], i) => {
    const x = 0.6 + (i % 3) * 4.1;
    const y = 1.75 + Math.floor(i / 3) * 2.55;
    card(s, x, y, 3.85, 2.3);
    s.addText(String(i + 1).padStart(2, "0"), { x: x + 0.3, y: y + 0.25, w: 1, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: C.brand });
    s.addText(t, { x: x + 0.3, y: y + 0.7, w: 3.3, h: 0.5, fontFace: FONT, fontSize: 19, bold: true, color: C.ink });
    s.addText(d, { x: x + 0.3, y: y + 1.2, w: 3.3, h: 0.9, fontFace: FONT, fontSize: 14, color: C.muted, valign: "top" });
  });
}

// 3 ─ Objectives & scope
{
  const s = page("วัตถุประสงค์และขอบเขต", "ระบบเดียว ตั้งแต่แจ้งจนปิดงาน");
  card(s, 0.6, 1.7, 6.0, 5.1);
  s.addText("วัตถุประสงค์", { x: 0.9, y: 1.9, w: 5.4, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: C.brand });
  bulletsText(s, [
    "แจ้งซ่อมพร้อมรูปและสถานที่ได้ภายใน 3 นาที",
    "ติดตามสถานะแบบทันที และยืนยันผลเอง",
    "ช่างดูงานและอัปเดตสถานะจากมือถือ",
    "ผู้ดูแลระบบคัดกรอง มอบหมาย และดูแดชบอร์ด",
    "ประยุกต์ใช้อไจล์ในการพัฒนาต้นแบบที่ใช้งานได้จริง",
  ], 0.9, 2.4, 5.5, 4.2, 16);
  card(s, 6.8, 1.7, 5.9, 3.1, C.tint);
  s.addText("อยู่ในขอบเขต", { x: 7.1, y: 1.9, w: 5.4, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: C.brand });
  bulletsText(s, ["ฟังก์ชันหลัก 3 ฟังก์ชัน + แดชบอร์ดส่งออก Excel/PDF", "ข้อมูลจริง 3 วิทยาเขต 120 อาคาร 747 ห้อง", "เข้าสู่ระบบแบบจำลอง CMU Account และสิทธิ์ตามบทบาท"], 7.1, 2.4, 5.4, 2.3, 15);
  card(s, 6.8, 5.0, 5.9, 1.8);
  s.addText("รอบถัดไป", { x: 7.1, y: 5.15, w: 5.4, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: C.muted });
  s.addText("CMU OAuth · LINE OA · AI จัดประเภท · QR Code ประจำห้อง", { x: 7.1, y: 5.6, w: 5.4, h: 0.9, fontFace: FONT, fontSize: 15, color: C.muted, valign: "top" });
}

// 4 ─ Stakeholders & users
{
  const s = page("ผู้มีส่วนได้ส่วนเสียและผู้ใช้", "3 บทบาท 3 อุปกรณ์หลัก");
  const roles = [
    ["ผู้แจ้ง", "นักศึกษาและบุคลากร", "มือถือ", "แจ้งซ่อม ติดตาม ยืนยันผลและให้คะแนน", "ใช้ไม่บ่อย ต้องเร็ว ไม่อยากอ่านคู่มือ"],
    ["ช่าง", "ช่างซ่อมบำรุง", "มือถือ", "รับงาน แจ้งรออะไหล่ บันทึกผลพร้อมรูป", "ทำงานนอกสถานที่ เดินระหว่างอาคาร"],
    ["ผู้ดูแลระบบ", "เจ้าหน้าที่อาคารสถานที่", "คอมพิวเตอร์", "คัดกรอง มอบหมาย ดูแดชบอร์ด ส่งออกรายงาน", "จัดการคำร้องจำนวนมากต่อเนื่อง"],
  ];
  roles.forEach(([r, who, dev, tasks, trait], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.7, 3.85, 3.6);
    s.addText(r, { x: x + 0.3, y: 1.9, w: 3.3, h: 0.55, fontFace: FONT, fontSize: 24, bold: true, color: C.brand });
    s.addText(`${who} · ${dev}`, { x: x + 0.3, y: 2.45, w: 3.3, h: 0.4, fontFace: FONT, fontSize: 14, color: C.muted });
    s.addText(tasks, { x: x + 0.3, y: 3.0, w: 3.3, h: 1.0, fontFace: FONT, fontSize: 16, color: C.ink, valign: "top" });
    s.addText(trait, { x: x + 0.3, y: 4.2, w: 3.3, h: 0.9, fontFace: FONT, fontSize: 13, color: C.muted, italic: true, valign: "top" });
  });
  s.addText("ผู้มีส่วนได้ส่วนเสียอื่น: ผู้บริหารมหาวิทยาลัย (รายงาน) · ITSC (ความปลอดภัย, CMU Account) · เจ้าหน้าที่ PDPA (ข้อมูลส่วนบุคคล)", { x: 0.6, y: 5.6, w: 12.1, h: 0.8, fontFace: FONT, fontSize: 15, color: C.ink });
}

// 5 ─ Functional requirements
{
  const s = page("ความต้องการเชิงฟังก์ชัน", "27 รายการ จัดลำดับด้วย MoSCoW");
  const cols = [
    ["ผู้แจ้ง · 10", ["แจ้งซ่อม 4 ขั้น + รูป 1–3", "ตรวจคำร้องซ้ำ → ติดตามแทน", "ไทม์ไลน์อัปเดตทันที", "ยืนยันผล + ให้ดาว / ยังไม่หาย", "ประวัติ ค้นหา แจ้งซ่อมซ้ำ"]],
    ["ช่าง · 4", ["งานเรียงตามความเร่งด่วน", "รับงาน / รออะไหล่", "บันทึกผล + รูปหลังซ่อม", "โทรหาผู้แจ้งได้ทันที"]],
    ["ผู้ดูแลระบบ · 7", ["รับเรื่อง ขอข้อมูล ปฏิเสธ", "มอบหมายช่างตามความถนัด", "รวมคำร้องซ้ำ", "แดชบอร์ด 5 KPI + 5 แผนภูมิ", "ส่งออก Excel / PDF", "จัดการข้อมูลพื้นฐาน"]],
    ["ระบบ · 3", ["เลขคำร้อง MR-YYMM-NNNN", "ควบคุมลำดับสถานะ + บันทึกประวัติ", "ปิดงานอัตโนมัติใน 3 วัน"]],
  ];
  cols.forEach(([t, items], i) => {
    const x = 0.6 + i * 3.08;
    card(s, x, 1.7, 2.9, 4.6, i === 0 ? C.tint : C.bg);
    s.addText(t, { x: x + 0.2, y: 1.85, w: 2.6, h: 0.5, fontFace: FONT, fontSize: 18, bold: true, color: C.brand });
    bulletsText(s, items, x + 0.2, 2.45, 2.6, 3.7, 14);
  });
  s.addText("ทุกบทบาท 3 (เข้าสู่ระบบ แจ้งเตือน ลืมรหัสผ่าน) · Must 19 · Should 7 · Could 1 · Won't: CMU OAuth, LINE OA, AI, QR Code", { x: 0.6, y: 6.5, w: 12, h: 0.4, fontFace: FONT, fontSize: 14, color: C.muted });
}

// 6 ─ NFR
{
  const s = page("ความต้องการที่ไม่ใช่เชิงฟังก์ชัน", "20 รายการ วัดผลได้ทุกข้อ");
  const groups = [
    ["ความปลอดภัย", ["เซสชันทุกหน้า หมดเวลา 30 นาที", "ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์", "bcrypt + HTTPS + จำกัดรหัสผิด 5 ครั้ง", "เบอร์โทรเห็นเฉพาะช่างที่รับงาน", "PDPA ก่อนใช้งาน", "DB role แยก smartcmu_app"]],
    ["การใช้งาน", ["รองรับจอ 360 px + เลย์เอาต์เดสก์ท็อป", "แจ้งซ่อมเสร็จใน 3 นาที", "ปุ่ม ≥ 44 × 44 px", "WCAG 2.1 AA", "ลดภาพเคลื่อนไหวได้"]],
    ["ประสิทธิภาพ", ["โหลด ≤ 3 วินาทีบน 4G", "รูป ≤ 1 MB อัปโหลด ~5 วินาที", "สถานะถึงผู้อื่นใน ≤ 5 วินาที", "เซิร์ฟเวอร์สิงคโปร์ (sin1)"]],
    ["บำรุงรักษา", ["ลองใหม่ได้ ข้อมูลไม่หาย", "แก้ข้อมูลพื้นฐานผ่านหน้าจอ", "Chrome / Safari / Edge"]],
  ];
  groups.forEach(([t, items], i) => {
    const x = 0.6 + i * 3.08;
    card(s, x, 1.7, 2.9, 5.1);
    s.addText(t, { x: x + 0.2, y: 1.85, w: 2.6, h: 0.5, fontFace: FONT, fontSize: 18, bold: true, color: C.brand });
    bulletsText(s, items, x + 0.2, 2.45, 2.6, 4.2, 14);
  });
}

// 7 ─ Agile sprints
{
  const s = page("การประยุกต์ใช้อไจล์ (Scrum)", "8 รอบ ทุกรอบมีของที่สาธิตได้");
  const sprints = [
    ["1", "รากฐาน", "ดีไซน์ซิสเต็ม ฐานข้อมูล ล็อกอิน สิทธิ์"],
    ["2", "ผู้แจ้ง", "โปรไฟล์ PDPA ฟอร์มแจ้งซ่อม คำร้องซ้ำ"],
    ["3", "ติดตาม", "ไทม์ไลน์ realtime ประวัติ แจ้งเตือน"],
    ["4", "ช่าง", "รายการงาน รับงาน รออะไหล่ ปิดงาน"],
    ["5", "ผู้ดูแล", "ตาราง แผงจัดการ มอบหมาย ปิดงานอัตโนมัติ"],
    ["6", "แดชบอร์ด", "KPI กราฟ Excel/PDF ข้อมูลพื้นฐาน"],
    ["7", "ขัดเกลา", "ภาพเคลื่อนไหว 360 px ความเปรียบต่าง deploy"],
    ["8", "ฟีดแบ็ก", "schema แยก ความเร็ว ข้อมูลจริง Figma"],
  ];
  s.addShape(pptx.ShapeType.line, { x: 0.9, y: 2.35, w: 11.6, h: 0, line: { color: C.line, width: 3 } });
  sprints.forEach(([no, t, d], i) => {
    const x = 0.6 + i * 1.53;
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.4, y: 2.05, w: 0.6, h: 0.6, fill: { color: i === 7 ? C.orange : C.brand }, line: { color: C.white, width: 2 } });
    s.addText(no, { x: x + 0.4, y: 2.05, w: 0.6, h: 0.6, fontFace: FONT, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle" });
    s.addText(t, { x, y: 2.85, w: 1.45, h: 0.45, fontFace: FONT, fontSize: 15, bold: true, color: C.ink, align: "center" });
    s.addText(d, { x, y: 3.3, w: 1.45, h: 1.3, fontFace: FONT, fontSize: 12, color: C.muted, align: "center", valign: "top" });
  });
  const cer = [
    ["Sprint Planning", "เลือก User Story จาก Backlog ตามลำดับ MoSCoW"],
    ["Daily Scrum", "ทำอะไรเสร็จ จะทำอะไร ติดอะไร ≤ 15 นาที"],
    ["Sprint Review", "สาธิตบนเว็บจริง เก็บฟีดแบ็กเข้า Backlog"],
    ["Retrospective", "ปรับวิธีทำงาน เช่น เพิ่มสคริปต์ทดสอบเส้นทางอัตโนมัติ"],
  ];
  cer.forEach(([t, d], i) => {
    const x = 0.6 + i * 3.08;
    card(s, x, 4.9, 2.9, 1.9, C.tint);
    s.addText(t, { x: x + 0.2, y: 5.05, w: 2.6, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: C.brand });
    s.addText(d, { x: x + 0.2, y: 5.5, w: 2.6, h: 1.2, fontFace: FONT, fontSize: 13, color: C.ink, valign: "top" });
  });
}

// 8 ─ Feedback loop
{
  const s = page("การปรับปรุงจากข้อเสนอแนะ", "Sprint Review → Backlog → แก้ในรอบถัดไป");
  const rows = [
    ["หน้าคอมพิวเตอร์ยังเป็นแบบมือถือ", "แยกเลย์เอาต์เดสก์ท็อป เมนูซ้าย 2 คอลัมน์"],
    ["หน้าเข้าสู่ระบบเปิดเผยรหัสผ่าน", "นำออก ส่งบัญชีแยกช่องทาง"],
    ["ต้องแยกฐานข้อมูล", "schema SmartCMU + role smartcmu_app"],
    ["เปลี่ยนบัญชีแล้วเห็นข้อมูลเดิม", "ปิดแคชหน้าส่วนตัว ล้างแคชเมื่อเข้า/ออก"],
    ["เว็บช้า", "ย้าย Vercel สิงคโปร์ เพิ่มดัชนี ลดรอบคิวรี"],
    ["ข้อมูลอาคารไม่ตรงจริง", "120 อาคาร 747 ห้อง รวมแผนที่สังคมฯ วิศวะ เศรษฐศาสตร์ พยาบาล · ILC อยู่ใน TLIC"],
    ["ปุ่มสลับเพี้ยน / PDF ส่งออกไม่ได้", "แก้ตำแหน่งปุ่ม รวมไฟล์ฟอนต์ pdfkit ตอน deploy"],
    ["ตรวจความปลอดภัยและ UI ทุกหน้าก่อนส่ง", "จำกัดรหัสผิด ซ่อนชื่อผู้แจ้ง · แก้เมนูมือถือ เพิ่มค้นหาอาคาร"],
  ];
  const tbl = [
    [
      { text: "ข้อเสนอแนะ / ปัญหาที่พบ", options: { bold: true, color: C.white, fill: { color: C.brand } } },
      { text: "สิ่งที่ปรับปรุง", options: { bold: true, color: C.white, fill: { color: C.brand } } },
    ],
    ...rows.map((r, i) => r.map((t) => ({ text: t, options: { fill: { color: i % 2 ? C.white : C.bg } } }))),
  ];
  s.addTable(tbl, { x: 0.6, y: 1.7, w: 12.1, colW: [5.2, 6.9], fontFace: FONT, fontSize: 14, color: C.ink, border: { type: "solid", color: C.line, pt: 0.75 }, rowH: 0.56, valign: "middle" });
}

// 9 ─ Use case
{
  const s = page("แผนภาพยูสเคส", "4 ผู้กระทำ 27 ยูสเคส");
  img(s, DIA("usecase"), 0.4, 1.45, 7.2, 5.9);
  bulletsText(s, [
    "นักศึกษาและบุคลากร สืบทอดจาก \"ผู้แจ้ง\"",
    "include: แจ้งซ่อม → เลือกสถานที่ + แนบรูป",
    "extend: ติดตามสถานะ → ยกเลิก / ตอบคำถาม / ยืนยัน / ยังไม่หาย",
    "extend: แดชบอร์ด → ส่งออก Excel/PDF",
    "ตัวตั้งเวลาของระบบ ปิดงานอัตโนมัติเมื่อครบ 3 วัน",
    "โค้ด PlantUML + ไฟล์ draw.io แก้ไขต่อได้",
  ], 7.9, 1.8, 4.9, 5, 15);
}

// 10 ─ Activity diagrams (core 1 and 3)
{
  const s = page("แผนภาพกิจกรรม", "ฟังก์ชันหลักที่ 1 แจ้งซ่อม · ฟังก์ชันหลักที่ 3 งานของช่าง");
  img(s, DIA("activity-submit"), 0.5, 1.5, 3.4, 5.85);
  img(s, DIA("activity-technician"), 4.1, 1.5, 3.6, 5.85);
  bulletsText(s, [
    "แบ่ง swimlane ผู้ใช้ / ระบบ ให้เห็นว่าใครทำอะไร",
    "เลือกห้องแล้วตรวจคำร้องซ้ำทันที เลือกติดตามแทนได้",
    "ข้อมูลไม่ครบ → วนให้แก้ ไม่ทำข้อมูลหาย",
    "ช่างสลับ \"รออะไหล่\" ได้หลายรอบ",
    "ปิดงานได้ต้องมีรูปหลังซ่อม + สาเหตุ",
  ], 8.0, 1.8, 4.8, 5, 15);
}

// 11 ─ Activity: core 2 + additional function, and the state machine
{
  const s = page("แผนภาพกิจกรรมและสถานะ", "ติดตามสถานะ · แดชบอร์ด · วงจรคำร้อง");
  img(s, DIA("activity-confirm"), 0.4, 1.5, 5.4, 3.1);
  img(s, DIA("activity-dashboard"), 5.9, 1.5, 3.1, 5.85);
  img(s, DIA("state"), 9.2, 1.5, 3.8, 5.85);
  bulletsText(s, [
    "ฟังก์ชันหลักที่ 2: ยืนยัน + ให้ดาว หรือ \"ยังไม่หาย\" ครบ 3 วันปิดอัตโนมัติ",
    "ฟังก์ชันเพิ่มเติม: เลือกช่วงเวลา → KPI/แผนภูมิ → ส่งออก Excel/PDF",
    "10 สถานะ ควบคุมที่ฟังก์ชันเดียวฝั่งเซิร์ฟเวอร์",
  ], 0.4, 4.9, 5.4, 2.2, 14);
}

// 12 ─ IA + user flow
{
  const s = page("สถาปัตยกรรมสารสนเทศและผังการใช้งาน", "แยกตามบทบาท ลึกไม่เกิน 3 ระดับ");
  img(s, DIA("ia"), 0.4, 1.5, 5.6, 5.85);
  img(s, DIA("userflow"), 6.2, 1.5, 4.2, 5.85);
  bulletsText(s, ["มือถือ: แถบเมนูล่าง ปุ่มแจ้งซ่อมตรงกลาง", "เดสก์ท็อป: เมนูซ้าย รายการเดียวกัน", "เส้นประ = งานส่งต่อระหว่างบทบาท", "แจ้งซ่อม 6 หน้าจอ · ยืนยันผล 3 หน้าจอ"], 10.5, 1.8, 2.5, 5, 13);
}

// 13 ─ Wireframe to UI (reporter)
{
  const s = page("โครงร่างหน้าจอและ UI", "ผู้แจ้ง: Wireframe → UI");
  img(s, SCR("slide-reporter"), 0.5, 1.5, 12.3, 5.4);
  s.addText("Wireframe", { x: 0.9, y: 6.95, w: 2.8, h: 0.35, fontFace: FONT, fontSize: 13, color: C.muted, align: "center" });
  s.addText("UI", { x: 3.8, y: 6.95, w: 2.8, h: 0.35, fontFace: FONT, fontSize: 13, color: C.brand, bold: true, align: "center" });
  s.addText("Wireframe", { x: 6.7, y: 6.95, w: 2.8, h: 0.35, fontFace: FONT, fontSize: 13, color: C.muted, align: "center" });
  s.addText("UI", { x: 9.6, y: 6.95, w: 2.8, h: 0.35, fontFace: FONT, fontSize: 13, color: C.brand, bold: true, align: "center" });
}

// 14 ─ Tech + admin UI
{
  const s = page("โครงร่างหน้าจอและ UI", "ช่าง (มือถือ) และผู้ดูแลระบบ (เดสก์ท็อป)");
  img(s, SCR("slide-tech"), 0.3, 1.5, 5.4, 5.8);
  img(s, SCR("ui-admin-dash"), 5.8, 1.5, 7.3, 5.8);
}

// 15 ─ Prototype
{
  const s = page("ต้นแบบเชิงโต้ตอบ", "Figma + เว็บที่ใช้งานได้จริง");
  const stats = [
    ["76", "หน้าจอต่อชุด"],
    ["2", "ชุด: Wireframe และ UI"],
    ["401", "เส้น Interaction ต่อชุด"],
    ["6", "Flow: 3 บทบาท × มือถือ/เดสก์ท็อป"],
  ];
  stats.forEach(([v, t], i) => {
    const x = 0.6 + i * 3.08;
    card(s, x, 1.7, 2.9, 1.9, C.tint);
    s.addText(v, { x: x + 0.2, y: 1.8, w: 2.6, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: C.brand });
    s.addText(t, { x: x + 0.2, y: 2.75, w: 2.6, h: 0.7, fontFace: FONT, fontSize: 14, color: C.ink, valign: "top" });
  });
  card(s, 0.6, 3.9, 6.0, 2.9);
  s.addText("ปลั๊กอิน Figma", { x: 0.9, y: 4.05, w: 5.4, h: 0.45, fontFace: FONT, fontSize: 18, bold: true, color: C.brand });
  bulletsText(s, ["สร้างทุกหน้าจากโค้ดเดียว ตรงกับเว็บจริงเสมอ", "Present → เลือก Flow → กดใช้งานได้ทันที", "หน้ายาวเลื่อนได้ ตารางมือถือเลื่อนซ้าย-ขวา"], 0.9, 4.55, 5.5, 2.2, 15);
  card(s, 6.8, 3.9, 5.9, 2.9);
  s.addText("เว็บต้นแบบ", { x: 7.1, y: 4.05, w: 5.4, h: 0.45, fontFace: FONT, fontSize: 18, bold: true, color: C.brand });
  s.addText(URL, { x: 7.1, y: 4.55, w: 5.4, h: 0.45, fontFace: FONT, fontSize: 16, color: C.blue, hyperlink: { url: URL } });
  bulletsText(s, ["Next.js 15 · Supabase · Vercel (สิงคโปร์)", "อัปโหลดรูปจริง แจ้งเตือนแบบทันที", "ส่งออก Excel/PDF ภาษาไทย"], 7.1, 5.1, 5.4, 1.6, 15);
}

// 16 ─ Demo & results
{
  const s = page("สาธิตและผลการทดสอบ", "สถานการณ์สาธิตครบวงจร ผ่านทุกขั้น");
  const steps = [
    "student01 ตั้งโปรไฟล์ + PDPA",
    "แจ้งแอร์ CAMT301 พร้อมรูป 2 รูป",
    "staff01 แจ้งซ้ำ → ติดตามแทน",
    "admin01 รับเรื่อง → มอบ tech01",
    "หน้านักศึกษาอัปเดตเองไม่ต้องรีเฟรช",
    "tech01 รับงาน → รออะไหล่ → ซ่อมเสร็จ",
    "\"ยังไม่หาย\" → มอบใหม่ → ยืนยัน 5 ดาว",
    "แดชบอร์ดอัปเดต → Excel / PDF",
    "นักศึกษาเข้า /admin → ถูกพากลับ",
  ];
  steps.forEach((t, i) => {
    const x = 0.6 + (i % 3) * 4.1;
    const y = 1.7 + Math.floor(i / 3) * 1.35;
    card(s, x, y, 3.85, 1.15);
    s.addText(String(i + 1), { x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.75, fontFace: FONT, fontSize: 24, bold: true, color: C.green, valign: "middle" });
    s.addText(t, { x: x + 0.75, y: y + 0.1, w: 2.95, h: 0.95, fontFace: FONT, fontSize: 14, color: C.ink, valign: "middle" });
  });
  s.addText("ต่อยอด: CMU OAuth · LINE OA · QR Code ประจำห้อง · AI จัดประเภท · SLA ตามความเร่งด่วน", { x: 0.6, y: 6.0, w: 12.1, h: 0.6, fontFace: FONT, fontSize: 15, color: C.muted });
}

// 17 ─ Thanks
{
  const s = pptx.addSlide();
  s.background = { color: C.brand };
  s.addText("ขอบคุณครับ/ค่ะ", { x: 0.8, y: 2.4, w: 11.7, h: 1.2, fontFace: FONT, fontSize: 48, bold: true, color: C.white });
  s.addText("ถาม-ตอบ", { x: 0.8, y: 3.6, w: 11.7, h: 0.6, fontFace: FONT, fontSize: 24, color: "E6DAF0" });
  s.addText(URL, { x: 0.8, y: 5.6, w: 11.7, h: 0.5, fontFace: FONT, fontSize: 16, color: C.white, hyperlink: { url: URL } });
}

const out = path.join(__dirname, "out", "สไลด์-ระบบแจ้งซ่อม-มช.pptx");
pptx.writeFile({ fileName: out }).then(() => console.log("written", out));
