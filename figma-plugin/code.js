// Smart CMU Maintenance — Figma screen generator.
// Builds every screen of the web app for mobile and desktop, as UI and as wireframe, and wires prototype interactions.
// Plain ES2017: the Figma plugin sandbox does not need a build step for this file.

figma.showUI(__html__, { width: 360, height: 600 });

figma.ui.onmessage = async function (msg) {
  if (!msg || msg.type !== "build") return;
  try {
    await run(msg);
  } catch (err) {
    console.error(err);
    figma.ui.postMessage({ type: "error", message: err && err.message ? err.message : String(err) });
    figma.notify("สร้างไม่สำเร็จ: " + (err && err.message ? err.message : err), { error: true });
  }
};

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

let MODE = "ui"; // "ui" | "wf"

const PALETTE = {
  ui: {
    brand: "#5B2C83", brandSoft: "#EFE8F5", onBrand: "#FFFFFF",
    ink: "#111111", muted: "#6B6B6B", placeholder: "#8A8A90",
    page: "#F5F5F7", surface: "#FFFFFF", fill: "#EBEBEE", fillStrong: "#DEDEE3", line: "#E8E8EC",
    grayT: "#EEEEF0", grayI: "#4A4A50", blueT: "#E6F0FF", blueI: "#0A58CA",
    orangeT: "#FFF1E0", orangeI: "#9A4A00", greenT: "#E5F6EA", greenI: "#17693A",
    redT: "#FDEAEA", redI: "#B42318", purpleT: "#EFE8F5", purpleI: "#5B2C83",
    star: "#F5A524", photo: "#DDD6CC", photoIcon: "#9C948B", backdrop: "#000000",
    c1: "#5B2C83", c2: "#0A58CA", c3: "#17693A", c4: "#9A4A00", c5: "#B42318", grid: "#E8E8EC",
  },
  wf: {
    brand: "#3F3F3F", brandSoft: "#E3E3E3", onBrand: "#FFFFFF",
    ink: "#1E1E1E", muted: "#7A7A7A", placeholder: "#9A9A9A",
    page: "#F3F3F3", surface: "#FFFFFF", fill: "#E6E6E6", fillStrong: "#CFCFCF", line: "#D4D4D4",
    grayT: "#ECECEC", grayI: "#555555", blueT: "#ECECEC", blueI: "#555555",
    orangeT: "#ECECEC", orangeI: "#555555", greenT: "#ECECEC", greenI: "#555555",
    redT: "#ECECEC", redI: "#555555", purpleT: "#ECECEC", purpleI: "#555555",
    star: "#9A9A9A", photo: "#EDEDED", photoIcon: "#B5B5B5", backdrop: "#000000",
    c1: "#7A7A7A", c2: "#A5A5A5", c3: "#8F8F8F", c4: "#BDBDBD", c5: "#6A6A6A", grid: "#E3E3E3",
  },
};

const CATEGORY = {
  Zap: { name: "ไฟฟ้า", bg: "#FFF4D6", fg: "#8A5A00" },
  Droplets: { name: "ประปา", bg: "#E3F1FB", fg: "#0B5E8E" },
  AirVent: { name: "เครื่องปรับอากาศ", bg: "#E4F4F3", fg: "#0F6B66" },
  Monitor: { name: "อุปกรณ์ IT", bg: "#ECEBFB", fg: "#4338A8" },
  Armchair: { name: "เฟอร์นิเจอร์", bg: "#F7ECE3", fg: "#8A4B1C" },
  Building2: { name: "อาคารและสถานที่", bg: "#EEEEF0", fg: "#4A4A50" },
  Ellipsis: { name: "อื่น ๆ", bg: "#EFE8F5", fg: "#5B2C83" },
};

const TONE = {
  gray: ["grayT", "grayI"], blue: ["blueT", "blueI"], orange: ["orangeT", "orangeI"],
  green: ["greenT", "greenI"], red: ["redT", "redI"], purple: ["purpleT", "purpleI"],
};

function hex(key) {
  if (key.charAt(0) === "#") return key;
  const v = PALETTE[MODE][key];
  if (!v) throw new Error("Unknown color " + key);
  return v;
}
function rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function paint(key, opacity) {
  return [{ type: "SOLID", color: rgb(hex(key)), opacity: opacity == null ? 1 : opacity }];
}
function wf() {
  return MODE === "wf";
}
function radius(n) {
  return wf() ? Math.min(n, 6) : n;
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const WEIGHTS = { r: ["Regular"], m: ["Medium", "Regular"], sb: ["SemiBold", "Semi Bold", "Bold", "Medium"], b: ["Bold", "SemiBold", "ExtraBold"] };
const FONT = {};
let FONT_FAMILY = "";

async function loadFonts() {
  const available = await figma.listAvailableFontsAsync();
  const byFamily = {};
  for (const f of available) {
    (byFamily[f.fontName.family] = byFamily[f.fontName.family] || []).push(f.fontName.style);
  }
  const candidates = ["LINE Seed Sans TH", "IBM Plex Sans Thai", "Noto Sans Thai", "Noto Sans Thai Looped", "Prompt", "Inter"];
  FONT_FAMILY = "";
  for (const c of candidates) {
    if (byFamily[c]) {
      FONT_FAMILY = c;
      break;
    }
  }
  if (!FONT_FAMILY) FONT_FAMILY = "Inter";
  const styles = byFamily[FONT_FAMILY] || ["Regular"];
  for (const w of Object.keys(WEIGHTS)) {
    let style = WEIGHTS[w].find(function (s) { return styles.indexOf(s) >= 0; });
    if (!style) style = styles.indexOf("Regular") >= 0 ? "Regular" : styles[0];
    FONT[w] = { family: FONT_FAMILY, style: style };
    await figma.loadFontAsync(FONT[w]);
  }
}

// ---------------------------------------------------------------------------
// Icons (lucide, 24×24 stroke)
// ---------------------------------------------------------------------------

const ICONS = {
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  Zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  Droplets: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
  AirVent: '<path d="M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 8h12"/><path d="M18.3 17.7a2.5 2.5 0 0 1-3.16 3.83 2.53 2.53 0 0 1-1.14-2V12"/><path d="M6.6 15.6A2 2 0 1 0 10 17v-5"/>',
  Monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  Armchair: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/>',
  Building2: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  Ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  "map-pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  "image-plus": '<path d="M16 5h6"/><path d="M19 2v6"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><circle cx="9" cy="9" r="2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  sheet: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  question: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
};

let ICON_CACHE = {};
let ICON_HOLDER = null;

function icon(parent, name, size, colorKey, opts) {
  opts = opts || {};
  const stroke = hex(colorKey || "ink");
  const fill = opts.fill ? hex(opts.fill) : "none";
  const key = [name, size, stroke, fill, opts.sw || 2].join("|");
  let master = ICON_CACHE[key];
  if (!master) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="' + fill +
      '" stroke="' + stroke + '" stroke-width="' + (opts.sw || 2) + '" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || ICONS.info) + "</svg>";
    master = figma.createNodeFromSvg(svg);
    master.fills = [];
    master.clipsContent = false;
    if (size !== 24) master.rescale(size / 24);
    master.name = "icon/" + name;
    ICON_HOLDER.appendChild(master);
    ICON_CACHE[key] = master;
  }
  const n = master.clone();
  parent.appendChild(n);
  return n;
}

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

function pad(p) {
  if (p == null) return [0, 0, 0, 0];
  if (typeof p === "number") return [p, p, p, p];
  if (p.length === 2) return [p[0], p[1], p[0], p[1]];
  return p;
}

// Auto-layout frame. dir: "v" | "h".
function box(o) {
  o = o || {};
  const f = figma.createFrame();
  f.name = o.name || (o.dir === "h" ? "Row" : "Stack");
  f.layoutMode = o.dir === "h" ? "HORIZONTAL" : "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = o.gap || 0;
  const p = pad(o.p);
  f.paddingTop = p[0];
  f.paddingRight = p[1];
  f.paddingBottom = p[2];
  f.paddingLeft = p[3];
  f.fills = o.fill ? paint(o.fill, o.op) : [];
  if (o.r) f.cornerRadius = radius(o.r);
  if (o.stroke) {
    f.strokes = paint(o.stroke);
    f.strokeWeight = o.sw || 1;
    f.strokeAlign = "INSIDE";
  }
  f.primaryAxisAlignItems = o.main || "MIN";
  f.counterAxisAlignItems = o.cross || (o.dir === "h" ? "CENTER" : "MIN");
  f.clipsContent = !!o.clip;
  if (o.w) {
    f.layoutSizingHorizontal = "FIXED";
    f.resize(o.w, f.height);
  }
  if (o.h) {
    f.layoutSizingVertical = "FIXED";
    f.resize(f.width, o.h);
  }
  return f;
}

// Append child to an auto-layout parent and set its sizing.
function put(parent, child, o) {
  parent.appendChild(child);
  o = o || {};
  if (o.fillW) child.layoutSizingHorizontal = "FILL";
  if (o.fillH) child.layoutSizingVertical = "FILL";
  if (o.grow) child.layoutGrow = 1;
  return child;
}

function text(parent, s, o) {
  o = o || {};
  const t = figma.createText();
  t.fontName = FONT[o.w || "r"];
  t.fontSize = o.size || 15;
  t.characters = String(s);
  t.fills = paint(o.c || "ink");
  t.lineHeight = { unit: "PERCENT", value: o.lh || 150 };
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.strike) t.textDecoration = "STRIKETHROUGH";
  parent.appendChild(t);
  if (o.fillW) {
    t.layoutSizingHorizontal = "FILL";
    t.textAutoResize = "HEIGHT";
  } else if (o.grow) {
    t.layoutGrow = 1;
    t.textAutoResize = "HEIGHT";
  }
  return t;
}

function rect(parent, w, h, colorKey, r) {
  const n = figma.createRectangle();
  n.resize(w, h);
  n.fills = paint(colorKey);
  if (r) n.cornerRadius = r;
  parent.appendChild(n);
  return n;
}

function circle(parent, size, colorKey, o) {
  o = o || {};
  const f = box({ name: o.name || "Circle", main: "CENTER", cross: "CENTER", fill: colorKey, w: size, h: size });
  f.cornerRadius = size / 2;
  if (o.stroke) {
    f.strokes = paint(o.stroke);
    f.strokeWeight = o.sw || 2;
    f.strokeAlign = "INSIDE";
  }
  parent.appendChild(f);
  return f;
}

function spacer(parent, h) {
  const f = box({ name: "Spacer", h: h });
  put(parent, f, { fillW: true });
  return f;
}

function shadow(node, y, blur, opacity) {
  if (wf()) return;
  node.effects = [{ type: "DROP_SHADOW", color: { r: 0.07, g: 0.07, b: 0.07, a: opacity }, offset: { x: 0, y: y }, radius: blur, spread: 0, visible: true, blendMode: "NORMAL" }];
}

// ---------------------------------------------------------------------------
// Prototype links
// ---------------------------------------------------------------------------

let LINKS = [];
let SCREENS = {};
let WIRE_FAILED = [];

// Links name a screen by its base key ("R10"); the current device picks the frame ("R10" or "R10d").
function link(node, to) {
  if (to) LINKS.push({ node: node, to: K(to) });
  return node;
}

// The screen frame a node belongs to (the frame whose parent is the page or a section).
function screenOf(node) {
  let n = node;
  while (n.parent && n.parent.type !== "PAGE" && n.parent.type !== "SECTION") n = n.parent;
  return n;
}
function sectionOf(node) {
  let n = node.parent;
  while (n && n.type !== "SECTION" && n.type !== "PAGE") n = n.parent;
  return n;
}

async function wire(page, flows) {
  let count = 0;
  const failed = [];
  const byNode = new Map();
  for (const l of LINKS) {
    const dest = SCREENS[l.to];
    if (!dest || l.node.removed) continue;
    // Figma rejects NAVIGATE to the frame the click starts in (e.g. the active tab on its own screen).
    if (screenOf(l.node) === dest) continue;
    // Each section is a self-contained flow; a link that leaves it may not be clickable when presenting.
    if (sectionOf(l.node) !== sectionOf(dest)) {
      failed.push(screenOf(l.node).name.split(" · ")[0] + " → " + l.to + " (ข้ามกลุ่ม)");
      continue;
    }
    byNode.set(l.node, l.to); // last link wins for a node
  }
  for (const entry of byNode) {
    const node = entry[0];
    const dest = SCREENS[entry[1]];
    const reactions = [
      {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: dest.id,
            navigation: "NAVIGATE",
            transition: { type: "DISSOLVE", easing: { type: "EASE_OUT" }, duration: 0.25 },
          },
        ],
      },
    ];
    // One rejected link must not abort the whole build: skip it and report it at the end.
    try {
      if (typeof node.setReactionsAsync === "function") await node.setReactionsAsync(reactions);
      else node.reactions = reactions;
      count++;
    } catch (err) {
      console.warn("Skipped interaction", node.name, "→", entry[1], err);
      failed.push(screenOf(node).name.split(" · ")[0] + " " + node.name + " → " + entry[1]);
    }
  }
  WIRE_FAILED = failed;
  try {
    page.flowStartingPoints = flows
      .filter(function (f) { return SCREENS[f[0]]; })
      .map(function (f) { return { nodeId: SCREENS[f[0]].id, name: f[1] }; });
  } catch (e) {
    console.warn("flowStartingPoints", e);
  }
  return count;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function card(parent, o) {
  o = o || {};
  const f = box({ name: o.name || "Card", dir: o.dir, gap: o.gap == null ? 12 : o.gap, p: o.p == null ? 16 : o.p, fill: o.fill || "surface", r: o.r || 16, stroke: wf() ? "line" : null, cross: o.cross, main: o.main });
  put(parent, f, { fillW: o.hug ? false : true });
  return f;
}

function sectionTitle(parent, s) {
  const t = text(parent, s, { size: 13, w: "m", c: "muted" });
  return t;
}

// variant: primary | secondary | danger | soft | ghost; size: sm | md | lg
function button(parent, label, o) {
  o = o || {};
  const v = o.v || "primary";
  const h = o.size === "lg" ? 56 : o.size === "sm" ? 40 : 48;
  const styles = {
    primary: ["brand", "onBrand"],
    secondary: ["fill", "ink"],
    danger: ["redT", "redI"],
    soft: ["brandSoft", "brand"],
    ghost: [null, "brand"],
    green: ["greenT", "greenI"],
  };
  const s = styles[v];
  const b = box({ name: "Button/" + label, dir: "h", gap: 8, p: [0, o.size === "sm" ? 14 : 20], main: "CENTER", cross: "CENTER", fill: s[0], r: o.size === "lg" ? 14 : 12, h: h });
  if (wf() && v !== "primary") {
    b.strokes = paint("fillStrong");
    b.strokeWeight = 1;
  }
  if (o.icon) icon(b, o.icon, o.size === "sm" ? 16 : 18, s[1]);
  text(b, label, { size: o.size === "lg" ? 16 : o.size === "sm" ? 14 : 15, w: "sb", c: s[1] });
  put(parent, b, { fillW: !!o.block, grow: !!o.grow });
  if (o.to) link(b, o.to);
  return b;
}

function linkText(parent, label, to, o) {
  o = o || {};
  const f = box({ name: "Link/" + label, dir: "h", gap: 4, p: [10, 4], cross: "CENTER" });
  if (o.icon) icon(f, o.icon, o.iconSize || 18, o.c || "brand");
  text(f, label, { size: o.size || 15, w: "sb", c: o.c || "brand" });
  parent.appendChild(f);
  if (to) link(f, to);
  return f;
}

function pill(parent, label, tone) {
  const t = TONE[tone || "gray"];
  const f = box({ name: "Pill/" + label, dir: "h", p: [2, 10], fill: t[0], r: 999, cross: "CENTER" });
  f.cornerRadius = 999;
  text(f, label, { size: 12, w: "sb", c: t[1], lh: 160 });
  parent.appendChild(f);
  return f;
}

const STATUS = {
  pending: ["รอรับเรื่อง", "gray"],
  accepted: ["รับเรื่องแล้ว", "blue"],
  assigned: ["มอบหมายช่างแล้ว", "blue"],
  in_progress: ["กำลังซ่อม", "blue"],
  waiting_parts: ["รออะไหล่", "orange"],
  need_info: ["ขอข้อมูลเพิ่มเติม", "orange"],
  completed: ["ซ่อมเสร็จ รอยืนยัน", "green"],
  closed: ["ปิดงาน", "green"],
  cancelled: ["ยกเลิก", "red"],
  rejected: ["ปฏิเสธ", "red"],
};
function statusPill(parent, status) {
  return pill(parent, STATUS[status][0], STATUS[status][1]);
}
function urgencyPill(parent, u) {
  if (u === "urgent") return pill(parent, "ด่วนมาก", "red");
  if (u === "low") return pill(parent, "ไม่ด่วน", "gray");
  return pill(parent, "ปกติ", "purple");
}

