// Thai academic report building blocks for docx (npm).
// Conventions: TH SarabunPSK 16 pt body, Thai distributed justification,
// 0.5" first-line indent, table captions above, figure captions below.
const fs = require("fs");
const d = require("docx");

const FONT = "TH SarabunPSK";
const F = { ascii: FONT, hAnsi: FONT, cs: FONT, eastAsia: FONT };
const PT = (n) => n * 2; // half-points
const INDENT = 720; // 0.5"
const CONTENT_W = 11906 - 2160 - 1440; // A4 width minus left 1.5" and right 1"

// Word on machines without Thai word-breaking only wraps at spaces, which leaves huge gaps in
// justified Thai text. Put a zero-width space at every Thai word boundary so lines can wrap anywhere
// a word ends. Uses the ICU Thai dictionary built into Node.
const TH = /[฀-๿]/;
const seg = new Intl.Segmenter("th", { granularity: "word" });
const KEEP = require("./thai-words");
const KEEP_RE = new RegExp(`(${KEEP.sort((x, y) => y.length - x.length).join("|")})`);
function thaiBreaks(text) {
  if (!TH.test(text)) return text;
  const parts = [];
  for (const piece of text.split(KEEP_RE)) {
    if (!piece) continue;
    if (KEEP.includes(piece)) parts.push(piece);
    else for (const x of seg.segment(piece)) parts.push(x.segment);
  }
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 && TH.test(parts[i - 1].slice(-1)) && TH.test(parts[i][0])) out += "​";
    out += parts[i];
  }
  return out;
}

function r(text, o = {}) {
  const size = PT(o.size || 16);
  return new d.TextRun({
    text: thaiBreaks(text),
    font: F,
    size,
    sizeComplexScript: size,
    bold: !!o.bold,
    boldComplexScript: !!o.bold,
    italics: !!o.italic,
    italicsComplexScript: !!o.italic,
    color: o.color,
    break: o.break,
    language: { value: "en-US", bidirectional: "th-TH" },
  });
}

// Inline markup: **bold** segments.
function runs(text, o = {}) {
  if (Array.isArray(text)) return text;
  return String(text)
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((s) => (s.startsWith("**") ? r(s.slice(2, -2), { ...o, bold: true }) : r(s, o)));
}

const P = (text, o = {}) =>
  new d.Paragraph({
    children: runs(text, o),
    alignment: o.align || d.AlignmentType.THAI_DISTRIBUTE,
    indent: o.noIndent ? undefined : { firstLine: INDENT },
    spacing: { after: o.after ?? 0, before: o.before ?? 0 },
    keepNext: o.keepNext,
  });

const blank = () => new d.Paragraph({ children: [r("")] });

// Chapter title: "บทที่ N" and the name on two centered lines, new page.
const chapter = (no, title) =>
  new d.Paragraph({
    heading: d.HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    alignment: d.AlignmentType.CENTER,
    spacing: { after: 360 },
    children: no ? [r(`บทที่ ${no}`, { size: 20, bold: true }), r(title, { size: 20, bold: true, break: 1 })] : [r(title, { size: 20, bold: true })],
  });

// Front-matter title (คำนำ, สารบัญ …): same look, not in the TOC.
const frontTitle = (title, pageBreak = true) =>
  new d.Paragraph({ style: "FrontTitle", pageBreakBefore: pageBreak, alignment: d.AlignmentType.CENTER, spacing: { after: 360 }, children: [r(title, { size: 20, bold: true })] });

const h2 = (text) => new d.Paragraph({ heading: d.HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 240, after: 60 }, children: [r(text, { size: 18, bold: true })] });
const h3 = (text) => new d.Paragraph({ heading: d.HeadingLevel.HEADING_3, keepNext: true, indent: { left: INDENT }, spacing: { before: 120 }, children: [r(text, { bold: true })] });

let listInstance = 0;
// Numbered "1)" list; restarts per call. level 0 indented under the paragraph.
function numbered(items, o = {}) {
  const inst = ++listInstance;
  return items.map(
    (t) =>
      new d.Paragraph({
        numbering: { reference: o.ref || "num", level: 0, instance: inst },
        alignment: d.AlignmentType.THAI_DISTRIBUTE,
        children: runs(t),
      }),
  );
}
const bullets = (items) => items.map((t) => new d.Paragraph({ numbering: { reference: "bullet", level: 0 }, alignment: d.AlignmentType.THAI_DISTRIBUTE, children: runs(t) }));

const numberingConfig = [
  { reference: "num", levels: [{ level: 0, format: d.LevelFormat.DECIMAL, text: "%1)", alignment: d.AlignmentType.LEFT, style: { run: { font: F, size: PT(16), sizeComplexScript: PT(16) }, paragraph: { indent: { left: INDENT + 360, hanging: 360 } } } }] },
  { reference: "bullet", levels: [{ level: 0, format: d.LevelFormat.BULLET, text: "•", alignment: d.AlignmentType.LEFT, style: { run: { font: F }, paragraph: { indent: { left: INDENT + 360, hanging: 360 } } } }] },
];

