import "server-only";
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { DashboardData } from "@/lib/dashboard";
import { STATUS_LABEL, URGENCY_LABEL } from "@/lib/status";
import { floorLabel } from "@/lib/format";

const TZ = "Asia/Bangkok";
const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("th-TH", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(d)) : "";

function reportTitle(data: DashboardData) {
  return `รายงานคำร้องแจ้งซ่อม ${data.range.label} (${data.range.from} ถึง ${data.range.to})`;
}

export async function buildXlsx(data: DashboardData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Smart CMU Maintenance";
  wb.created = new Date();

  const summary = wb.addWorksheet("สรุป");
  summary.columns = [{ width: 36 }, { width: 18 }];
  summary.addRow([reportTitle(data)]).font = { bold: true, size: 14 };
  summary.addRow([]);
  const k = data.kpi;
  const kpis: [string, number | string][] = [
    ["คำร้องทั้งหมด", k.total],
    ["ยังไม่ปิดงาน", k.open],
    ["ด่วนมากที่ยังเปิด", k.urgentOpen],
    ["เวลาปิดงานเฉลี่ย (ชั่วโมง)", k.avgCloseHours ?? "-"],
    ["ความพึงพอใจเฉลี่ย (เต็ม 5)", k.avgRating ?? "-"],
  ];
  kpis.forEach((r) => summary.addRow(r));
  summary.addRow([]);
  summary.addRow(["แยกตามสถานะ", "จำนวน"]).font = { bold: true };
  data.byStatus.forEach((s) => summary.addRow([STATUS_LABEL[s.status], s.count]));
  summary.addRow([]);
  summary.addRow(["แยกตามประเภท", "จำนวน"]).font = { bold: true };
  data.categories.forEach((c) => summary.addRow([c.name, c.count]));
  summary.addRow([]);
  summary.addRow(["5 อาคารที่แจ้งมากที่สุด", "จำนวน"]).font = { bold: true };
  data.buildings.forEach((b) => summary.addRow([b.name, b.count]));
  summary.addRow([]);
  summary.addRow(["ช่าง", "งานค้าง", "ซ่อมเสร็จในช่วงนี้"]).font = { bold: true };
  summary.getColumn(3).width = 20;
  data.technicians.forEach((t) => summary.addRow([t.name, t.open, t.completed]));

  const sheet = wb.addWorksheet("คำร้อง");
  sheet.columns = [
    { header: "เลขที่", key: "code", width: 16 },
    { header: "แจ้งเมื่อ", key: "created", width: 18 },
    { header: "ประเภท", key: "category", width: 18 },
    { header: "วิทยาเขต", key: "campus", width: 18 },
    { header: "อาคาร", key: "building", width: 28 },
    { header: "ชั้น", key: "floor", width: 6 },
    { header: "ห้อง", key: "room", width: 10 },
    { header: "ความเร่งด่วน", key: "urgency", width: 12 },
    { header: "สถานะ", key: "status", width: 18 },
    { header: "ผู้แจ้ง", key: "reporter", width: 22 },
    { header: "ช่าง", key: "technician", width: 18 },
    { header: "ปิดงานเมื่อ", key: "closed", width: 18 },
    { header: "คะแนน", key: "score", width: 8 },
  ];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B2C83" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  data.rows.forEach((r) =>
    sheet.addRow({
      code: r.code,
      created: fmt(r.created_at),
      category: r.category,
      campus: r.campus,
      building: r.building,
      floor: r.floor,
      room: r.room,
      urgency: URGENCY_LABEL[r.urgency],
      status: STATUS_LABEL[r.status],
      reporter: r.reporter,
      technician: r.technician ?? "",
      closed: r.status === "closed" ? fmt(r.closed_at) : "",
      score: r.score ?? "",
    }),
  );
  sheet.autoFilter = { from: "A1", to: "M1" };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------- PDF ----------

const FONT_DIR = path.join(process.cwd(), "node_modules", "@fontsource", "ibm-plex-sans-thai", "files");
const fonts = {
  thai: path.join(FONT_DIR, "ibm-plex-sans-thai-thai-400-normal.woff"),
  thaiBold: path.join(FONT_DIR, "ibm-plex-sans-thai-thai-700-normal.woff"),
  latin: path.join(FONT_DIR, "ibm-plex-sans-thai-latin-400-normal.woff"),
  latinBold: path.join(FONT_DIR, "ibm-plex-sans-thai-latin-700-normal.woff"),
};