function catIcon(parent, name, size) {
  const px = size === "sm" ? 32 : size === "lg" ? 48 : 40;
  const c = CATEGORY[name];
  const f = box({ name: "CategoryIcon/" + name, main: "CENTER", cross: "CENTER", w: px, h: px });
  f.fills = wf() ? paint("fill") : paint(c.bg);
  f.cornerRadius = radius(px === 48 ? 14 : px === 32 ? 9 : 11);
  icon(f, name, px === 32 ? 16 : px === 48 ? 24 : 20, wf() ? "muted" : c.fg);
  parent.appendChild(f);
  return f;
}

function photo(parent, size, o) {
  o = o || {};
  const f = box({ name: "Photo", main: "CENTER", cross: "CENTER", fill: "photo", w: size, h: size, r: 12 });
  if (wf()) {
    f.strokes = paint("fillStrong");
    f.strokeWeight = 1;
    const x = figma.createNodeFromSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '"><line x1="0" y1="0" x2="' + size + '" y2="' + size + '" stroke="#C4C4C4"/><line x1="' + size + '" y1="0" x2="0" y2="' + size + '" stroke="#C4C4C4"/></svg>',
    );
    x.fills = [];
    put(f, x);
    x.layoutPositioning = "ABSOLUTE";
    x.x = 0;
    x.y = 0;
  } else {
    icon(f, "image", Math.round(size / 3.2), "photoIcon");
  }
  if (o.overlay) {
    const ov = box({ name: "Uploading", main: "CENTER", cross: "CENTER", fill: "#000000", op: 0.45, gap: 4, w: size, h: size, r: 12 });
    put(f, ov);
    ov.layoutPositioning = "ABSOLUTE";
    ov.x = 0;
    ov.y = 0;
    const ring = circle(ov, 36, "#FFFFFF", {});
    ring.fills = [];
    ring.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.9 }];
    ring.strokeWeight = 4;
    text(ov, o.overlay, { size: 11, w: "sb", c: "#FFFFFF" });
  }
  parent.appendChild(f);
  return f;
}

function photoGrid(parent, count, size, o) {
  o = o || {};
  const g = box({ name: "Photos", dir: "h", gap: 10 });
  for (let i = 0; i < count; i++) photo(g, size, { overlay: o.uploadingIndex === i ? "กำลังอัปโหลด" : null });
  if (o.addTile) {
    const a = box({ name: "AddPhoto", main: "CENTER", cross: "CENTER", gap: 2, fill: "surface", w: size, h: size, r: 12 });
    if (wf()) {
      a.strokes = paint("fillStrong");
      a.dashPattern = [4, 4];
    }
    icon(a, "image-plus", 24, "brand");
    text(a, "เลือกรูป", { size: 13, w: "sb", c: "brand" });
    text(a, o.addTile, { size: 11, c: "muted" });
    g.appendChild(a);
  }
  put(parent, g, { fillW: true });
  return g;
}

function progressBar(parent, fraction, width, colorKey) {
  const track = box({ name: "Progress", dir: "h", fill: "fill", h: 6, r: 3 });
  track.cornerRadius = 3;
  put(parent, track, { fillW: true });
  rect(track, Math.max(6, Math.round(width * fraction)), 6, colorKey || "brand", 3);
  return track;
}

function input(parent, o) {
  const wrap = box({ name: "Field/" + (o.label || o.placeholder || "input"), gap: 6 });
  put(parent, wrap, { fillW: true });
  if (o.label) {
    const l = box({ name: "Label", dir: "h", gap: 4 });
    text(l, o.label, { size: 14, w: "sb" });
    if (o.optional) text(l, "(ไม่บังคับ)", { size: 14, c: "muted" });
    wrap.appendChild(l);
  }
  const multi = !!o.multiline;
  const field = box({ name: "Input", dir: multi ? "v" : "h", gap: 8, p: multi ? [12, 14] : [0, 14], fill: "surface", r: 12, cross: multi ? "MIN" : "CENTER" });
  if (wf()) {
    field.strokes = paint("fillStrong");
    field.strokeWeight = 1;
  }
  if (o.focus && !wf()) {
    field.strokes = paint("brand");
    field.strokeWeight = 2;
  }
  put(wrap, field, { fillW: true });
  if (!multi) {
    field.layoutSizingVertical = "FIXED";
    field.resize(field.width, 48);
  }
  if (o.leading) icon(field, o.leading, 18, "muted");
  const t = text(field, o.value || o.placeholder || "", { size: 16, c: o.value ? "ink" : "placeholder" });
  if (multi) {
    t.layoutSizingHorizontal = "FILL";
    t.textAutoResize = "HEIGHT";
    field.minHeight = o.minHeight || 104;
  } else {
    t.layoutGrow = 1;
  }
  if (o.suffix) text(field, o.suffix, { size: 16, c: "muted" });
  if (o.trailing) icon(field, o.trailing, 18, "muted");
  if (o.hint) text(wrap, o.hint, { size: 13, c: "muted", fillW: true });
  if (o.error) text(wrap, o.error, { size: 13, c: "redI", fillW: true });
  return wrap;
}

function segmented(parent, options, active, o) {
  o = o || {};
  const s = box({ name: "Segmented", dir: "h", gap: 4, p: 4, fill: "fill", r: 12 });
  put(parent, s, { fillW: o.hug ? false : true });
  options.forEach(function (label, i) {
    const on = i === active;
    const it = box({ name: "Segment/" + label, dir: "h", main: "CENTER", cross: "CENTER", p: [0, 12], r: 9, h: 40, fill: on ? "surface" : null, gap: 4 });
    if (on) shadow(it, 1, 3, 0.08);
    const parts = String(label).split("|");
    text(it, parts[0], { size: 14, w: "sb", c: on ? "ink" : "muted" });
    if (parts[1]) text(it, parts[1], { size: 12, w: "m", c: "muted" });
    put(s, it, { grow: !o.hug });
    if (o.links && o.links[i]) link(it, o.links[i]);
  });
  return s;
}