// Captions are plain text in their own styles; the lists of figures/tables are TOC fields over those styles.
let chapterNo = 0;
let figNo = 0;
let tabNo = 0;
const setChapter = (n) => {
  chapterNo = n;
  figNo = 0;
  tabNo = 0;
};
const label = (n) => (typeof chapterNo === "number" && chapterNo > 0 ? `${chapterNo}.${n}` : `${chapterNo}.${n}`);

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// Figure: image centered, caption below. maxW/maxH in px at 96 dpi.
function figure(file, caption, o = {}) {
  const { w, h } = pngSize(file);
  const maxW = o.maxW || 550;
  const maxH = o.maxH || 820;
  const s = Math.min(maxW / w, maxH / h);
  figNo++;
  return [
    new d.Paragraph({ alignment: d.AlignmentType.CENTER, keepNext: true, spacing: { before: 120 }, children: [new d.ImageRun({ type: "png", data: fs.readFileSync(file), transformation: { width: Math.round(w * s), height: Math.round(h * s) } })] }),
    new d.Paragraph({ style: "FigureCaption", alignment: d.AlignmentType.CENTER, spacing: { after: 240 }, children: [r(`ภาพที่ ${label(figNo)} `, { bold: true }), r(caption)] }),
  ];
}

const border = { style: d.BorderStyle.SINGLE, size: 4, color: "808080" };
const borders = { top: border, bottom: border, left: border, right: border };

// Table with the caption above. widths are fractions or twips; header row shaded.
function table(caption, headers, rows, widths, o = {}) {
  tabNo++;
  const total = widths.reduce((a, b) => a + b, 0);
  const cols = widths.map((w) => Math.round((w / total) * CONTENT_W));
  cols[cols.length - 1] += CONTENT_W - cols.reduce((a, b) => a + b, 0);
  const size = o.size || 14;
  const cell = (text, i, head) =>
    new d.TableCell({
      width: { size: cols[i], type: d.WidthType.DXA },
      borders,
      shading: head ? { type: d.ShadingType.CLEAR, color: "auto", fill: "E7E0EE" } : undefined,
      margins: { top: 40, bottom: 40, left: 100, right: 100 },
      children: String(text)
        .split("\n")
        .map(
          (line) =>
            new d.Paragraph({
              alignment: head || (o.center || []).includes(i) ? d.AlignmentType.CENTER : d.AlignmentType.LEFT,
              children: runs(line, { size, bold: head }),
            }),
        ),
    });
  return [
    new d.Paragraph({ style: "TableCaption", keepNext: true, spacing: { before: 200, after: 60 }, children: [r(`ตารางที่ ${label(tabNo)} `, { bold: true }), r(caption)] }),
    new d.Table({
      width: { size: CONTENT_W, type: d.WidthType.DXA },
      layout: d.TableLayoutType.FIXED,
      columnWidths: cols,
      rows: [
        new d.TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, i, true)) }),
        ...rows.map((row) => new d.TableRow({ cantSplit: true, children: row.map((c, i) => cell(c, i, false)) })),
      ],
    }),
    new d.Paragraph({ spacing: { after: 120 }, children: [r("", { size: 8 })] }),
  ];
}

const styles = {
  default: {
    document: { run: { font: F, size: PT(16), sizeComplexScript: PT(16) }, paragraph: { spacing: { line: 240 } } },
  },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: F, size: PT(20), bold: true }, paragraph: { outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: F, size: PT(18), bold: true }, paragraph: { outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: F, size: PT(16), bold: true }, paragraph: { outlineLevel: 2 } },
    { id: "FrontTitle", name: "Front Title", basedOn: "Normal", next: "Normal", run: { font: F, size: PT(20), bold: true } },
    { id: "FigureCaption", name: "Figure Caption", basedOn: "Normal", next: "Normal", run: { font: F } },
    { id: "TableCaption", name: "Table Caption", basedOn: "Normal", next: "Normal", run: { font: F } },
    // TOC entry styles: keep the Thai font and single spacing.
    ...[1, 2, 3].map((n) => ({ id: `TOC${n}`, name: `toc ${n}`, basedOn: "Normal", next: "Normal", run: { font: F, size: PT(16), bold: n === 1 }, paragraph: { indent: { left: n === 3 ? 0 : (n - 1) * 360 }, spacing: { before: n === 1 ? 120 : 0 } } })),
    { id: "TableofFigures", name: "table of figures", basedOn: "Normal", next: "Normal", run: { font: F, size: PT(16) }, paragraph: { indent: { left: 1080, hanging: 1080 } } },
  ],
};

module.exports = { d, r, runs, P, blank, chapter, frontTitle, h2, h3, numbered, bullets, numberingConfig, figure, table, styles, setChapter, CONTENT_W, INDENT, FONT, F, PT };