const THAI = /[฀-๿]/;
const segmenter = new Intl.Segmenter("th", { granularity: "word" });

/** Split text into word-ish tokens, each tagged with the font subset that has its glyphs. */
function tokens(text: string, bold: boolean) {
  const out: { text: string; font: string }[] = [];
  for (const { segment } of segmenter.segment(text)) {
    // A segment may still mix scripts (e.g. "MR-2609"); split by script.
    for (const part of segment.match(/[฀-๿]+|[^฀-๿]+/g) ?? []) {
      const thai = THAI.test(part);
      out.push({ text: part, font: thai ? (bold ? "thaiBold" : "thai") : bold ? "latinBold" : "latin" });
    }
  }
  return out;
}

/** Draws wrapped mixed Thai/Latin text. Returns the height used. */
function drawText(doc: PDFKit.PDFDocument, text: string, x: number, y: number, width: number, opts: { size?: number; bold?: boolean; color?: string; align?: "left" | "right" } = {}) {
  const size = opts.size ?? 10;
  const lineHeight = size * 1.45;
  const lines: { text: string; font: string; w: number }[][] = [[]];
  let lineW = 0;
  for (const t of tokens(text, !!opts.bold)) {
    doc.font(t.font).fontSize(size);
    const w = doc.widthOfString(t.text);
    const isSpace = !t.text.trim();
    if (lineW + w > width && lineW > 0 && !isSpace) {
      lines.push([]);
      lineW = 0;
    }
    if (isSpace && lineW === 0) continue;
    lines[lines.length - 1].push({ ...t, w });
    lineW += w;
  }
  doc.fillColor(opts.color ?? "#111111");
  lines.forEach((line, i) => {
    const total = line.reduce((s, t) => s + t.w, 0);
    let cx = opts.align === "right" ? x + width - total : x;
    for (const t of line) {
      doc.font(t.font).fontSize(size).text(t.text, cx, y + i * lineHeight, { lineBreak: false });
      cx += t.w;
    }
  });
  return lines.length * lineHeight;
}