function groupList(parent, title) {
  const wrap = box({ name: "GroupedList" + (title ? "/" + title : ""), gap: 6 });
  put(parent, wrap, { fillW: true });
  if (title) {
    const h = box({ name: "Title", p: [0, 16] });
    text(h, title, { size: 13, w: "m", c: "muted" });
    put(wrap, h, { fillW: true });
  }
  const list = box({ name: "Rows", fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  put(wrap, list, { fillW: true });
  return list;
}

// row options: cat, iconName, label, detail, check, chevron, trailing(fn), to, labelColor
function listRow(list, o) {
  const r = box({ name: "Row/" + o.label, dir: "h", gap: 12, p: [12, 16], cross: "CENTER" });
  r.strokes = paint("line");
  r.strokeAlign = "INSIDE";
  r.strokeTopWeight = 0;
  r.strokeLeftWeight = 0;
  r.strokeRightWeight = 0;
  r.strokeBottomWeight = o.last ? 0 : 1;
  put(list, r, { fillW: true });
  r.minHeight = 52;
  if (o.cat) catIcon(r, o.cat, o.catSize || "sm");
  if (o.iconName) icon(r, o.iconName, 20, o.iconColor || "muted");
  const t = box({ name: "Text", gap: 2 });
  put(r, t, { grow: true });
  text(t, o.label, { size: 15, w: o.bold ? "sb" : "r", c: o.labelColor || "ink", fillW: true });
  if (o.detail) text(t, o.detail, { size: 13, c: "muted", fillW: true });
  if (o.trailing) o.trailing(r);
  if (o.check) icon(r, "check", 20, "brand", { sw: 2.5 });
  if (o.chevron) icon(r, "chevron-right", 18, "placeholder");
  if (o.to) link(r, o.to);
  return r;
}

function checkbox(parent, checked) {
  const f = box({ name: "Checkbox", main: "CENTER", cross: "CENTER", w: 20, h: 20, r: 5, fill: checked ? "brand" : "surface" });
  if (!checked) {
    f.strokes = paint("fillStrong");
    f.strokeWeight = 2;
  } else {
    icon(f, "check", 14, "onBrand", { sw: 3 });
  }
  parent.appendChild(f);
  return f;
}

// ---------------------------------------------------------------------------
// Screen scaffolding: every screen is built for mobile (390 × 844) and desktop (1440 × 900)
// ---------------------------------------------------------------------------

const MW = 390;
const MH = 844;
const DW = 1440;
const DH = 900;
const SIDEBAR_W = 248;
const DESK_W = DW - SIDEBAR_W - 64; // content width next to the sidebar

let DEVICE = "m"; // "m" | "d"
let CUR_W = MW - 40; // width of the current content column

function isD() {
  return DEVICE === "d";
}
function K(key) {
  return isD() ? key + "d" : key;
}
// Desktop columns carry no side padding of their own.
function hp(p) {
  const q = pad(p).slice();
  if (isD()) {
    q[1] = 0;
    q[3] = 0;
  }
  return q;
}

const NAV = {
  reporter: {
    sub: "นักศึกษา",
    person: "อนันต์ ศรีวงศ์",
    logout: "R01",
    cta: ["แจ้งซ่อม", "R04"],
    items: [["home", "house", "หน้าแรก", "R03"], ["history", "history", "ประวัติการแจ้งซ่อม", "R13"], ["notif", "bell", "แจ้งเตือน", "R14", 2], ["profile", "user", "โปรไฟล์", "R15"]],
  },
  tech: {
    sub: "ช่างซ่อมบำรุง",
    person: "ช่างสมศักดิ์ ใจดี",
    logout: "T00",
    items: [["jobs", "briefcase", "งานของฉัน", "T01"], ["notif", "bell", "แจ้งเตือน", "T04", 1], ["profile", "user", "โปรไฟล์", "T05"]],
  },
  admin: {
    sub: "เมนูผู้ดูแลระบบ",
    person: "พรทิพย์ วงศ์ใหญ่",
    logout: "A00",
    items: [["dash", "grid", "แดชบอร์ด", "A01"], ["requests", "clipboard", "คำร้องทั้งหมด", "A02", 6], ["settings", "database", "ข้อมูลพื้นฐาน", "A04"]],
  },
};

// o: { role, nav, tabs, colW, center, action: [label, to] }
function screen(key, title, o) {
  o = o || {};
  const name = K(key) + " · " + title;
  if (!isD()) {
    const f = box({ name: name, fill: "page", clip: true, w: MW });
    statusBar(f);
    if (o.role === "admin") adminTopBar(f, o.nav);
    SCREENS[K(key)] = f;
    CUR_W = MW - 40;
    return { frame: f, col: f, o: o };
  }
  const f = box({ name: name, dir: "h", fill: "page", clip: true, cross: "MIN", w: DW });
  SCREENS[K(key)] = f;
  if (o.role) sidebar(f, o.role, o.nav);
  const main = box({ name: "Main", p: [28, 32, 40, 32], cross: o.center ? "CENTER" : "MIN" });
  put(f, main, { grow: true });
  const w = o.colW || 820;
  const col = box({ name: "Column", w: w });
  main.appendChild(col);
  CUR_W = w;
  return { frame: f, col: col, o: o };
}

// Short screens fill the device; tall ones scroll vertically in the prototype.
function finish(s) {
  const f = s.frame;
  const o = s.o || {};
  let bar = null;
  if (isD() && o.action) {
    spacer(s.col, 8);
    button(s.col, o.action[0], { size: "lg", block: true, to: o.action[1] });
  }
  if (!isD() && o.action) bar = formActionBar(f, o.action[0], o.action[1]);
  if (!isD() && o.tabs) bar = tabBar(f, o.role, o.nav);
  const H = isD() ? DH : MH;
  if (f.height < H) {
    if (!isD()) {
      const sp = box({ name: "Fill" });
      f.insertChild(bar ? f.children.length - 1 : f.children.length, sp);
      sp.layoutSizingHorizontal = "FILL";
      f.primaryAxisSizingMode = "FIXED";
      f.resize(MW, MH);
      sp.layoutGrow = 1;
    } else {
      f.counterAxisSizingMode = "FIXED";
      f.resize(DW, DH);
    }
  } else {
    f.overflowDirection = "VERTICAL";
  }
  return f;
}

function statusBar(parent) {
  const s = box({ name: "Status bar", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER", p: [0, 26], h: 44 });
  put(parent, s, { fillW: true });
  text(s, "9:41", { size: 15, w: "sb" });
  const right = box({ name: "Indicators", dir: "h", gap: 5, cross: "CENTER" });
  rect(right, 17, 11, "ink", 2);
  rect(right, 15, 11, "ink", 2);
  const bat = box({ name: "Battery", dir: "h", p: 2, r: 3, w: 25, h: 12 });
  bat.strokes = paint("ink");
  bat.strokeWeight = 1;
  rect(bat, 17, 8, "ink", 1.5);
  right.appendChild(bat);
  s.appendChild(right);
}

function body(parent, o) {
  o = o || {};
  const b = box({ name: "Content", gap: o.gap == null ? 20 : o.gap, p: hp(o.p == null ? [8, 20, 24, 20] : o.p) });
  put(parent, b, { fillW: true });
  return b;
}

// Two columns on desktop; on mobile both return the same stack so call order is the stacking order.
function twoCols(parent, leftW) {
  if (!isD()) return [parent, parent];
  const row = box({ name: "Two columns", dir: "h", gap: 24, cross: "MIN" });
  put(parent, row, { fillW: true });
  const l = box({ name: "Left", gap: 18, w: leftW });
  row.appendChild(l);
  const r = box({ name: "Right", gap: 18 });
  put(row, r, { grow: true });
  return [l, r];
}

function pageHeader(parent, o) {
  const h = box({ name: "Header", gap: 2, p: hp([o.large ? 12 : 8, 20, 4, 20]) });
  put(parent, h, { fillW: true });
  if (o.back) linkText(h, o.back[0], o.back[1], { icon: "chevron-left", iconSize: 22 });
  const row = box({ name: "Title row", dir: "h", gap: 12, cross: "CENTER" });
  put(h, row, { fillW: true });
  const t = box({ name: "Titles", gap: 2 });
  put(row, t, { grow: true });
  text(t, o.title, { size: o.large ? 28 : 22, w: "b", fillW: true, lh: 130 });
  if (o.subtitle) text(t, o.subtitle, { size: 15, c: "muted", fillW: true });
  if (o.bell) bellButton(row, o.bell[0], o.bell[1]);
  return h;
}

function bellButton(parent, unread, to) {
  const b = box({ name: "Bell", main: "CENTER", cross: "CENTER", w: 44, h: 44, fill: "surface" });
  b.cornerRadius = 22;
  icon(b, "bell", 20, "ink");
  if (unread) {
    const badge = box({ name: "Badge", main: "CENTER", cross: "CENTER", fill: "redI", p: [0, 5], h: 18 });
    badge.cornerRadius = 9;
    text(badge, String(unread), { size: 11, w: "b", c: "#FFFFFF", lh: 120 });
    put(b, badge);
    badge.layoutPositioning = "ABSOLUTE";
    badge.x = 24;
    badge.y = 4;
  }
  parent.appendChild(b);
  link(b, to);
  return b;
}

function tabBar(f, role, active) {
  const bar = box({ name: "Tab bar", dir: "h", fill: "surface", p: [6, 8, 22, 8], cross: "CENTER" });
  bar.strokes = paint("line");
  bar.strokeTopWeight = 1;
  bar.strokeBottomWeight = 0;
  bar.strokeLeftWeight = 0;
  bar.strokeRightWeight = 0;
  put(f, bar, { fillW: true });
  const items =
    role === "tech"
      ? [["jobs", "briefcase", "งานของฉัน", "T01"], ["notif", "bell", "แจ้งเตือน", "T04"], ["profile", "user", "โปรไฟล์", "T05"]]
      : [["home", "house", "หน้าแรก", "R03"], ["history", "history", "ประวัติ", "R13"], ["new", "plus", "", "R04"], ["notif", "bell", "แจ้งเตือน", "R14"], ["profile", "user", "โปรไฟล์", "R15"]];
  items.forEach(function (it) {
    const on = it[0] === active;
    const cell = box({ name: "Tab/" + (it[2] || "แจ้งซ่อม"), main: "CENTER", cross: "CENTER", gap: 2, h: 52 });
    put(bar, cell, { grow: true });
    if (it[0] === "new") {
      const plus = circle(cell, 52, "brand");
      icon(plus, "plus", 26, "onBrand", { sw: 2.4 });
      shadow(plus, 6, 16, 0.25);
    } else {
      icon(cell, it[1], 22, on ? "brand" : "muted", { sw: on ? 2.4 : 2 });
      text(cell, it[2], { size: 11, w: "sb", c: on ? "brand" : "muted", lh: 130 });
    }
    link(cell, it[3]);
  });
  return bar;
}

function brandMark(parent, size) {
  const tile = box({ name: "Mark", main: "CENTER", cross: "CENTER", w: size, h: size, r: size > 38 ? 11 : 10, fill: "brand" });
  icon(tile, "wrench", Math.round(size / 2), "onBrand");
  parent.appendChild(tile);
  return tile;
}

function navBadge(parent, n) {
  const badge = box({ name: "Badge", main: "CENTER", cross: "CENTER", fill: "redI", p: [0, 7], h: 22 });
  badge.cornerRadius = 11;
  text(badge, String(n), { size: 12, w: "b", c: "#FFFFFF", lh: 120 });
  parent.appendChild(badge);
}

// Desktop left sidebar for any role (matches AppSidebar / AdminSidebar in the web app).
function sidebar(parent, role, active) {
  const nav = NAV[role];
  const s = box({ name: "Sidebar", gap: 4, p: [20, 12, 20, 12], fill: "surface", w: SIDEBAR_W });
  if (wf()) {
    s.strokes = paint("line");
    s.strokeRightWeight = 1;
    s.strokeLeftWeight = 0;
    s.strokeTopWeight = 0;
    s.strokeBottomWeight = 0;
  }
  put(parent, s, { fillH: true });
  const top = box({ name: "Brand", dir: "h", gap: 10, cross: "CENTER", p: [0, 8, 20, 8] });
  put(s, top, { fillW: true });
  brandMark(top, 40);
  const tt = box({ name: "Name" });
  put(top, tt, { grow: true });
  text(tt, "แจ้งซ่อม มช.", { size: 15, w: "b", lh: 130 });
  text(tt, nav.sub, { size: 12, c: "muted", lh: 130 });
  if (nav.cta) {
    button(s, nav.cta[0], { icon: "plus", block: true, to: nav.cta[1] });
    spacer(s, 12);
  }
  nav.items.forEach(function (it) {
    const on = it[0] === active;
    const row = box({ name: "Nav/" + it[2], dir: "h", gap: 12, p: [0, 12], h: 44, r: 12, cross: "CENTER", fill: on ? "brandSoft" : null });
    put(s, row, { fillW: true });
    icon(row, it[1], 20, on ? "brand" : "ink");
    text(row, it[2], { size: 15, w: "sb", c: on ? "brand" : "ink", grow: true });
    if (it[4]) navBadge(row, it[4]);
    link(row, it[3]);
  });
  const fill = box({ name: "Fill" });
  put(s, fill, { fillW: true });
  fill.layoutGrow = 1;
  const foot = box({ name: "Account", gap: 4, p: [12, 8, 0, 8] });
  foot.strokes = paint("line");
  foot.strokeTopWeight = 1;
  foot.strokeBottomWeight = 0;
  foot.strokeLeftWeight = 0;
  foot.strokeRightWeight = 0;
  put(s, foot, { fillW: true });
  text(foot, nav.person, { size: 14, w: "sb" });
  const out = box({ name: "Logout", dir: "h", gap: 10, h: 40, cross: "CENTER" });
  put(foot, out, { fillW: true });
  icon(out, "log-out", 18, "redI");
  text(out, "ออกจากระบบ", { size: 15, w: "sb", c: "redI" });
  link(out, nav.logout);
  return s;
}

// Mobile admin navigation: a top bar (the web app's AdminSidebar collapses to this under 768 px).
function adminTopBar(f, active) {
  const bar = box({ name: "Admin top bar", dir: "h", gap: 4, p: [8, 12], fill: "surface", cross: "CENTER", clip: true });
  bar.strokes = paint("line");
  bar.strokeBottomWeight = 1;
  bar.strokeTopWeight = 0;
  bar.strokeLeftWeight = 0;
  bar.strokeRightWeight = 0;
  put(f, bar, { fillW: true });
  brandMark(bar, 36);
  spacer4(bar);
  NAV.admin.items.forEach(function (it) {
    const on = it[0] === active;
    const item = box({ name: "Nav/" + it[2], dir: "h", gap: 6, p: [0, 10], h: 44, r: 12, cross: "CENTER", fill: on ? "brandSoft" : null });
    icon(item, it[1], 18, on ? "brand" : "ink");
    text(item, it[2], { size: 14, w: "sb", c: on ? "brand" : "ink" });
    if (it[4]) navBadge(item, it[4]);
    bar.appendChild(item);
    link(item, it[3]);
  });
  const out = box({ name: "Logout", main: "CENTER", cross: "CENTER", w: 44, h: 44, r: 12 });
  icon(out, "log-out", 18, "redI");
  bar.appendChild(out);
  link(out, "A00");
  return bar;
}

function spacer4(parent) {
  const f = box({ name: "Gap", w: 4, h: 4 });
  parent.appendChild(f);
}

// Mobile bottom action bar of the request form.
function formActionBar(f, label, to) {
  const a = box({ name: "Action bar", p: [12, 20, 28, 20], fill: "page" });
  put(f, a, { fillW: true });
  button(a, label, { size: "lg", block: true, to: to });
  return a;
}

// Bottom sheet (mobile) or floating dialog (desktop) over a dimmed copy of the base screen.
function sheetScreen(key, title, baseKey, build, o) {
  o = o || {};
  const W = isD() ? DW : MW;
  const H = isD() ? DH : MH;
  const base = SCREENS[K(baseKey)];
  const f = figma.createFrame();
  f.name = K(key) + " · " + title + " (sheet)";
  f.resize(W, H);
  f.fills = paint("page");
  f.clipsContent = true;
  const bg = base.clone();
  f.appendChild(bg);
  bg.x = 0;
  bg.y = 0;
  bg.name = "Background · " + base.name;
  const dim = figma.createRectangle();
  dim.name = "Backdrop";
  dim.resize(W, H);
  dim.fills = paint("backdrop", 0.35);
  f.appendChild(dim);
  const sw = isD() ? (o.wide ? 560 : 440) : MW;
  const sheet = box({ name: "Bottom sheet", gap: 14, p: [isD() ? 20 : 8, 20, isD() ? 24 : 28, 20], fill: "page", w: sw });
  if (isD()) {
    sheet.cornerRadius = radius(20);
    shadow(sheet, 12, 40, 0.18);
  } else {
    sheet.topLeftRadius = radius(20);
    sheet.topRightRadius = radius(20);
  }
  f.appendChild(sheet);
  if (!isD()) {
    const grab = box({ name: "Grabber", dir: "h", main: "CENTER" });
    put(sheet, grab, { fillW: true });
    rect(grab, 36, 4, "fillStrong", 2);
  }
  build(sheet);
  sheet.x = isD() ? Math.round((W - sw) / 2) : 0;
  sheet.y = H - sheet.height - (isD() ? 24 : 0);
  SCREENS[K(key)] = f;
  return f;
}

function sheetHeader(sheet, title, desc, closeTo) {
  const row = box({ name: "Sheet header", dir: "h", gap: 12, cross: "MIN" });
  put(sheet, row, { fillW: true });
  const t = box({ name: "Titles", gap: 4 });
  put(row, t, { grow: true });
  text(t, title, { size: 18, w: "b", fillW: true, lh: 135 });
  if (desc) text(t, desc, { size: 14, c: "muted", fillW: true });
  const x = box({ name: "Close", main: "CENTER", cross: "CENTER", w: 36, h: 36 });
  icon(x, "x", 20, "muted");
  row.appendChild(x);
  if (closeTo) link(x, closeTo);
}

// ---------------------------------------------------------------------------
// Shared request pieces
// ---------------------------------------------------------------------------

function requestRows(parent, rows) {
  const list = box({ name: "Request list", fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  put(parent, list, { fillW: true });
  rows.forEach(function (r, i) {
    const row = box({ name: "Request/" + r.code, dir: "h", gap: 12, p: [14, 16], cross: "CENTER" });
    row.strokes = paint("line");
    row.strokeTopWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;
    row.strokeBottomWeight = i === rows.length - 1 ? 0 : 1;
    put(list, row, { fillW: true });
    catIcon(row, r.cat, "md");
    const t = box({ name: "Text", gap: 2 });
    put(row, t, { grow: true });
    const top = box({ name: "Top", dir: "h", gap: 6, cross: "CENTER" });
    put(t, top, { fillW: true });
    if (r.urgency === "urgent") urgencyPill(top, "urgent");
    text(top, CATEGORY[r.cat].name, { size: 15, w: "sb" });
    if (r.follow) pill(top, "ติดตาม", "purple");
    text(t, r.loc, { size: 13, c: "muted", fillW: true });
    const meta = box({ name: "Meta", dir: "h", gap: 8, cross: "CENTER", p: [4, 0, 0, 0] });
    put(t, meta, { fillW: true });
    statusPill(meta, r.status);
    text(meta, r.code + " · " + r.time, { size: 12, c: "muted" });
    if (r.repeat) {
      const chip = box({ name: "Repeat", dir: "h", gap: 4, p: [0, 10], fill: "fill", r: 10, h: 40, cross: "CENTER" });
      text(chip, "แจ้งซ่อมซ้ำ", { size: 13, w: "sb" });
      row.appendChild(chip);
      link(chip, r.repeat);
    } else {
      icon(row, "chevron-right", 18, "placeholder");
    }
    if (r.to) link(row, r.to);
  });
  return list;
}

function requestHeaderCard(parent, o) {
  const c = card(parent, { gap: 12, r: 20 });
  const top = box({ name: "Top", dir: "h", gap: 12, cross: "MIN" });
  put(c, top, { fillW: true });
  catIcon(top, o.cat, "lg");
  const t = box({ name: "Text", gap: 2 });
  put(top, t, { grow: true });
  text(t, o.code, { size: 13, w: "sb", c: "muted" });
  text(t, CATEGORY[o.cat].name, { size: 20, w: "b", fillW: true, lh: 130 });
  const loc = box({ name: "Location", dir: "h", gap: 4, cross: "MIN", p: [4, 0, 0, 0] });
  put(t, loc, { fillW: true });
  icon(loc, "map-pin", 15, "muted");
  const lt = box({ name: "Where", gap: 0 });
  put(loc, lt, { grow: true });
  text(lt, o.loc, { size: 14, c: "muted", fillW: true });
  text(lt, o.campus || "วิทยาเขตสวนสัก", { size: 13, c: "muted", fillW: true });
  const pills = box({ name: "Pills", dir: "h", gap: 8, cross: "CENTER" });
  put(c, pills, { fillW: true });
  statusPill(pills, o.status);
  urgencyPill(pills, o.urgency || "normal");
  return c;
}

function detailSection(parent, title, build) {
  const s = box({ name: "Section/" + title, gap: 6 });
  put(parent, s, { fillW: true });
  const h = box({ name: "Title", p: [0, 4] });
  text(h, title, { size: 13, w: "m", c: "muted" });
  put(s, h, { fillW: true });
  const c = card(s, { gap: 10 });
  build(c);
  return s;
}

// steps: [{label, state, time, actor, events:[{label, note, tone}]}], currentTone
function timeline(parent, steps, currentTone) {
  const list = box({ name: "Timeline", gap: 0 });
  put(parent, list, { fillW: true });
  steps.forEach(function (s, i) {
    const last = i === steps.length - 1;
    const row = box({ name: "Step/" + s.label, dir: "h", gap: 14, cross: "MIN" });
    put(list, row, { fillW: true });
    const rail = box({ name: "Rail", cross: "CENTER", w: 24 });
    put(row, rail, { fillH: true });
    const dotBox = box({ name: "Dot", main: "CENTER", cross: "CENTER", w: 24, h: 24 });
    rail.appendChild(dotBox);
    if (s.state === "done") {
      const d = circle(dotBox, 24, "greenI");
      icon(d, "check", 14, "#FFFFFF", { sw: 3 });
    } else if (s.state === "current") {
      const toneKey = TONE[currentTone][1];
      const d = circle(dotBox, 24, "surface", { stroke: toneKey, sw: 2 });
      circle(d, 12, toneKey);
    } else {
      circle(dotBox, 14, "surface", { stroke: "fillStrong", sw: 2 });
    }
    if (!last) {
      const line = box({ name: "Line", w: 2, fill: s.state === "done" && steps[i + 1].state !== "future" ? "greenI" : "fillStrong" });
      put(rail, line);
      line.layoutGrow = 1;
      line.minHeight = 12;
    }
    const t = box({ name: "Text", gap: 2, p: [0, 0, last ? 0 : 20, 0] });
    put(row, t, { grow: true });
    const toneInk = s.state === "current" ? TONE[currentTone][1] : s.state === "done" ? "ink" : "muted";
    text(t, s.label, { size: 15, w: s.state === "future" ? "r" : s.state === "current" ? "b" : "sb", c: toneInk, fillW: true });
    if (s.time) text(t, s.time, { size: 13, c: "muted", fillW: true });
    if (s.actor) text(t, s.actor, { size: 13, fillW: true });
    (s.events || []).forEach(function (ev) {
      const e = box({ name: "Event/" + ev.label, gap: 2, p: [8, 12], fill: TONE[ev.tone][0], r: 12 });
      put(t, e, { fillW: true });
      e.paddingTop = 8;
      text(e, ev.label, { size: 13, w: "sb", c: TONE[ev.tone][1], fillW: true });
      if (ev.note) text(e, ev.note, { size: 13, fillW: true });
      if (ev.time) text(e, ev.time, { size: 12, c: "muted", fillW: true });
    });
  });
  return list;
}

const CAMT = "CAMT วิทยาลัยศิลปะ สื่อ และเทคโนโลยี";
const LOC = CAMT + " · ชั้น 3 · CAMT301";
const LOC_RB5 = "RB5 อาคารเรียนรวม 5 · ชั้น 2 · RB5202";
const LOC_RB5_1 = "RB5 อาคารเรียนรวม 5 · ชั้น 1 · RB5103";
const LOC_LIB = "สำนักหอสมุด (Main Library) · ชั้น 1 · ห้องน้ำ";
const LOC_ILC = "TLIC ศูนย์นวัตกรรมการเรียนการสอน · ชั้น 2 · ILC-A204";
const LOC_HB7 = "HB7 คณะมนุษยศาสตร์ (8 ชั้น) · ชั้น 4 · HB7402";
const LOC_DORM = "หอพักนักศึกษาหญิง 3 · ชั้น 1 · ห้องน้ำรวม";
const DESC = "แอร์เปิดแล้วไม่เย็น มีน้ำหยดลงโต๊ะแถวที่ 3 เริ่มเป็นตั้งแต่เมื่อวาน";

function problemSection(parent, o) {
  o = o || {};
  detailSection(parent, "รายละเอียดปัญหา", function (c) {
    text(c, DESC, { size: 15, fillW: true, lh: 160 });
    const lm = box({ name: "Landmark", dir: "h", gap: 4 });
    put(c, lm, { fillW: true });
    text(lm, "จุดสังเกต:", { size: 14, c: "muted" });
    text(lm, "เครื่องฝั่งหน้าต่าง", { size: 14 });
    text(c, "แจ้งเมื่อ 17 ก.ย. 69 14:30", { size: 13, c: "muted" });
    photoGrid(c, 2, 96);
  });
}

// ---------------------------------------------------------------------------
// Login (one per section, so every flow starts and ends inside its own section)
// ---------------------------------------------------------------------------

function logo(parent, inverted) {
  const row = box({ name: "Logo", dir: "h", gap: 12, cross: "CENTER" });
  const tile = box({ name: "Mark", main: "CENTER", cross: "CENTER", w: 44, h: 44, r: 12, fill: inverted ? "surface" : "brand" });
  icon(tile, "wrench", 22, inverted ? "brand" : "onBrand", { sw: 2.2 });
  row.appendChild(tile);
  const t = box({ name: "Name", gap: 0 });
  text(t, "แจ้งซ่อม มช.", { size: 15, w: "b", c: inverted ? "#FFFFFF" : "ink", lh: 130 });
  text(t, "มหาวิทยาลัยเชียงใหม่", { size: 13, c: inverted ? "#E9DFF2" : "muted", lh: 130 });
  row.appendChild(t);
  parent.appendChild(row);
  return row;
}

function loginForm(b, next, forgot, user, withLogo) {
  if (withLogo) {
    logo(b);
    spacer(b, 8);
  }
  text(b, "มีอะไรเสีย บอกเราได้เลย", { size: 28, w: "b", fillW: true, lh: 130 });
  text(b, "เข้าสู่ระบบด้วย CMU Account เพื่อแจ้งซ่อมและติดตามงาน", { size: 15, c: "muted", fillW: true });
  spacer(b, 8);
  input(b, { label: "CMU Account", value: user, suffix: "@cmu.ac.th" });
  input(b, { label: "รหัสผ่าน", value: "••••••••", trailing: "eye" });
  const fr = box({ name: "Forgot", dir: "h", main: "MAX" });
  put(b, fr, { fillW: true });
  linkText(fr, "ลืมรหัสผ่าน?", forgot, { size: 14 });
  button(b, "เข้าสู่ระบบ", { size: "lg", block: true, to: next });
}

function loginScreen(key, next, forgot, user) {
  if (!isD()) {
    const s = screen(key, "เข้าสู่ระบบ", {});
    const b = body(s.col, { p: [32, 20, 32, 20], gap: 16 });
    loginForm(b, next, forgot, user, true);
    return finish(s);
  }
  const f = box({ name: K(key) + " · เข้าสู่ระบบ", dir: "h", fill: "page", clip: true, cross: "MIN", w: DW });
  SCREENS[K(key)] = f;
  const left = box({ name: "Brand panel", gap: 44, p: [56, 56], fill: "brand", main: "CENTER", w: 720 });
  put(f, left, { fillH: true });
  logo(left, true);
  const pitch = box({ name: "Pitch", gap: 24, w: 460 });
  left.appendChild(pitch);
  text(pitch, "เจออะไรเสียในมหาวิทยาลัย แจ้งได้ในไม่ถึง 3 นาที", { size: 36, w: "b", c: "#FFFFFF", fillW: true, lh: 130 });
  [
    ["camera", "ถ่ายรูปจุดที่เสีย", "แนบได้สูงสุด 3 รูป ระบบย่อขนาดให้เอง"],
    ["map-pin", "เลือกอาคารและห้อง", "ช่างรู้ตำแหน่งแน่นอนโดยไม่ต้องโทรถาม"],
    ["bell", "ติดตามได้ทุกขั้นตอน", "แจ้งเตือนทันทีเมื่อรับเรื่อง มอบหมายช่าง และซ่อมเสร็จ"],
  ].forEach(function (st) {
    const r = box({ name: "Step/" + st[1], dir: "h", gap: 16, cross: "MIN" });
    put(pitch, r, { fillW: true });
    const tile = box({ name: "Icon", main: "CENTER", cross: "CENTER", w: 44, h: 44, r: 12, fill: "#FFFFFF", op: 0.15 });
    icon(tile, st[0], 20, "#FFFFFF");
    r.appendChild(tile);
    const t = box({ name: "Text", gap: 2 });
    put(r, t, { grow: true });
    text(t, st[1], { size: 16, w: "sb", c: "#FFFFFF" });
    text(t, st[2], { size: 14, c: "#E9DFF2", fillW: true });
  });
  const right = box({ name: "Form panel", main: "CENTER", cross: "CENTER", p: 40 });
  put(f, right, { grow: true, fillH: true });
  const col = box({ name: "Form", gap: 16, w: 400 });
  right.appendChild(col);
  CUR_W = 400;
  loginForm(col, next, forgot, user, false);
  f.counterAxisSizingMode = "FIXED";
  f.resize(DW, DH);
  return f;
}

// ---------------------------------------------------------------------------
// Reporter screens
// ---------------------------------------------------------------------------

function R01b() {
  return sheetScreen("R01b", "ลืมรหัสผ่าน", "R01", function (s) {
    sheetHeader(s, "ลืมรหัสผ่าน?", null, "R01");
    text(s, "กรุณาติดต่อ ITSC มช. เพื่อรีเซ็ตรหัสผ่าน", { size: 15, fillW: true });
    text(s, "ระบบแจ้งซ่อมใช้ CMU Account เดียวกับบริการอื่นของมหาวิทยาลัย จึงไม่สามารถรีเซ็ตรหัสผ่านจากที่นี่ได้", { size: 14, c: "muted", fillW: true });
    button(s, "เข้าใจแล้ว", { v: "secondary", block: true, to: "R01" });
  });
}

function R02() {
  const s = screen("R02", "ตั้งค่าโปรไฟล์ครั้งแรก", { colW: 640, center: true });
  const b = body(s.col, { p: [24, 20, 32, 20], gap: 18 });
  const h = box({ name: "Intro", gap: 4 });
  put(b, h, { fillW: true });
  text(h, "ขั้นตอนเดียวก่อนเริ่ม", { size: 14, w: "sb", c: "brand" });
  text(h, "บอกเราสักนิดว่าคุณคือใคร", { size: 26, w: "b", fillW: true, lh: 130 });
  text(h, "ข้อมูลนี้ช่วยให้ช่างติดต่อกลับได้ถูกคน กรอกครั้งเดียว แก้ไขภายหลังได้", { size: 15, c: "muted", fillW: true });
  input(b, { label: "ชื่อ-นามสกุล", value: "อนันต์ ศรีวงศ์" });
  const st = box({ name: "Field/สถานะ", gap: 6 });
  put(b, st, { fillW: true });
  text(st, "สถานะ", { size: 14, w: "sb" });
  segmented(st, ["นักศึกษา", "บุคลากร"], 0);
  input(b, { label: "คณะ/หน่วยงาน", value: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)" });
  input(b, { label: "เบอร์โทร", value: "0891234567", hint: "ช่างจะโทรหาเมื่อต้องการสอบถามหน้างาน เห็นได้เฉพาะช่างที่รับงานและเจ้าหน้าที่" });
  const p = card(b, { gap: 10 });
  const pr = box({ name: "PDPA", dir: "h", gap: 12, cross: "MIN" });
  put(p, pr, { fillW: true });
  icon(pr, "shield", 20, "brand");
  const pt = box({ name: "Text", gap: 4 });
  put(pr, pt, { grow: true });
  text(pt, "การคุ้มครองข้อมูลส่วนบุคคล (PDPA)", { size: 13, w: "sb", fillW: true });
  text(pt, "เราเก็บชื่อ สถานะ คณะ และเบอร์โทรของคุณ เพื่อติดต่อกลับและติดตามงานซ่อมเท่านั้น ข้อมูลจะไม่ถูกเผยแพร่ต่อบุคคลภายนอก และคุณแก้ไขข้อมูลได้ทุกเมื่อในหน้าโปรไฟล์", { size: 13, c: "muted", fillW: true });
  const ck = box({ name: "Consent", dir: "h", gap: 12, cross: "CENTER", p: [6, 0] });
  put(p, ck, { fillW: true });
  checkbox(ck, true);
  text(ck, "ฉันยอมรับการเก็บและใช้ข้อมูลตามที่ระบุ", { size: 15, w: "m", grow: true });
  button(b, "บันทึกและเริ่มใช้งาน", { size: "lg", block: true, to: "R03" });
  return finish(s);
}

function R03() {
  const s = screen("R03", "หน้าแรก", { role: "reporter", nav: "home", tabs: true, colW: DESK_W });
  const head = box({ name: "Header", dir: "h", gap: 12, cross: "CENTER", p: hp([16, 20, 4, 20]) });
  put(s.col, head, { fillW: true });
  const ht = box({ name: "Greeting", gap: 0 });
  put(head, ht, { grow: true });
  text(ht, "สวัสดีตอนบ่าย", { size: 15, c: "muted" });
  text(ht, "คุณอนันต์", { size: 28, w: "b", lh: 130 });
  bellButton(head, 2, "R14");

  const b = body(s.col, { p: [16, 20, 24, 20], gap: 22 });
  const cols = twoCols(b, 552);
  const act = box({ name: "Active request", gap: 8 });
  put(cols[0], act, { fillW: true });
  sectionTitle(act, "งานที่กำลังดำเนินการ");
  const c = card(act, { r: 20, gap: 12 });
  link(c, "R10");
  const top = box({ name: "Top", dir: "h", gap: 12, cross: "CENTER" });
  put(c, top, { fillW: true });
  catIcon(top, "AirVent", "lg");
  const tt = box({ name: "Text", gap: 0 });
  put(top, tt, { grow: true });
  text(tt, "เครื่องปรับอากาศ", { size: 16, w: "b" });
  text(tt, LOC, { size: 13, c: "muted", fillW: true });
  icon(top, "chevron-right", 18, "placeholder");
  const mid = box({ name: "Status", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER" });
  put(c, mid, { fillW: true });
  statusPill(mid, "assigned");
  text(mid, "อัปเดต 12 นาทีที่แล้ว", { size: 12, c: "muted" });
  progressBar(c, 0.5, (isD() ? 552 : CUR_W) - 32, "blueI");
  text(c, "ขั้นที่ 3 จาก 6 · MR-2609-0042", { size: 12, c: "muted" });

  const cta = card(cols[0], { r: 20, p: 20, gap: 4 });
  text(cta, "มีอะไรเสีย บอกเราได้เลย", { size: 17, w: "b" });
  text(cta, "ถ่ายรูป เลือกสถานที่ ส่งเรื่องได้ในไม่ถึง 3 นาที", { size: 14, c: "muted", fillW: true });
  spacer(cta, 12);
  button(cta, "แจ้งซ่อม", { size: "lg", block: true, icon: "plus", to: "R04" });

  const rec = box({ name: "Recent", gap: 8 });
  put(cols[1], rec, { fillW: true });
  const rh = box({ name: "Title", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER" });
  put(rec, rh, { fillW: true });
  text(rh, "คำร้องล่าสุด", { size: 17, w: "b" });
  linkText(rh, "ดูทั้งหมด", "R13");
  requestRows(rec, [
    { cat: "AirVent", loc: LOC, status: "assigned", code: "MR-2609-0042", time: "12 นาทีที่แล้ว", to: "R10" },
    { cat: "Droplets", loc: LOC_RB5, status: "need_info", code: "MR-2609-0039", time: "1 วันที่แล้ว", to: "R10" },
    { cat: "Zap", loc: LOC_LIB, status: "closed", code: "MR-2609-0021", time: "6 วันที่แล้ว", to: "R10" },
  ]);
  return finish(s);
}

function formTop(parent, step, label, backLabel, backTo) {
  const t = box({ name: "Form header", gap: 10, p: hp([8, 20, 12, 20]), fill: "page" });
  put(parent, t, { fillW: true });
  const row = box({ name: "Row", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER" });
  put(t, row, { fillW: true });
  linkText(row, backLabel, backTo, { icon: "chevron-left", iconSize: 22 });
  text(row, "ขั้นที่ " + step + "/4 · " + label, { size: 14, w: "sb", c: "muted" });
  progressBar(t, step / 4, CUR_W, "brand");
  return t;
}

function stepTitle(b, title, sub) {
  const h = box({ name: "Step title", gap: 4 });
  put(b, h, { fillW: true });
  text(h, title, { size: 24, w: "b", fillW: true, lh: 130 });
  text(h, sub, { size: 15, c: "muted", fillW: true });
}

function formScreen(key, title, action) {
  return screen(key, title, { role: "reporter", colW: 720, center: true, action: action });
}

function R04() {
  const s = formScreen("R04", "แจ้งซ่อม ขั้นที่ 1 ปัญหา", ["ถัดไป", "R05"]);
  formTop(s.col, 1, "ปัญหา", "ยกเลิก", "R03");
  const b = body(s.col, { gap: 20 });
  stepTitle(b, "เกิดปัญหาอะไร", "เลือกประเภทที่ใกล้เคียงที่สุด");
  const list = groupList(b);
  const keys = Object.keys(CATEGORY);
  keys.forEach(function (k, i) {
    listRow(list, { cat: k, label: CATEGORY[k].name, check: k === "AirVent", last: i === keys.length - 1 });
  });
  const u = groupList(b, "ความเร่งด่วน");
  listRow(u, { label: "ไม่ด่วน", detail: "รอได้ ไม่กระทบการใช้งานมาก" });
  listRow(u, { label: "ปกติ", detail: "ใช้งานได้ไม่สะดวก ควรซ่อมในไม่กี่วัน", check: true });
  listRow(u, { label: "ด่วนมาก", detail: "อันตรายหรือกระทบคนจำนวนมาก", labelColor: "redI", bold: true, last: true });
  return finish(s);
}

function crumb(parent, label, active) {
  const c = box({ name: "Crumb/" + label, dir: "h", p: [0, 12], h: 34, r: 999, cross: "CENTER", fill: active ? "brandSoft" : "surface" });
  c.cornerRadius = 999;
  text(c, label, { size: 14, w: "sb", c: active ? "brand" : "ink" });
  parent.appendChild(c);
  return c;
}

function R05() {
  const s = formScreen("R05", "แจ้งซ่อม ขั้นที่ 2 สถานที่", ["ถัดไป", "R06"]);
  formTop(s.col, 2, "สถานที่", "ย้อนกลับ", "R04");
  const b = body(s.col, { gap: 18 });
  stepTitle(b, "พบปัญหาที่ไหน", "เลือกทีละขั้นจนถึงห้อง");
  const cr = box({ name: "Breadcrumbs", dir: "h", gap: 4, cross: "CENTER", clip: true });
  put(b, cr, { fillW: true });
  crumb(cr, "วิทยาเขต");
  icon(cr, "chevron-right", 14, "muted");
  crumb(cr, "สวนสัก");
  icon(cr, "chevron-right", 14, "muted");
  crumb(cr, CAMT);
  icon(cr, "chevron-right", 14, "muted");
  crumb(cr, "ชั้น 3", true);
  const list = groupList(b, "ห้อง");
  listRow(list, { label: "CAMT301", check: true, to: "R05b" });
  listRow(list, { label: "CAMT302" });
  listRow(list, { label: "Lab Game" });
  listRow(list, { label: "Lab Animation", last: true });
  input(b, { label: "จุดสังเกตเพิ่มเติม", optional: true, value: "เครื่องฝั่งหน้าต่าง" });
  return finish(s);
}

function R05b() {
  return sheetScreen("R05b", "มีคนแจ้งปัญหานี้แล้ว", "R05", function (s) {
    sheetHeader(s, "มีคนแจ้งปัญหานี้แล้ว", "ห้องและประเภทปัญหาเดียวกันยังอยู่ระหว่างดำเนินการ", "R05");
    const c = card(s, { gap: 10 });
    const top = box({ name: "Top", dir: "h", gap: 12, cross: "CENTER" });
    put(c, top, { fillW: true });
    catIcon(top, "AirVent", "md");
    const t = box({ name: "Text", gap: 0 });
    put(top, t, { grow: true });
    text(t, "เครื่องปรับอากาศ", { size: 15, w: "sb" });
    text(t, LOC, { size: 13, c: "muted", fillW: true });
    text(c, "แอร์เปิดแล้วไม่เย็น มีแต่ลมออก นักศึกษานั่งเรียนร้อนมาก", { size: 15, fillW: true });
    const m = box({ name: "Meta", dir: "h", gap: 8, cross: "CENTER" });
    put(c, m, { fillW: true });
    statusPill(m, "accepted");
    text(m, "MR-2609-0038 · แจ้งเมื่อ 2 ชั่วโมงที่แล้ว", { size: 12, c: "muted" });
    text(s, "กดติดตามเพื่อรับแจ้งเตือนเมื่อซ่อมเสร็จ โดยไม่ต้องแจ้งซ้ำ", { size: 14, c: "muted", fillW: true });
    button(s, "ติดตามงานนี้แทน", { size: "lg", block: true, to: "R10" });
    button(s, "แจ้งใหม่อยู่ดี", { size: "lg", v: "secondary", block: true, to: "R06" });
  });
}

function R06() {
  const s = formScreen("R06", "แจ้งซ่อม ขั้นที่ 3 รายละเอียด", ["ถัดไป", "R07"]);
  formTop(s.col, 3, "รายละเอียด", "ย้อนกลับ", "R05");
  const b = body(s.col, { gap: 20 });
  stepTitle(b, "เล่าให้ช่างฟังหน่อย", "รายละเอียดและรูปช่วยให้ช่างเตรียมอุปกรณ์มาถูก");
  const d = input(b, { label: "รายละเอียดปัญหา", value: DESC, multiline: true, focus: true });
  const cnt = box({ name: "Counter", dir: "h", main: "MAX" });
  put(d, cnt, { fillW: true });
  text(cnt, "58/1000", { size: 13, c: "greenI" });
  const ph = box({ name: "Photos field", gap: 8 });
  put(b, ph, { fillW: true });
  text(ph, "รูปภาพ (1–3 รูป)", { size: 14, w: "sb" });
  photoGrid(ph, 2, 110, { addTile: "2/3", uploadingIndex: 1 });
  button(ph, "ถ่ายรูปด้วยกล้อง", { v: "secondary", block: true, icon: "camera" });
  text(ph, "JPG หรือ PNG ไม่เกิน 10 MB ต่อรูป ระบบจะย่อขนาดให้อัตโนมัติ", { size: 13, c: "muted", fillW: true });
  return finish(s);
}

function reviewBlock(parent, title, editTo, build) {
  const s = box({ name: "Review/" + title, gap: 4 });
  put(parent, s, { fillW: true });
  const h = box({ name: "Title", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER", p: [0, 4] });
  put(s, h, { fillW: true });
  text(h, title, { size: 13, w: "m", c: "muted" });
  linkText(h, "แก้ไข", editTo, { size: 14 });
  const c = card(s, { gap: 8 });
  build(c);
}

function R07() {
  const s = formScreen("R07", "แจ้งซ่อม ขั้นที่ 4 ตรวจสอบ", ["ส่งคำร้อง", "R08"]);
  formTop(s.col, 4, "ตรวจสอบ", "ย้อนกลับ", "R06");
  const b = body(s.col, { gap: 16 });
  stepTitle(b, "ตรวจสอบก่อนส่ง", "แตะ “แก้ไข” เพื่อกลับไปเปลี่ยนข้อมูล");
  reviewBlock(b, "ปัญหา", "R04", function (c) {
    const r = box({ name: "Row", dir: "h", gap: 12, cross: "CENTER" });
    put(c, r, { fillW: true });
    catIcon(r, "AirVent", "sm");
    const t = box({ name: "Text" });
    put(r, t, { grow: true });
    text(t, "เครื่องปรับอากาศ", { size: 15, w: "sb" });
    text(t, "ความเร่งด่วน: ปกติ", { size: 14, c: "muted" });
  });
  reviewBlock(b, "สถานที่", "R05", function (c) {
    const r = box({ name: "Row", dir: "h", gap: 12, cross: "MIN" });
    put(c, r, { fillW: true });
    icon(r, "map-pin", 18, "brand");
    const t = box({ name: "Text" });
    put(r, t, { grow: true });
    text(t, LOC, { size: 15, w: "sb", fillW: true });
    text(t, "วิทยาเขตสวนสัก", { size: 14, c: "muted" });
    text(t, "จุดสังเกต: เครื่องฝั่งหน้าต่าง", { size: 14, fillW: true });
  });
  reviewBlock(b, "รายละเอียดและรูปภาพ", "R06", function (c) {
    text(c, DESC, { size: 15, fillW: true, lh: 160 });
    photoGrid(c, 2, 96);
  });
  return finish(s);
}

function R08() {
  const s = screen("R08", "ส่งคำร้องสำเร็จ", { role: "reporter", colW: 480, center: true });
  const b = body(s.col, { p: [isD() ? 80 : 120, 24, 24, 24], gap: 6 });
  b.counterAxisAlignItems = "CENTER";
  const ring = circle(b, 96, "greenT", { stroke: "greenI", sw: 5 });
  icon(ring, "check", 48, "greenI", { sw: 3 });
  spacer(b, 18);
  text(b, "ส่งคำร้องเรียบร้อย", { size: 24, w: "b", align: "CENTER" });
  text(b, "เลขที่คำร้องของคุณ", { size: 15, c: "muted", align: "CENTER" });
  text(b, "MR-2609-0042", { size: 28, w: "b", c: "brand", align: "CENTER" });
  text(b, "เจ้าหน้าที่จะรับเรื่องและมอบหมายช่าง คุณจะได้รับแจ้งเตือนทุกครั้งที่สถานะเปลี่ยน", { size: 14, c: "muted", align: "CENTER", fillW: true });
  spacer(b, 24);
  button(b, "ติดตามสถานะ", { size: "lg", block: true, to: "R09" });
  button(b, "กลับหน้าแรก", { size: "lg", v: "secondary", block: true, to: "R03" });
  return finish(s);
}

const FLOW = ["ส่งคำร้อง · รอรับเรื่อง", "รับเรื่องแล้ว", "มอบหมายช่างแล้ว", "กำลังซ่อม", "ซ่อมเสร็จ รอยืนยัน", "ปิดงาน"];

function trackScreen(key, title) {
  const s = screen(key, title, { role: "reporter", nav: "history", tabs: true, colW: DESK_W });
  pageHeader(s.col, { title: "ติดตามสถานะ", back: ["ประวัติ", "R13"], bell: [2, "R14"] });
  const b = body(s.col, { p: [12, 20, 24, 20], gap: 18 });
  const cols = twoCols(b, DESK_W - 24 - 400);
  return { s: s, L: cols[0], R: cols[1] };
}

function R09() {
  const t = trackScreen("R09", "ติดตามสถานะ รอรับเรื่อง");
  requestHeaderCard(t.L, { cat: "AirVent", code: "MR-2609-0042", loc: LOC, status: "pending" });
  button(t.R, "ยกเลิกคำร้อง", { v: "danger", block: true, to: "R09b" });
  detailSection(t.R, "ความคืบหน้า", function (c) {
    timeline(
      c,
      FLOW.map(function (l, i) {
        return i === 0 ? { label: l, state: "current", time: "17 ก.ย. 69 14:30 · เมื่อสักครู่" } : { label: l, state: "future" };
      }),
      "gray",
    );
  });
  problemSection(t.L);
  return finish(t.s);
}

function R09b() {
  return sheetScreen("R09b", "ยกเลิกคำร้อง", "R09", function (s) {
    sheetHeader(s, "ยกเลิกคำร้องนี้?", "MR-2609-0042 จะไม่ถูกส่งต่อให้ช่าง และยกเลิกแล้วย้อนกลับไม่ได้", "R09");
    button(s, "ยืนยันยกเลิก", { size: "lg", v: "danger", block: true, to: "R13" });
    button(s, "ไม่ยกเลิก", { size: "lg", v: "secondary", block: true, to: "R09" });
  });
}

function R10() {
  const t = trackScreen("R10", "ติดตามสถานะ ซ่อมเสร็จ รอยืนยัน");
  requestHeaderCard(t.L, { cat: "AirVent", code: "MR-2609-0042", loc: LOC, status: "completed" });
  const c = card(t.R, { gap: 6 });
  text(c, "ช่างแจ้งว่าซ่อมเสร็จแล้ว", { size: 17, w: "b" });
  text(c, "ลองตรวจดูหน้างาน แล้วบอกเราว่าใช้งานได้ปกติหรือยัง", { size: 14, c: "muted", fillW: true });
  spacer(c, 8);
  const btns = box({ name: "Buttons", dir: "h", gap: 8 });
  put(c, btns, { fillW: true });
  button(btns, "ยืนยันว่าซ่อมเสร็จ", { size: isD() ? "md" : "lg", grow: true, to: "R11" });
  button(btns, "ยังไม่หาย", { size: isD() ? "md" : "lg", v: "secondary", grow: true, to: "R12" });
  text(c, "ระบบจะปิดงานอัตโนมัติใน 3 วัน", { size: 13, c: "muted", align: "CENTER", fillW: true });
  detailSection(t.R, "ความคืบหน้า", function (cc) {
    timeline(
      cc,
      [
        { label: FLOW[0], state: "done", time: "17 ก.ย. 69 14:30 · 2 วันที่แล้ว" },
        { label: FLOW[1], state: "done", time: "17 ก.ย. 69 15:02 · 2 วันที่แล้ว" },
        { label: FLOW[2], state: "done", time: "17 ก.ย. 69 15:10 · 2 วันที่แล้ว", actor: "ช่างสมศักดิ์ ใจดี" },
        {
          label: FLOW[3],
          state: "done",
          time: "18 ก.ย. 69 09:15 · 1 วันที่แล้ว",
          events: [
            { label: "รออะไหล่", note: "สั่งน้ำยาแอร์แล้ว คาดว่าได้พรุ่งนี้", tone: "orange", time: "1 วันที่แล้ว" },
            { label: "ได้อะไหล่แล้ว กลับมาซ่อมต่อ", tone: "blue", time: "3 ชั่วโมงที่แล้ว" },
          ],
        },
        { label: FLOW[4], state: "current", time: "19 ก.ย. 69 11:40 · 20 นาทีที่แล้ว" },
        { label: FLOW[5], state: "future" },
      ],
      "green",
    );
  });
  problemSection(t.L);
  detailSection(t.L, "ช่างผู้รับผิดชอบ", function (cc) {
    const r = box({ name: "Tech", dir: "h", gap: 12, cross: "CENTER" });
    put(cc, r, { fillW: true });
    const av = circle(r, 40, "blueT");
    icon(av, "wrench", 18, "blueI");
    text(r, "ช่างสมศักดิ์ ใจดี", { size: 15, w: "sb" });
  });
  detailSection(t.L, "ผลการซ่อม", function (cc) {
    text(cc, "สาเหตุ", { size: 13, c: "muted" });
    text(cc, "ท่อน้ำทิ้งแอร์ตัน และน้ำยาแอร์ต่ำ", { size: 15, fillW: true });
    text(cc, "อะไหล่ที่ใช้", { size: 13, c: "muted" });
    text(cc, "น้ำยา R32 1 กก.", { size: 15 });
    text(cc, "รูปหลังซ่อม", { size: 13, c: "muted" });
    photoGrid(cc, 1, 96);
  });
  return finish(t.s);
}

function stars(parent, filled, size) {
  const r = box({ name: "Stars", dir: "h", gap: size > 30 ? 6 : 2, main: "CENTER" });
  for (let i = 1; i <= 5; i++) icon(r, "star", size, i <= filled ? "star" : "fillStrong", { fill: i <= filled ? "star" : null });
  put(parent, r, { fillW: true });
  return r;
}

function R11() {
  return sheetScreen("R11", "ให้คะแนน", "R10", function (s) {
    sheetHeader(s, "ให้คะแนนงานซ่อมครั้งนี้", "คะแนนช่วยให้ทีมช่างปรับปรุงบริการ", "R10");
    stars(s, 5, 40);
    text(s, "พอใจมาก", { size: 15, w: "sb", c: "muted", align: "CENTER", fillW: true });
    input(s, { label: "ความคิดเห็น", optional: true, value: "ช่างมาเร็ว อธิบายสาเหตุชัดเจน", multiline: true, minHeight: 80 });
    button(s, "ยืนยันและปิดงาน", { size: "lg", block: true, to: "R13" });
  });
}

function R12() {
  return sheetScreen("R12", "ยังไม่หาย", "R10", function (s) {
    sheetHeader(s, "ยังพบปัญหาอยู่?", "เราจะส่งเรื่องกลับให้เจ้าหน้าที่มอบหมายช่างอีกครั้ง", "R10");
    input(s, { label: "อาการที่ยังพบ", value: "แอร์เย็นได้ครึ่งชั่วโมงแล้วกลับมามีน้ำหยดอีก", multiline: true });
    button(s, "ส่งเรื่องกลับ", { size: "lg", block: true, to: "R13" });
  });
}

function R13() {
  const s = screen("R13", "ประวัติ", { role: "reporter", nav: "history", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "ประวัติ", subtitle: "คำร้องที่คุณแจ้งและติดตาม", large: true });
  const b = body(s.col, { p: [12, 20, 24, 20], gap: 14 });
  input(b, { placeholder: "ค้นหาเลขคำร้องหรือสถานที่", leading: "search" });
  segmented(b, ["ทั้งหมด|6", "กำลังดำเนินการ|3", "เสร็จสิ้น|2", "ยกเลิก|1"], 0, { hug: !isD() });
  requestRows(b, [
    { cat: "AirVent", loc: LOC, status: "completed", code: "MR-2609-0042", time: "20 นาทีที่แล้ว", to: "R10" },
    { cat: "Droplets", loc: LOC_RB5, status: "need_info", code: "MR-2609-0039", time: "1 วันที่แล้ว", to: "R10" },
    { cat: "Monitor", loc: LOC_ILC, status: "in_progress", code: "MR-2609-0035", time: "2 วันที่แล้ว", to: "R10", follow: true },
    { cat: "Zap", loc: LOC_LIB, status: "closed", code: "MR-2609-0021", time: "6 วันที่แล้ว", to: "R10", repeat: "R04" },
    { cat: "Armchair", loc: LOC_HB7, status: "closed", code: "MR-2608-0118", time: "3 สัปดาห์ที่แล้ว", to: "R10", repeat: "R04" },
    { cat: "Building2", loc: LOC_DORM, status: "cancelled", code: "MR-2608-0102", time: "1 เดือนที่แล้ว", to: "R10" },
  ]);
  return finish(s);
}

const NOTIF_ICON = {
  assigned: ["user", "blue"], accepted: ["check-circle", "blue"], submitted: ["clock", "gray"], completed: ["check-circle", "green"],
  closed: ["check", "green"], job: ["wrench", "purple"], reopened: ["alert", "orange"], waiting: ["package", "orange"],
};

function notifList(parent, items) {
  const list = box({ name: "Notifications", fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  put(parent, list, { fillW: true });
  items.forEach(function (n, i) {
    const row = box({ name: "Notification/" + n.title, dir: "h", gap: 12, p: [14, 16], cross: "MIN", fill: n.unread && !wf() ? "#FBF9FD" : null });
    row.strokes = paint("line");
    row.strokeTopWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;
    row.strokeBottomWeight = i === items.length - 1 ? 0 : 1;
    put(list, row, { fillW: true });
    const meta = NOTIF_ICON[n.kind];
    const ic = circle(row, 40, TONE[meta[1]][0]);
    icon(ic, meta[0], 18, TONE[meta[1]][1]);
    const t = box({ name: "Text", gap: 2 });
    put(row, t, { grow: true });
    const top = box({ name: "Top", dir: "h", gap: 8, cross: "CENTER" });
    put(t, top, { fillW: true });
    text(top, n.title, { size: 15, w: n.unread ? "b" : "m", grow: true });
    text(top, n.time, { size: 12, c: "muted" });
    text(t, n.body, { size: 13, c: "muted", fillW: true });
    if (n.unread) {
      const dot = box({ name: "Unread", w: 8, h: 8, fill: "brand" });
      dot.cornerRadius = 4;
      put(row, dot);
    }
    if (n.to) link(row, n.to);
  });
}

function R14() {
  const s = screen("R14", "แจ้งเตือน", { role: "reporter", nav: "notif", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "แจ้งเตือน", large: true });
  const b = body(s.col, { p: [4, 20, 24, 20], gap: 8 });
  const r = box({ name: "Actions", dir: "h", main: "MAX" });
  put(b, r, { fillW: true });
  linkText(r, "อ่านทั้งหมดแล้ว", null, { size: 14 });
  notifList(b, [
    { kind: "completed", title: "ซ่อมเสร็จแล้ว รอคุณยืนยัน", body: "ตรวจสอบงาน MR-2609-0042 แล้วกดยืนยันได้เลย", time: "20 นาที", unread: true, to: "R10" },
    { kind: "assigned", title: "มอบหมายช่างแล้ว", body: "ช่างสมศักดิ์ ใจดี จะเข้าดูแลคำร้อง MR-2609-0042", time: "2 วัน", unread: true, to: "R10" },
    { kind: "accepted", title: "รับเรื่องแล้ว", body: "เจ้าหน้าที่รับเรื่อง MR-2609-0042 แล้ว กำลังจัดหาช่างที่เหมาะสม", time: "2 วัน", to: "R10" },
    { kind: "submitted", title: "ส่งคำร้องแล้ว", body: "เราได้รับคำร้อง MR-2609-0042 แล้ว จะแจ้งให้ทราบเมื่อมีความคืบหน้า", time: "2 วัน", to: "R10" },
    { kind: "closed", title: "ปิดงานแล้ว", body: "คำร้อง MR-2609-0021 ปิดงานเรียบร้อย ขอบคุณที่แจ้งเข้ามา", time: "6 วัน", to: "R10" },
  ]);
  return finish(s);
}

function R15() {
  const s = screen("R15", "โปรไฟล์", { role: "reporter", nav: "profile", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "โปรไฟล์", subtitle: "anan.s@cmu.ac.th", large: true });
  const b = body(s.col, { p: [16, 20, 24, 20], gap: 18 });
  input(b, { label: "ชื่อ-นามสกุล", value: "อนันต์ ศรีวงศ์" });
  const st = box({ name: "Field/สถานะ", gap: 6 });
  put(b, st, { fillW: true });
  text(st, "สถานะ", { size: 14, w: "sb" });
  segmented(st, ["นักศึกษา", "บุคลากร"], 0);
  input(b, { label: "คณะ/หน่วยงาน", value: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)" });
  input(b, { label: "เบอร์โทร", value: "0891234567" });
  button(b, "บันทึกการแก้ไข", { size: "lg", block: true });
  const pd = box({ name: "PDPA", dir: "h", gap: 8, cross: "CENTER" });
  put(b, pd, { fillW: true });
  icon(pd, "shield", 16, "greenI");
  text(pd, "ยอมรับเงื่อนไข PDPA เมื่อ 17 ก.ย. 69", { size: 13, c: "muted" });
  button(b, "ออกจากระบบ", { v: "danger", block: true, icon: "log-out", to: "R01" });
  return finish(s);
}

// ---------------------------------------------------------------------------
// Technician screens
// ---------------------------------------------------------------------------

function T01() {
  const s = screen("T01", "งานของฉัน", { role: "tech", nav: "jobs", tabs: true, colW: 900 });
  const head = box({ name: "Header", dir: "h", gap: 12, cross: "CENTER", p: hp([16, 20, 4, 20]) });
  put(s.col, head, { fillW: true });
  const ht = box({ name: "Titles", gap: 0 });
  put(head, ht, { grow: true });
  text(ht, "ช่างสมศักดิ์", { size: 15, c: "muted" });
  text(ht, "งานของฉัน", { size: 28, w: "b", lh: 130 });
  text(ht, "มีงานใหม่รอรับ 2 งาน", { size: 14, c: "muted" });
  bellButton(head, 1, "T04");
  const b = body(s.col, { p: [16, 20, 24, 20], gap: 14 });
  segmented(b, JOB_TABS, 0, { hug: !isD(), links: [null, null, null, "T01f"] });
  requestRows(b, [
    { cat: "AirVent", urgency: "normal", loc: LOC, status: "assigned", code: "MR-2609-0042", time: "10 นาทีที่แล้ว", to: "T02" },
    { cat: "Zap", urgency: "urgent", loc: LOC_RB5_1, status: "assigned", code: "MR-2609-0041", time: "35 นาทีที่แล้ว", to: "T02" },
  ]);
  return finish(s);
}

const JOB_TABS = ["งานใหม่|2", "กำลังทำ|1", "รออะไหล่|1", "เสร็จแล้ว|5"];

// "เสร็จแล้ว" tab: jobs waiting for the reporter's confirmation, then closed ones.
function T01f() {
  const s = screen("T01f", "งานของฉัน เสร็จแล้ว", { role: "tech", nav: "jobs", tabs: true, colW: 900 });
  const head = box({ name: "Header", dir: "h", gap: 12, cross: "CENTER", p: hp([16, 20, 4, 20]) });
  put(s.col, head, { fillW: true });
  const ht = box({ name: "Titles", gap: 0 });
  put(head, ht, { grow: true });
  text(ht, "ช่างสมศักดิ์", { size: 15, c: "muted" });
  text(ht, "งานของฉัน", { size: 28, w: "b", lh: 130 });
  text(ht, "เสร็จแล้ว 5 งานในเดือนนี้", { size: 14, c: "muted" });
  bellButton(head, 1, "T04");
  const b = body(s.col, { p: [16, 20, 24, 20], gap: 14 });
  segmented(b, JOB_TABS, 3, { hug: !isD(), links: ["T01", null, null, null] });
  requestRows(b, [
    { cat: "AirVent", urgency: "normal", loc: LOC, status: "completed", code: "MR-2609-0042", time: "20 นาทีที่แล้ว", to: "T02f" },
    { cat: "Droplets", urgency: "normal", loc: LOC_HB7, status: "closed", code: "MR-2609-0012", time: "3 วันที่แล้ว", to: "T02f" },
    { cat: "Zap", urgency: "urgent", loc: LOC_ILC, status: "closed", code: "MR-2609-0009", time: "5 วันที่แล้ว", to: "T02f" },
    { cat: "Zap", urgency: "normal", loc: LOC_RB5, status: "closed", code: "MR-2609-0006", time: "1 สัปดาห์ที่แล้ว", to: "T02f" },
    { cat: "AirVent", urgency: "low", loc: LOC_DORM, status: "closed", code: "MR-2609-0003", time: "2 สัปดาห์ที่แล้ว", to: "T02f" },
  ]);
  return finish(s);
}

function reporterSection(parent) {
  detailSection(parent, "ผู้แจ้ง", function (c) {
    const r = box({ name: "Reporter", dir: "h", gap: 12, cross: "CENTER" });
    put(c, r, { fillW: true });
    const av = circle(r, 40, "fill");
    icon(av, "user", 20, "muted");
    const t = box({ name: "Text" });
    put(r, t, { grow: true });
    text(t, "อนันต์ ศรีวงศ์", { size: 15, w: "sb" });
    text(t, "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)", { size: 13, c: "muted", fillW: true });
    const call = box({ name: "Call", dir: "h", gap: 6, p: [0, 12], fill: "greenT", r: 12, h: 44, cross: "CENTER" });
    icon(call, "phone", 16, "greenI");
    text(call, "089-123-4567", { size: 14, w: "sb", c: "greenI" });
    r.appendChild(call);
  });
}

function jobActions(parent, state) {
  if (state === "assigned") button(parent, "รับงาน", { size: "lg", block: true, to: "T02b" });
  if (state === "in_progress") {
    const row = box({ name: "Buttons", dir: isD() ? "v" : "h", gap: 8 });
    put(parent, row, { fillW: true });
    button(row, "รออะไหล่", { size: "lg", v: "secondary", grow: !isD(), block: isD(), to: "T03w" });
    button(row, "ซ่อมเสร็จแล้ว", { size: "lg", grow: !isD(), block: isD(), to: "T03" });
  }
  if (state === "waiting_parts") button(parent, "ได้อะไหล่แล้ว กลับไปซ่อมต่อ", { size: "lg", block: true, to: "T02b" });
  if (state === "completed") {
    const n = box({ name: "Waiting notice", dir: "h", gap: 10, cross: "CENTER", p: [12, 14], fill: "greenT", r: 12 });
    put(parent, n, { fillW: true });
    icon(n, "check-circle", 20, "greenI");
    const t = box({ name: "Text" });
    put(n, t, { grow: true });
    text(t, "ส่งงานแล้ว รอผู้แจ้งยืนยัน", { size: 15, w: "sb", c: "greenI" });
    text(t, "ระบบจะปิดงานอัตโนมัติใน 3 วัน ถ้าผู้แจ้งไม่ดำเนินการ", { size: 13, c: "muted", fillW: true });
    button(parent, "กลับไปงานของฉัน", { size: "lg", v: "secondary", block: true, to: "T01f" });
  }
}

// state: assigned | in_progress | waiting_parts | completed
function techDetail(key, state) {
  const titles = { assigned: "รายละเอียดงาน มอบหมายแล้ว", in_progress: "รายละเอียดงาน กำลังซ่อม", waiting_parts: "รายละเอียดงาน รออะไหล่", completed: "รายละเอียดงาน ซ่อมเสร็จ" };
  const done = state === "completed";
  const s = screen(key, titles[state], { role: "tech", nav: "jobs", tabs: true, colW: DESK_W });
  pageHeader(s.col, { title: "รายละเอียดงาน", back: ["งานของฉัน", done ? "T01f" : "T01"] });
  const b = body(s.col, { p: [12, 20, 16, 20], gap: 18 });
  const cols = twoCols(b, DESK_W - 24 - 400);
  requestHeaderCard(cols[0], { cat: "AirVent", code: "MR-2609-0042", loc: LOC, status: state });
  if (isD()) {
    const a = card(cols[1], { gap: 8 });
    text(a, "การดำเนินการ", { size: 13, w: "m", c: "muted" });
    jobActions(a, state);
  }
  problemSection(cols[0]);
  reporterSection(cols[0]);
  if (done) {
    detailSection(cols[0], "ผลการซ่อม", function (cc) {
      text(cc, "สาเหตุ", { size: 13, c: "muted" });
      text(cc, "ท่อน้ำทิ้งแอร์ตัน และน้ำยาแอร์ต่ำ", { size: 15, fillW: true });
      text(cc, "อะไหล่ที่ใช้", { size: 13, c: "muted" });
      text(cc, "น้ำยา R32 1 กก.", { size: 15 });
      text(cc, "รูปหลังซ่อม", { size: 13, c: "muted" });
      photoGrid(cc, 1, 96);
    });
  }
  detailSection(cols[1], "ความคืบหน้า", function (c) {
    const steps = [
      { label: FLOW[0], state: "done", time: "17 ก.ย. 69 14:30" },
      { label: FLOW[1], state: "done", time: "17 ก.ย. 69 15:02" },
      { label: FLOW[2], state: state === "assigned" ? "current" : "done", time: "17 ก.ย. 69 15:10", actor: "ช่างสมศักดิ์ ใจดี" },
      { label: FLOW[3], state: state === "assigned" ? "future" : done ? "done" : "current", time: state === "assigned" ? null : "18 ก.ย. 69 09:15", events: state === "waiting_parts" || done ? [{ label: "รออะไหล่", note: "สั่งน้ำยาแอร์แล้ว คาดว่าได้พรุ่งนี้", tone: "orange" }] : [] },
      { label: FLOW[4], state: done ? "current" : "future", time: done ? "19 ก.ย. 69 11:40" : null },
      { label: FLOW[5], state: "future" },
    ];
    timeline(c, steps, state === "waiting_parts" ? "orange" : done ? "green" : "blue");
  });
  if (!isD()) {
    const a = box({ name: "Job actions", gap: 8, p: [12, 20, 16, 20], fill: "page" });
    put(s.frame, a, { fillW: true });
    jobActions(a, state);
  }
  return finish(s);
}

function T03w() {
  return sheetScreen("T03w", "รออะไหล่", "T02b", function (s) {
    sheetHeader(s, "พักงานเพื่อรออะไหล่", "ผู้แจ้งจะเห็นสถานะ “รออะไหล่” พร้อมหมายเหตุนี้", "T02b");
    input(s, { label: "หมายเหตุ", value: "สั่งน้ำยาแอร์แล้ว คาดว่าได้พรุ่งนี้", multiline: true, minHeight: 80 });
    button(s, "ยืนยันรออะไหล่", { size: "lg", block: true, to: "T02c" });
  });
}

function T03() {
  return sheetScreen("T03", "บันทึกงานซ่อมเสร็จ", "T02b", function (s) {
    sheetHeader(s, "บันทึกงานซ่อมเสร็จ", "ผู้แจ้งจะได้รับแจ้งให้ตรวจสอบและยืนยัน", "T02b");
    const ph = box({ name: "Photos field", gap: 8 });
    put(s, ph, { fillW: true });
    text(ph, "รูปหลังซ่อม (1–3 รูป)", { size: 14, w: "sb" });
    photoGrid(ph, 1, 104, { addTile: "1/3" });
    input(s, { label: "สาเหตุ", value: "ท่อน้ำทิ้งแอร์ตัน ทำความสะอาดแล้ว" });
    input(s, { label: "อะไหล่ที่ใช้", optional: true, value: "น้ำยา R32 1 กก." });
    button(s, "ยืนยันซ่อมเสร็จ", { size: "lg", block: true, to: "T02f" });
  });
}

function T04() {
  const s = screen("T04", "แจ้งเตือน ช่าง", { role: "tech", nav: "notif", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "แจ้งเตือน", large: true });
  const b = body(s.col, { p: [12, 20, 24, 20], gap: 8 });
  notifList(b, [
    { kind: "job", title: "งานใหม่เข้ามา", body: "MR-2609-0042 · เครื่องปรับอากาศ · CAMT301", time: "10 นาที", unread: true, to: "T02" },
    { kind: "job", title: "งานใหม่เข้ามา", body: "MR-2609-0041 · ไฟฟ้า · RB5 อาคารเรียนรวม 5 ห้อง RB5103", time: "35 นาที", to: "T02" },
    { kind: "reopened", title: "ผู้แจ้งแจ้งว่ายังไม่หาย", body: "MR-2609-0017 · HB7 ห้อง HB7402 งานถูกส่งกลับให้เจ้าหน้าที่", time: "1 วัน", to: "T02" },
    { kind: "closed", title: "ผู้แจ้งยืนยันงานแล้ว", body: "MR-2609-0012 ปิดงานเรียบร้อย", time: "3 วัน", to: "T01f" },
  ]);
  return finish(s);
}

function T05() {
  const s = screen("T05", "โปรไฟล์ ช่าง", { role: "tech", nav: "profile", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "โปรไฟล์", subtitle: "ช่างสมศักดิ์ ใจดี", large: true });
  const b = body(s.col, { p: [16, 20, 24, 20], gap: 18 });
  const stats = box({ name: "Stats", dir: "h", gap: 10 });
  put(b, stats, { fillW: true });
  [["2", "งานค้าง"], ["14", "เสร็จใน 30 วัน"], ["4.8", "คะแนนเฉลี่ย"]].forEach(function (st) {
    const c = box({ name: "Stat/" + st[1], gap: 2, p: 14, fill: "surface", r: 16, stroke: wf() ? "line" : null });
    put(stats, c, { grow: true });
    text(c, st[0], { size: 22, w: "b" });
    text(c, st[1], { size: 13, c: "muted" });
  });
  detailSection(b, "ความถนัด", function (c) {
    const p = box({ name: "Skills", dir: "h", gap: 8 });
    put(c, p, { fillW: true });
    pill(p, "ไฟฟ้า", "purple");
    pill(p, "เครื่องปรับอากาศ", "purple");
    text(c, "ติดต่อเจ้าหน้าที่หากต้องการเปลี่ยนความถนัด", { size: 13, c: "muted", fillW: true });
  });
  detailSection(b, "ติดต่อ", function (c) {
    const r = box({ name: "Phone", dir: "h", gap: 8, cross: "CENTER" });
    put(c, r, { fillW: true });
    icon(r, "phone", 16, "muted");
    text(r, "089-111-2201", { size: 15 });
  });
  button(b, "ออกจากระบบ", { v: "danger", block: true, icon: "log-out", to: "T00" });
  return finish(s);
}

// ---------------------------------------------------------------------------
// Admin screens
// ---------------------------------------------------------------------------

function adminScreen(key, title, nav) {
  const s = screen(key, title, { role: "admin", nav: nav, colW: DESK_W });
  const m = body(s.col, { p: [isD() ? 0 : 16, 20, 24, 20], gap: 20 });
  return { s: s, m: m };
}

function adminTitle(main, title, subtitle, right) {
  const r = box({ name: "Page title", dir: isD() ? "h" : "v", gap: isD() ? 16 : 12, cross: isD() ? "CENTER" : "MIN" });
  put(main, r, { fillW: true });
  const t = box({ name: "Titles" });
  put(r, t, isD() ? { grow: true } : { fillW: true });
  text(t, title, { size: isD() ? 26 : 24, w: "b", lh: 130 });
  if (subtitle) text(t, subtitle, { size: 14, c: "muted", fillW: true });
  if (right) {
    const ctl = box({ name: "Controls", dir: "h", gap: 8, cross: "CENTER" });
    if (isD()) r.appendChild(ctl);
    else {
      put(r, ctl, { fillW: true });
      ctl.layoutWrap = "WRAP";
      ctl.counterAxisSpacing = 8;
    }
    right(ctl);
  }
  return r;
}

function kpi(parent, label, value, sub, o) {
  o = o || {};
  const c = box({ name: "KPI/" + label, gap: 6, p: isD() ? 18 : 14, fill: "surface", r: 16, stroke: wf() ? "line" : null });
  put(parent, c, { grow: true });
  const h = box({ name: "Head", dir: "h", gap: 8, cross: "CENTER" });
  put(c, h, { fillW: true });
  const ic = box({ name: "Icon", main: "CENTER", cross: "CENTER", w: 32, h: 32, r: 9, fill: o.tone ? TONE[o.tone][0] : "brandSoft" });
  icon(ic, o.icon || "clipboard", 16, o.tone ? TONE[o.tone][1] : "brand");
  h.appendChild(ic);
  text(h, label, { size: 13, w: "m", c: "muted", grow: true });
  const v = box({ name: "Value", dir: "h", gap: 6, cross: "MAX" });
  put(c, v, { fillW: true });
  text(v, value, { size: isD() ? 30 : 26, w: "b", c: o.tone === "red" ? "redI" : "ink", lh: 120 });
  if (o.unit) text(v, o.unit, { size: 14, c: "muted" });
  text(c, sub, { size: 12, c: "muted", fillW: true });
  return c;
}

function kpiGrid(main, items) {
  if (isD()) {
    const k = box({ name: "KPIs", dir: "h", gap: 16, cross: "MIN" });
    put(main, k, { fillW: true });
    items.forEach(function (it) { kpi(k, it[0], it[1], it[2], it[3]); });
    return;
  }
  // Mobile: two per row, the last one full width (grid-cols-2 in the web app).
  const g = box({ name: "KPIs", gap: 12 });
  put(main, g, { fillW: true });
  for (let i = 0; i < items.length; i += 2) {
    const row = box({ name: "KPI row", dir: "h", gap: 12, cross: "MIN" });
    put(g, row, { fillW: true });
    items.slice(i, i + 2).forEach(function (it) { kpi(row, it[0], it[1], it[2], it[3]); });
  }
}

function chartW() {
  return isD() ? (CUR_W - 20) / 2 : CUR_W - 40;
}

function chartRow(main) {
  const r = box({ name: "Charts", dir: isD() ? "h" : "v", gap: isD() ? 20 : 16, cross: "MIN" });
  put(main, r, { fillW: true });
  return r;
}

function chartCard(parent, title, build, o) {
  o = o || {};
  const c = box({ name: "Chart/" + title, gap: 14, p: isD() ? 20 : 16, fill: "surface", r: 16, stroke: wf() ? "line" : null });
  if (isD()) {
    c.layoutSizingHorizontal = "FIXED";
    c.resize(chartW(), c.height);
    parent.appendChild(c);
  } else {
    put(parent, c, { fillW: true });
  }
  const h = box({ name: "Head", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER" });
  put(c, h, { fillW: true });
  text(h, title, { size: 16, w: "b" });
  if (o.aside) text(h, o.aside, { size: 13, c: "muted" });
  build(c, (isD() ? chartW() : CUR_W) - (isD() ? 40 : 32));
  return c;
}

function svgNode(parent, svg) {
  const n = figma.createNodeFromSvg(svg);
  n.fills = [];
  parent.appendChild(n);
  return n;
}

function lineChartSvg(w, h, values) {
  const max = Math.max.apply(null, values) * 1.2;
  const step = w / (values.length - 1);
  const pts = values.map(function (v, i) {
    return (i * step).toFixed(1) + "," + (h - (v / max) * h).toFixed(1);
  });
  let grid = "";
  for (let i = 0; i <= 3; i++) grid += '<line x1="0" x2="' + w + '" y1="' + ((h / 3) * i).toFixed(1) + '" y2="' + ((h / 3) * i).toFixed(1) + '" stroke="' + hex("grid") + '"/>';
  const area = "M0," + h + " L" + pts.join(" L") + " L" + w + "," + h + " Z";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' + grid +
    '<path d="' + area + '" fill="' + hex("c1") + '" fill-opacity="0.08"/>' +
    '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + hex("c1") + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>'
  );
}

function columnsSvg(w, h, series, colors) {
  const groups = series.length;
  const per = series[0].length;
  const max = Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s); })) * 1.15;
  const gw = w / groups;
  const bw = Math.min(28, (gw * 0.6) / per);
  let out = "";
  for (let i = 0; i <= 3; i++) out += '<line x1="0" x2="' + w + '" y1="' + ((h / 3) * i).toFixed(1) + '" y2="' + ((h / 3) * i).toFixed(1) + '" stroke="' + hex("grid") + '"/>';
  series.forEach(function (s, gi) {
    const x0 = gi * gw + (gw - bw * per - 4 * (per - 1)) / 2;
    s.forEach(function (v, bi) {
      const bh = (v / max) * h;
      out += '<rect x="' + (x0 + bi * (bw + 4)).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4" fill="' + hex(colors[bi]) + '"/>';
    });
  });
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' + out + "</svg>";
}

function hBars(parent, rows, width, colorKey) {
  const max = Math.max.apply(null, rows.map(function (r) { return r[1]; }));
  const labelW = isD() ? 150 : 110;
  const barMax = width - labelW - 40;
  rows.forEach(function (r) {
    const row = box({ name: "Bar/" + r[0], dir: "h", gap: 10, cross: "CENTER" });
    put(parent, row, { fillW: true });
    const lab = box({ name: "Label", w: labelW });
    row.appendChild(lab);
    text(lab, r[0], { size: 13, fillW: true });
    rect(row, Math.max(6, Math.round((r[1] / max) * barMax)), 14, r[2] || colorKey, 4);
    text(row, String(r[1]), { size: 13, w: "sb" });
  });
}

function legend(parent, items) {
  const r = box({ name: "Legend", dir: "h", gap: 16, cross: "CENTER" });
  put(parent, r, { fillW: true });
  items.forEach(function (it) {
    const l = box({ name: "Key/" + it[0], dir: "h", gap: 6, cross: "CENTER" });
    rect(l, 10, 10, it[1], 3);
    text(l, it[0], { size: 12, c: "muted" });
    r.appendChild(l);
  });
}

function axisLabels(parent, labels) {
  const row = box({ name: "Labels", dir: "h" });
  put(parent, row, { fillW: true });
  labels.forEach(function (l) {
    const cell = box({ name: l, cross: "CENTER" });
    put(row, cell, { grow: true });
    text(cell, l, { size: 12, c: "muted" });
  });
}

function A01() {
  const a = adminScreen("A01", "แดชบอร์ด", "dash");
  const m = a.m;
  adminTitle(m, "แดชบอร์ด", "ภาพรวมงานซ่อม · 18 ส.ค. – 17 ก.ย. 69", function (r) {
    segmented(r, ["7 วัน", "30 วัน", "เดือนนี้", "กำหนดเอง"], 1, { hug: true });
    button(r, "Excel", { v: "secondary", icon: "sheet", size: "sm" });
    button(r, "PDF", { v: "secondary", icon: "file-text", size: "sm" });
  });
  kpiGrid(m, [
    ["คำร้องทั้งหมด", "43", "แจ้งเข้ามาในช่วงนี้", { icon: "clipboard" }],
    ["ยังไม่ปิดงาน", "14", "33% ของทั้งหมด", { icon: "clock", tone: "blue" }],
    ["ด่วนมากที่ยังเปิด", "3", "ควรจัดการก่อน", { icon: "alert", tone: "red" }],
    ["เวลาปิดงานเฉลี่ย", "38.5", "จาก 22 งานที่ปิด", { icon: "check-circle", tone: "green", unit: "ชม." }],
    ["ความพึงพอใจเฉลี่ย", "4.6", "จาก 19 คะแนน", { icon: "star", tone: "orange", unit: "/ 5" }],
  ]);

  const r1 = chartRow(m);
  chartCard(r1, "จำนวนคำร้องรายวัน", function (c, w) {
    svgNode(c, lineChartSvg(w, 180, [1, 2, 1, 3, 2, 4, 2, 1, 3, 5, 2, 3, 1, 2, 4, 3, 2, 1, 2, 3, 4, 2, 1, 3, 2, 1, 2, 3, 1, 2]));
  }, { aside: "30 วัน" });
  chartCard(r1, "แยกตามสถานะ", function (c, w) {
    hBars(c, [["รอรับเรื่อง", 6, "c5"], ["รับเรื่องแล้ว", 3, "c2"], ["มอบหมายช่างแล้ว", 3, "c2"], ["กำลังซ่อม", 4, "c2"], ["ซ่อมเสร็จ รอยืนยัน", 3, "c3"], ["ปิดงาน", 22, "c3"]], w, "c1");
  });

  const r2 = chartRow(m);
  chartCard(r2, "5 อาคารที่แจ้งมากที่สุด", function (c, w) {
    hBars(c, [["CAMT", 12], ["RB5 อาคารเรียนรวม 5", 9], ["HB7 คณะมนุษยศาสตร์", 6], ["หอพักนักศึกษาหญิง 3", 5], ["TLIC (ILC)", 4]], w, "c1");
  });
  chartCard(r2, "แยกตามประเภทปัญหา", function (c, w) {
    svgNode(c, columnsSvg(w, 160, [[9], [7], [11], [6], [4], [5], [1]], ["c1"]));
    axisLabels(c, ["ไฟฟ้า", "ประปา", "แอร์", "IT", "เฟอร์ฯ", "อาคาร", "อื่น ๆ"]);
  });

  const r3 = chartRow(m);
  chartCard(r3, "ภาระงานช่าง", function (c, w) {
    svgNode(c, columnsSvg(w, 150, [[2, 14], [3, 11], [1, 8]], ["c2", "c3"]));
    axisLabels(c, ["สมศักดิ์", "วิชัย", "พจน์ณิชา"]);
    legend(c, [["งานค้าง", "c2"], ["ปิดงานในช่วงนี้", "c3"]]);
  });
  chartCard(r3, "งานด่วนมากที่ค้างนานที่สุด", function (c) {
    text(c, "แตะเพื่อจัดการ", { size: 13, c: "muted" });
    const list = box({ name: "Urgent list", gap: 0 });
    put(c, list, { fillW: true });
    [["Zap", "MR-2609-0041", LOC_RB5_1, "assigned", "35 นาที"], ["Droplets", "MR-2609-0030", LOC_DORM, "in_progress", "3 วัน"], ["Building2", "MR-2609-0027", LOC_HB7, "waiting_parts", "4 วัน"]].forEach(function (u, i) {
      const r = box({ name: "Urgent/" + u[1], dir: "h", gap: 12, p: [10, 0], cross: "CENTER" });
      r.strokes = paint("line");
      r.strokeTopWeight = i === 0 ? 0 : 1;
      r.strokeBottomWeight = 0;
      r.strokeLeftWeight = 0;
      r.strokeRightWeight = 0;
      put(list, r, { fillW: true });
      catIcon(r, u[0], "sm");
      const t = box({ name: "Text" });
      put(r, t, { grow: true });
      text(t, u[1], { size: 14, w: "sb" });
      text(t, u[2], { size: 12, c: "muted", fillW: true });
      statusPill(r, u[3]);
      if (isD()) text(r, u[4], { size: 12, c: "muted" });
      link(r, "A03");
    });
    linkText(c, "ดูงานด่วนทั้งหมด", "A02", { size: 14 });
  });
  return finish(a.s);
}

const TABLE_COLS = [["เลขที่", 120], ["ประเภท", 170], ["สถานที่", 250], ["ผู้แจ้ง", 150], ["ความเร่งด่วน", 110], ["สถานะ", 150], ["ช่าง", 110]];
const TABLE_MOBILE_W = 1160;

const TABLE_ROWS = [
  ["MR-2609-0042", "AirVent", "CAMT · ชั้น 3 · CAMT301", "อนันต์ ศรีวงศ์", "normal", "pending", "—", "10 นาที"],
  ["MR-2609-0041", "Zap", "RB5 · ชั้น 1 · RB5103", "ศิริพร คำแสน", "urgent", "assigned", "สมศักดิ์", "35 นาที"],
  ["MR-2609-0039", "Droplets", "RB5 · ชั้น 2 · RB5202", "ณัฐวุฒิ ปัญญาดี", "normal", "need_info", "—", "1 วัน"],
  ["MR-2609-0035", "Monitor", "TLIC · ชั้น 2 · ILC-A204", "กมลชนก อินทร์แก้ว", "low", "in_progress", "พจน์ณิชา", "2 วัน"],
  ["MR-2609-0033", "Armchair", "BAB1 · ชั้น 3 · BAB1302", "ภูริภัทร สายสุวรรณ", "normal", "waiting_parts", "วิชัย", "2 วัน"],
  ["MR-2609-0030", "Droplets", "หอพักหญิง 3 · ห้องน้ำรวม", "ภานิชา ศรีกระจ่าง", "urgent", "in_progress", "วิชัย", "3 วัน"],
  ["MR-2609-0028", "AirVent", "HB7 · ชั้น 4 · HB7402", "สุภาวิกา นันทสุวรรณ", "normal", "completed", "สมศักดิ์", "4 วัน"],
  ["MR-2609-0021", "Zap", "สำนักหอสมุด · ห้องน้ำ", "ตรีรัตน์ จอมพันธ์", "normal", "closed", "สมศักดิ์", "6 วัน"],
  ["MR-2609-0019", "Building2", "CAMT · ชั้น 4 · CAMT401", "ธนภัทร มณีวงศ์", "low", "closed", "วิชัย", "8 วัน"],
  ["MR-2609-0015", "Ellipsis", "SCB1 · ชั้น 1 · SCB1100", "พิมพ์ชนก ทองดี", "normal", "rejected", "—", "10 วัน"],
];

function filterChip(parent, label) {
  const c = box({ name: "Filter/" + label, dir: "h", gap: 6, p: [0, 12], h: 40, r: 12, fill: "surface", cross: "CENTER", stroke: wf() ? "fillStrong" : null });
  text(c, label, { size: 14 });
  icon(c, "chevron-down", 16, "muted");
  parent.appendChild(c);
  return c;
}

function requestTable(main, rowTo) {
  adminTitle(main, "คำร้องทั้งหมด", "43 รายการ · แตะแถวเพื่อจัดการ");
  const fbar = box({ name: "Filters", dir: "h", gap: 10, cross: "CENTER" });
  put(main, fbar, { fillW: true });
  if (!isD()) {
    fbar.layoutWrap = "WRAP";
    fbar.counterAxisSpacing = 8;
  }
  const search = input(fbar, { placeholder: "ค้นหาเลขคำร้อง เช่น MR-2609", leading: "search" });
  search.layoutSizingHorizontal = "FIXED";
  search.resize(isD() ? 280 : CUR_W, search.height);
  ["ทุกสถานะ", "ทุกประเภท", "ทุกวิทยาเขต", "ทุกอาคาร", "ทุกความเร่งด่วน"].forEach(function (l) { filterChip(fbar, l); });
  linkText(fbar, "ล้างตัวกรอง", null, { size: 14 });

  // Mobile: the table keeps its width and scrolls sideways inside a clipped container.
  let host = main;
  if (!isD()) {
    host = box({ name: "Table scroller", clip: true });
    put(main, host, { fillW: true });
    host.overflowDirection = "HORIZONTAL";
  }
  const table = box({ name: "Table", fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  if (isD()) put(host, table, { fillW: true });
  else {
    table.layoutSizingHorizontal = "FIXED";
    table.resize(TABLE_MOBILE_W, table.height);
    host.appendChild(table);
  }
  const head = box({ name: "Header row", dir: "h", p: [0, 8], h: 44, fill: wf() ? "fill" : "#FAFAFB", cross: "CENTER" });
  put(table, head, { fillW: true });
  TABLE_COLS.concat([["แจ้งเมื่อ", 0]]).forEach(function (c) {
    const cell = box({ name: "Col/" + c[0], p: [0, 10], cross: "MIN" });
    if (c[1]) {
      cell.layoutSizingHorizontal = "FIXED";
      cell.resize(c[1], cell.height);
    }
    put(head, cell, { grow: !c[1] });
    text(cell, c[0], { size: 13, w: "sb", c: "muted" });
  });
  TABLE_ROWS.forEach(function (r) {
    const row = box({ name: "Row/" + r[0], dir: "h", p: [0, 8], h: 60, cross: "CENTER" });
    row.strokes = paint("line");
    row.strokeTopWeight = 1;
    row.strokeBottomWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;
    put(table, row, { fillW: true });
    const cells = [
      function (c) { text(c, r[0], { size: 14, w: "sb" }); },
      function (c) { const x = box({ name: "Cat", dir: "h", gap: 8, cross: "CENTER" }); catIcon(x, r[1], "sm"); text(x, CATEGORY[r[1]].name, { size: 14 }); c.appendChild(x); },
      function (c) { text(c, r[2], { size: 14 }); },
      function (c) { text(c, r[3], { size: 14 }); },
      function (c) { urgencyPill(c, r[4]); },
      function (c) { statusPill(c, r[5]); },
      function (c) { text(c, r[6], { size: 14, c: r[6] === "—" ? "muted" : "ink" }); },
      function (c) { text(c, r[7], { size: 13, c: "muted" }); },
    ];
    cells.forEach(function (build, ci) {
      const w = ci < TABLE_COLS.length ? TABLE_COLS[ci][1] : 0;
      const cell = box({ name: "Cell", dir: "h", p: [0, 10], cross: "CENTER" });
      if (w) {
        cell.layoutSizingHorizontal = "FIXED";
        cell.resize(w, cell.height);
      }
      put(row, cell, { grow: !w });
      build(cell);
    });
    if (rowTo) link(row, rowTo);
  });
  return table;
}

function A02() {
  const a = adminScreen("A02", "คำร้องทั้งหมด", "requests");
  requestTable(a.m, "A03");
  return finish(a.s);
}

// Right side panel (desktop) or full-screen panel (mobile) over a copy of the request table.
function panelScreen(key, title, build) {
  const W = isD() ? DW : MW;
  const H = isD() ? DH : MH;
  const pw = isD() ? 560 : MW;
  const f = figma.createFrame();
  f.name = K(key) + " · " + title;
  f.resize(W, H);
  f.fills = paint("page");
  f.clipsContent = true;
  const base = SCREENS[K("A02")];
  const bg = base.clone();
  f.appendChild(bg);
  bg.x = 0;
  bg.y = 0;
  bg.name = "Background · " + base.name;
  const dim = figma.createRectangle();
  dim.name = "Backdrop";
  dim.resize(W, H);
  dim.fills = paint("backdrop", 0.3);
  f.appendChild(dim);
  const p = box({ name: "Side panel", gap: 16, p: isD() ? [20, 24, 24, 24] : [0, 20, 24, 20], fill: "page", w: pw, clip: true });
  p.layoutSizingVertical = "FIXED";
  p.resize(pw, H);
  shadow(p, 0, 30, 0.15);
  f.appendChild(p);
  p.x = W - pw;
  p.y = 0;
  // Mobile: the panel covers the whole phone, so it carries the status bar itself.
  if (!isD()) statusBar(p);
  build(p);
  SCREENS[K(key)] = f;
  return f;
}

function panelHead(p, closeTo) {
  const h = box({ name: "Panel header", dir: "h", gap: 12, cross: "CENTER" });
  put(p, h, { fillW: true });
  const t = box({ name: "Titles" });
  put(h, t, { grow: true });
  text(t, "MR-2609-0042", { size: 20, w: "b" });
  text(t, "แจ้งโดย อนันต์ ศรีวงศ์ · 17 ก.ย. 69 14:30", { size: 13, c: "muted", fillW: true });
  const x = box({ name: "Close", main: "CENTER", cross: "CENTER", w: 40, h: 40, r: 20, fill: "surface" });
  x.cornerRadius = 20;
  icon(x, "x", 20, "muted");
  h.appendChild(x);
  link(x, closeTo);
}

// state: pending | accepted
function panelDetail(key, state) {
  return panelScreen(key, state === "pending" ? "จัดการคำร้อง รอรับเรื่อง" : "จัดการคำร้อง รับเรื่องแล้ว", function (p) {
    panelHead(p, "A02");
    requestHeaderCard(p, { cat: "AirVent", code: "MR-2609-0042", loc: LOC, status: state });
    const act = box({ name: "Actions", gap: 10 });
    put(p, act, { fillW: true });
    text(act, "การดำเนินการ", { size: 13, w: "m", c: "muted" });
    const u = box({ name: "Urgency", dir: "h", gap: 10, cross: "CENTER" });
    put(act, u, { fillW: true });
    text(u, "ความเร่งด่วน", { size: 14, w: "sb" });
    segmented(u, ["ไม่ด่วน", "ปกติ", "ด่วนมาก"], 1, { hug: true });
    const r1 = box({ name: "Primary actions", dir: "h", gap: 8 });
    put(act, r1, { fillW: true });
    if (state === "pending") button(r1, "รับเรื่อง", { grow: true, to: "A03a" });
    else button(r1, "มอบหมายช่าง", { grow: true, icon: "user", to: "A03b" });
    button(r1, "ขอข้อมูลเพิ่ม", { v: "secondary", grow: true });
    const r2 = box({ name: "Other actions", dir: "h", gap: 8 });
    put(act, r2, { fillW: true });
    button(r2, "รวมคำร้องซ้ำ", { v: "secondary", grow: true });
    button(r2, "ปฏิเสธ", { v: "danger", grow: true });
    const d = card(p, { gap: 8 });
    text(d, DESC, { size: 15, fillW: true, lh: 160 });
    photoGrid(d, 2, 96);
    const rp = card(p, { gap: 8, dir: "h", cross: "CENTER" });
    const av = circle(rp, 36, "fill");
    icon(av, "user", 18, "muted");
    const rt = box({ name: "Text" });
    put(rp, rt, { grow: true });
    text(rt, "อนันต์ ศรีวงศ์", { size: 14, w: "sb" });
    text(rt, "CAMT · 089-123-4567", { size: 13, c: "muted" });
  });
}

function A03b() {
  return panelScreen("A03b", "มอบหมายช่าง", function (p) {
    panelHead(p, "A02");
    const h = box({ name: "Title", gap: 4 });
    put(p, h, { fillW: true });
    text(h, "เลือกช่าง", { size: 18, w: "b" });
    text(h, "เรียงจากความถนัดตรงกับ “เครื่องปรับอากาศ” และงานค้างน้อยที่สุด", { size: 14, c: "muted", fillW: true });
    const list = groupList(p);
    [
      ["สมศักดิ์ ใจดี", "ไฟฟ้า · เครื่องปรับอากาศ", 2, true, true],
      ["พจน์ณิชา ทองย้อย", "อุปกรณ์ IT · อื่น ๆ · ไฟฟ้า", 1, false, false],
      ["วิชัย ศรีสุข", "ประปา · อาคารและสถานที่ · เฟอร์นิเจอร์", 3, false, false],
    ].forEach(function (t, i, arr) {
      listRow(list, {
        iconName: "user",
        label: "ช่าง" + t[0],
        detail: t[1],
        check: t[4],
        last: i === arr.length - 1,
        trailing: function (r) {
          const tags = box({ name: "Tags", dir: isD() ? "h" : "v", gap: 6, cross: isD() ? "CENTER" : "MAX" });
          if (t[3]) pill(tags, "เหมาะสมที่สุด", "green");
          pill(tags, "งานค้าง " + t[2], "gray");
          r.appendChild(tags);
        },
      });
    });
    const row = box({ name: "Buttons", dir: "h", gap: 8 });
    put(p, row, { fillW: true });
    button(row, "ยกเลิก", { v: "secondary", grow: true, to: "A03a" });
    button(row, "ยืนยันมอบหมาย", { grow: true, to: "A02" });
  });
}

function settingsScreen(key, title, tab, build) {
  const a = adminScreen(key, title, "settings");
  adminTitle(a.m, "ข้อมูลพื้นฐาน", "แก้ไขประเภทปัญหา สถานที่ และบัญชีช่าง ได้โดยไม่ต้องแก้โค้ด");
  const seg = segmented(a.m, ["ประเภทปัญหา", "สถานที่", "บัญชีช่าง"], tab, { hug: isD(), links: ["A04", "A04b", "A04c"] });
  seg.name = "Tabs";
  build(a.m);
  return finish(a.s);
}

function columnCard(parent, title, addLabel, width) {
  const c = box({ name: "Column/" + title, fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  if (isD() && width) {
    c.layoutSizingHorizontal = "FIXED";
    c.resize(width, c.height);
    parent.appendChild(c);
  } else if (isD() && parent.layoutMode === "HORIZONTAL") {
    put(parent, c, { grow: true });
  } else {
    put(parent, c, { fillW: true });
  }
  const h = box({ name: "Head", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER", p: [12, 16, 4, 16] });
  put(c, h, { fillW: true });
  text(h, title, { size: 15, w: "b" });
  if (addLabel) linkText(h, addLabel, null, { icon: "plus", iconSize: 16, size: 14 });
  return c;
}

function settingRow(parent, o) {
  const r = box({ name: "Setting/" + o.label, dir: "h", gap: 12, p: [8, 12, 8, 16], cross: "CENTER", fill: o.selected ? "brandSoft" : null });
  put(parent, r, { fillW: true });
  r.minHeight = 52;
  if (o.cat) catIcon(r, o.cat, "sm");
  const t = box({ name: "Text" });
  put(r, t, { grow: true });
  text(t, o.label, { size: 15, w: o.selected ? "sb" : "r", c: o.selected ? "brand" : "ink", fillW: true });
  if (o.detail) text(t, o.detail, { size: 13, c: "muted", fillW: true });
  if (o.pill) pill(r, o.pill[0], o.pill[1]);
  if (o.chevron) icon(r, "chevron-right", 16, "muted");
  const e = box({ name: "Edit", main: "CENTER", cross: "CENTER", w: 40, h: 40 });
  icon(e, "pencil", 16, "muted");
  r.appendChild(e);
  return r;
}

function A04() {
  return settingsScreen("A04", "ข้อมูลพื้นฐาน ประเภทปัญหา", 0, function (m) {
    const c = columnCard(m, "ประเภทปัญหา (7)", "เพิ่มประเภท", 640);
    Object.keys(CATEGORY).forEach(function (k) {
      settingRow(c, { cat: k, label: CATEGORY[k].name, pill: ["เปิดใช้งาน", "green"] });
    });
    spacer(c, 8);
  });
}

function A04b() {
  return settingsScreen("A04b", "ข้อมูลพื้นฐาน สถานที่", 1, function (m) {
    const row = box({ name: "Columns", dir: isD() ? "h" : "v", gap: 16, cross: "MIN" });
    put(m, row, { fillW: true });
    const c1 = columnCard(row, "วิทยาเขต (3)", "เพิ่ม");
    settingRow(c1, { label: "วิทยาเขตสวนสัก", detail: "71 อาคาร", selected: true, chevron: true });
    settingRow(c1, { label: "วิทยาเขตสวนดอก", detail: "11 อาคาร", chevron: true });
    settingRow(c1, { label: "วิทยาเขตแม่เหียะ", detail: "5 อาคาร", chevron: true });
    spacer(c1, 8);
    const c2 = columnCard(row, "อาคาร", "เพิ่ม");
    ["RB1 อาคารเรียนรวม 1 (ทรงกลม)", "RB5 อาคารเรียนรวม 5", "HB7 คณะมนุษยศาสตร์ (8 ชั้น)", CAMT, "TLIC ศูนย์นวัตกรรมการเรียนการสอน", "สำนักหอสมุด (Main Library)"].forEach(function (b) {
      settingRow(c2, { label: b, selected: b === CAMT, chevron: true });
    });
    spacer(c2, 8);
    const c3 = columnCard(row, "ห้อง", "เพิ่ม");
    [["CAMT101", 1], ["CAMT102", 1], ["CAMT Auditorium", 1], ["CAMT201", 2], ["CAMT301", 3], ["Lab Game", 3], ["CAMT401", 4]].forEach(function (r) {
      settingRow(c3, { label: r[0], detail: "ชั้น " + r[1] });
    });
    spacer(c3, 8);
  });
}

function A04c() {
  return settingsScreen("A04c", "ข้อมูลพื้นฐาน บัญชีช่าง", 2, function (m) {
    const c = columnCard(m, "บัญชีช่าง (3)", "เพิ่มช่าง", 760);
    settingRow(c, { label: "สมศักดิ์ ใจดี", detail: "tech01 · 089-111-2201 · ไฟฟ้า, เครื่องปรับอากาศ", pill: ["เปิดใช้งาน", "green"] });
    settingRow(c, { label: "วิชัย ศรีสุข", detail: "tech02 · 089-111-2202 · ประปา, อาคารและสถานที่, เฟอร์นิเจอร์", pill: ["เปิดใช้งาน", "green"] });
    settingRow(c, { label: "พจน์ณิชา ทองย้อย", detail: "pojnicha.t · ไม่มีเบอร์ · อุปกรณ์ IT, อื่น ๆ, ไฟฟ้า", pill: ["เปิดใช้งาน", "green"] });
    spacer(c, 8);
  });
}

// ---------------------------------------------------------------------------
// Page assembly
// ---------------------------------------------------------------------------

const REPORTER = [
  function () { return loginScreen("R01", "R02", "R01b", "anan.s"); },
  R01b, R02, R03, R04, R05, R05b, R06, R07, R08, R09, R09b, R10, R11, R12, R13, R14, R15,
];
const TECH = [
  function () { return loginScreen("T00", "T01", null, "tech01"); },
  T01,
  T01f,
  function () { return techDetail("T02", "assigned"); },
  function () { return techDetail("T02b", "in_progress"); },
  function () { return techDetail("T02c", "waiting_parts"); },
  function () { return techDetail("T02f", "completed"); },
  T03w, T03, T04, T05,
];
const ADMIN = [
  function () { return loginScreen("A00", "A01", null, "admin01"); },
  A01, A02,
  function () { return panelDetail("A03", "pending"); },
  function () { return panelDetail("A03a", "accepted"); },
  A03b, A04, A04b, A04c,
];

const GROUPS = [
  { title: "ผู้แจ้ง · มือถือ 390 × 844", device: "m", screens: REPORTER, note: "เข้าสู่ระบบ → ตั้งโปรไฟล์ → แจ้งซ่อม 4 ขั้น → ติดตามสถานะ → ยืนยัน/ให้คะแนน" },
  { title: "ผู้แจ้ง · เดสก์ท็อป 1440 × 900", device: "d", screens: REPORTER, note: "หน้าเดียวกันบนจอคอม: แถบเมนูซ้าย หน้าแรกและหน้าติดตามแบ่ง 2 คอลัมน์" },
  { title: "ช่าง · มือถือ 390 × 844", device: "m", screens: TECH, note: "เข้าสู่ระบบ → งานใหม่ → รับงาน → รออะไหล่ → ซ่อมเสร็จ แนบรูปหลังซ่อม → งานเสร็จแล้ว" },
  { title: "ช่าง · เดสก์ท็อป 1440 × 900", device: "d", screens: TECH, note: "หน้าเดียวกันบนจอคอม: ปุ่มดำเนินการอยู่คอลัมน์ขวาคู่กับไทม์ไลน์" },
  { title: "ผู้ดูแลระบบ · มือถือ 390 × 844", device: "m", screens: ADMIN, note: "เมนูด้านบน · ตารางเลื่อนซ้าย-ขวา · แผงจัดการเต็มจอ" },
  { title: "ผู้ดูแลระบบ · เดสก์ท็อป 1440 × 900", device: "d", screens: ADMIN, note: "แดชบอร์ด → คำร้องทั้งหมด → รับเรื่อง → มอบหมายช่าง · ข้อมูลพื้นฐาน" },
];

const FLOWS = [
  ["R01", "1 · ผู้แจ้ง · มือถือ"],
  ["R01d", "2 · ผู้แจ้ง · เดสก์ท็อป"],
  ["T00", "3 · ช่าง · มือถือ"],
  ["T00d", "4 · ช่าง · เดสก์ท็อป"],
  ["A00", "5 · ผู้ดูแลระบบ · มือถือ"],
  ["A00d", "6 · ผู้ดูแลระบบ · เดสก์ท็อป"],
];

const GAP_X = 96;
const GAP_Y = 160;

function selectedGroups(opts) {
  return GROUPS.filter(function (g) { return (g.device === "m" && opts.mobile !== false) || (g.device === "d" && opts.desktop !== false); });
}

async function buildPage(page, label, groups, done, total) {
  ICON_CACHE = {};
  ICON_HOLDER = figma.createFrame();
  ICON_HOLDER.name = "_icons";
  ICON_HOLDER.fills = [];
  ICON_HOLDER.x = -5000;
  ICON_HOLDER.y = -5000;
  LINKS = [];
  SCREENS = {};

  const titleFrame = box({ name: "Title", gap: 6 });
  text(titleFrame, "แจ้งซ่อม มช. — " + label, { size: 48, w: "b" });
  text(titleFrame, "สร้างจากเว็บจริงด้วยปลั๊กอิน · แต่ละกลุ่มเป็น Flow แยกกัน เปิดแท็บ Prototype เพื่อดูเส้น Interaction · ฟอนต์: " + FONT_FAMILY, { size: 20, c: "muted" });
  titleFrame.x = 0;
  titleFrame.y = -220;

  let y = 0;
  for (const g of groups) {
    DEVICE = g.device;
    const frames = [];
    for (const build of g.screens) {
      frames.push(build());
      done++;
      figma.ui.postMessage({ type: "progress", text: label + ": สร้างหน้า " + done + "/" + total });
      if (done % 4 === 0) await new Promise(function (r) { setTimeout(r, 0); });
    }
    // Lay out in rows (desktop frames wrap every 6 to keep the canvas manageable).
    const perRow = g.device === "m" ? 18 : 6;
    let x = 0;
    let rowTop = y + 120;
    let rowH = 0;
    let maxX = 0;
    frames.forEach(function (fr, i) {
      if (i > 0 && i % perRow === 0) {
        rowTop += rowH + GAP_X;
        x = 0;
        rowH = 0;
      }
      fr.x = x;
      fr.y = rowTop;
      x += fr.width + GAP_X;
      maxX = Math.max(maxX, x);
      rowH = Math.max(rowH, fr.height);
    });
    const bottom = rowTop + rowH;
    let container = null;
    if (typeof figma.createSection === "function") {
      container = figma.createSection();
      container.name = g.title;
      container.x = -80;
      container.y = y - 40;
      page.appendChild(container);
      for (const fr of frames) {
        const ax = fr.x;
        const ay = fr.y;
        container.appendChild(fr);
        fr.x = ax + 80;
        fr.y = ay - y + 40;
      }
      container.resizeWithoutConstraints(maxX - GAP_X + 160, bottom - y + 120);
    }
    const heading = box({ name: "Group heading/" + g.title, gap: 4 });
    text(heading, g.title, { size: 32, w: "b" });
    text(heading, g.note, { size: 18, c: "muted" });
    if (container) {
      container.appendChild(heading);
      heading.x = 80;
      heading.y = 30;
    } else {
      heading.x = 0;
      heading.y = y;
    }
    y = bottom + GAP_Y + 80;
  }
  ICON_HOLDER.remove();
  return done;
}

async function run(opts) {
  figma.ui.postMessage({ type: "progress", text: "กำลังโหลดฟอนต์..." });
  await loadFonts();
  const jobs = [];
  if (opts.ui) jobs.push({ mode: "ui", name: "UI — แจ้งซ่อม มช.", label: "UI" });
  if (opts.wf) jobs.push({ mode: "wf", name: "Wireframe — แจ้งซ่อม มช.", label: "Wireframe" });
  const groups = selectedGroups(opts);
  const perJob = groups.reduce(function (n, g) { return n + g.screens.length; }, 0);
  const total = perJob * jobs.length;
  let done = 0;
  const summary = [];
  let lastPage = null;
  for (const job of jobs) {
    MODE = job.mode;
    const old = figma.root.children.filter(function (p) { return p.name === job.name; });
    const page = figma.createPage();
    page.name = opts.replace || old.length === 0 ? job.name : job.name + " (" + (old.length + 1) + ")";
    await figma.setCurrentPageAsync(page);
    if (opts.replace) old.forEach(function (p) { p.remove(); });
    done = await buildPage(page, job.label, groups, done, total);
    let links = 0;
    if (opts.proto) {
      figma.ui.postMessage({ type: "progress", text: job.label + ": กำลังโยงเส้น Interaction..." });
      links = await wire(page, FLOWS);
    }
    summary.push(job.label + " " + Object.keys(SCREENS).length + " หน้า" + (opts.proto ? " · " + links + " เส้น" : ""));
    if (opts.proto && WIRE_FAILED.length) {
      summary.push(job.label + " ข้าม " + WIRE_FAILED.length + " เส้น (" + WIRE_FAILED.slice(0, 3).join(", ") + ")");
    }
    lastPage = page;
  }
  if (lastPage) {
    await figma.setCurrentPageAsync(lastPage);
    figma.viewport.scrollAndZoomIntoView(lastPage.children);
  }
  const msg = "เสร็จแล้ว: " + summary.join(" | ") + (FONT_FAMILY === "Inter" ? "\nไม่พบฟอนต์ภาษาไทย ข้อความไทยอาจแสดงผิด ติดตั้ง IBM Plex Sans Thai แล้วรันใหม่" : "");
  figma.ui.postMessage({ type: "done", text: msg });
  figma.notify("สร้างเสร็จ " + summary.join(" | "));
}