export async function buildPdf(data: DashboardData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true, info: { Title: reportTitle(data), Author: "Smart CMU Maintenance" } });
  for (const [name, file] of Object.entries(fonts)) doc.registerFont(name, fs.readFileSync(file));
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const left = 40;
  const width = doc.page.width - 80;
  let y = 40;
  const ensure = (h: number) => {
    if (y + h > doc.page.height - 50) {
      doc.addPage();
      y = 40;
    }
  };

  doc.rect(0, 0, doc.page.width, 6).fill("#5B2C83");
  y += drawText(doc, "Smart CMU Maintenance · ระบบแจ้งซ่อม มหาวิทยาลัยเชียงใหม่", left, y, width, { size: 9, color: "#6B6B6B" });
  y += drawText(doc, reportTitle(data), left, y + 2, width, { size: 16, bold: true }) + 8;

  // KPI tiles
  const k = data.kpi;
  const tiles: [string, string][] = [
    ["คำร้องทั้งหมด", String(k.total)],
    ["ยังไม่ปิดงาน", String(k.open)],
    ["ด่วนมากที่ยังเปิด", String(k.urgentOpen)],
    ["ปิดงานเฉลี่ย (ชม.)", k.avgCloseHours?.toFixed(1) ?? "-"],
    ["พึงพอใจเฉลี่ย", k.avgRating ? `${k.avgRating.toFixed(2)} / 5` : "-"],
  ];
  const tileW = (width - 4 * 8) / 5;
  tiles.forEach(([label, value], i) => {
    const tx = left + i * (tileW + 8);
    doc.roundedRect(tx, y, tileW, 54, 8).fill("#F5F5F7");
    drawText(doc, label, tx + 8, y + 7, tileW - 16, { size: 8, color: "#6B6B6B" });
    drawText(doc, value, tx + 8, y + 22, tileW - 16, { size: 16, bold: true });
  });
  y += 70;

  const barSection = (title: string, items: { label: string; value: number; color?: string }[]) => {
    ensure(24 + items.length * 18);
    y += drawText(doc, title, left, y, width, { size: 12, bold: true }) + 4;
    const max = Math.max(1, ...items.map((i) => i.value));
    const labelW = 150;
    const barW = width - labelW - 40;
    for (const it of items) {
      drawText(doc, it.label, left, y, labelW - 8, { size: 9 });
      const w = Math.max(2, (it.value / max) * barW);
      doc.roundedRect(left + labelW, y + 3, w, 9, 2).fill(it.color ?? "#7B4BA8");
      drawText(doc, String(it.value), left + labelW + w + 6, y, 34, { size: 9, color: "#6B6B6B" });
      y += 18;
    }
    y += 10;
  };

  const statusColor: Record<string, string> = { pending: "#8E8E93", accepted: "#3B7DDD", assigned: "#3B7DDD", in_progress: "#3B7DDD", waiting_parts: "#D9822B", need_info: "#D9822B", completed: "#2E9E5B", closed: "#2E9E5B", cancelled: "#D64545", rejected: "#D64545" };
  barSection("แยกตามสถานะ", [...data.byStatus].sort((a, b) => b.count - a.count).map((s) => ({ label: STATUS_LABEL[s.status], value: s.count, color: statusColor[s.status] })));
  barSection("แยกตามประเภท", data.categories.map((c) => ({ label: c.name, value: c.count })));
  barSection("5 อาคารที่แจ้งซ่อมมากที่สุด", data.buildings.map((b) => ({ label: b.name, value: b.count })));

  ensure(40 + data.technicians.length * 18);
  y += drawText(doc, "ภาระงานช่าง", left, y, width, { size: 12, bold: true }) + 4;
  drawText(doc, "ช่าง", left, y, 200, { size: 9, bold: true, color: "#6B6B6B" });
  drawText(doc, "งานค้าง", left + 220, y, 80, { size: 9, bold: true, color: "#6B6B6B" });
  drawText(doc, "ซ่อมเสร็จในช่วงนี้", left + 300, y, 120, { size: 9, bold: true, color: "#6B6B6B" });
  y += 16;
  for (const t of data.technicians) {
    drawText(doc, t.name, left, y, 200, { size: 9 });
    drawText(doc, String(t.open), left + 220, y, 80, { size: 9 });
    drawText(doc, String(t.completed), left + 300, y, 80, { size: 9 });
    y += 16;
  }
  y += 12;

  // Request table
  const cols = [
    { title: "เลขที่", w: 70 },
    { title: "วันที่แจ้ง", w: 70 },
    { title: "ประเภท", w: 75 },
    { title: "สถานที่", w: 140 },
    { title: "ความเร่งด่วน", w: 55 },
    { title: "สถานะ", w: 105 },
  ];
  const header = () => {
    doc.rect(left, y - 2, width, 18).fill("#5B2C83");
    let cx = left + 4;
    for (const c of cols) {
      drawText(doc, c.title, cx, y, c.w - 6, { size: 8.5, bold: true, color: "#FFFFFF" });
      cx += c.w;
    }
    y += 20;
  };
  ensure(60);
  y += drawText(doc, `รายการคำร้อง (${data.rows.length} รายการ)`, left, y, width, { size: 12, bold: true }) + 4;
  header();
  data.rows.forEach((r, i) => {
    const cells = [
      r.code,
      new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short", year: "2-digit" }).format(new Date(r.created_at)),
      r.category,
      `${r.building} ${floorLabel(r.floor)} ${r.room}`,
      URGENCY_LABEL[r.urgency],
      STATUS_LABEL[r.status],
    ];
    const rowH = 26;
    if (y + rowH > doc.page.height - 50) {
      doc.addPage();
      y = 40;
      header();
    }
    if (i % 2 === 1) doc.rect(left, y - 3, width, rowH).fill("#F7F7F9");
    let cx = left + 4;
    cells.forEach((cell, ci) => {
      drawText(doc, cell, cx, y, cols[ci].w - 6, { size: 8, color: ci === 4 && r.urgency === "urgent" ? "#B42318" : "#111111" });
      cx += cols[ci].w;
    });
    y += rowH;
  });

  const generated = new Intl.DateTimeFormat("th-TH", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" }).format(new Date());
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // allow the footer below the content area without spawning a page
    drawText(doc, `สร้างเมื่อ ${generated} · หน้า ${i + 1}/${range.count}`, left, doc.page.height - 32, width, { size: 8, color: "#6B6B6B", align: "right" });
  }
  doc.end();
  return done;
}
